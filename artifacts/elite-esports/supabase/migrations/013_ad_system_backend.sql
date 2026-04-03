-- =============================================================================
--  Elite eSports — Migration 013: Ad System Backend Cleanup
--  Run in: Supabase Dashboard → SQL Editor → New query → Run
--
--  Ensures the ad system tables (ad_units, ad_triggers, ad_settings) are
--  consistent, have the correct column names, constraints, and seed data.
--  Safe to run multiple times — all statements are idempotent.
-- =============================================================================


-- ─── 1. ad_units ─────────────────────────────────────────────────────────────
-- Ensure table exists with all required columns

CREATE TABLE IF NOT EXISTS public.ad_units (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL CHECK (type IN ('interstitial', 'rewarded', 'app_open')),
  ad_unit_id TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ad_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "au_select" ON public.ad_units;
DROP POLICY IF EXISTS "au_admin"  ON public.ad_units;

CREATE POLICY "au_select" ON public.ad_units FOR SELECT USING (true);
CREATE POLICY "au_admin"  ON public.ad_units FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─── 2. ad_triggers ──────────────────────────────────────────────────────────
-- Canonical schema: uses trigger_type (not the reserved keyword "trigger")

CREATE TABLE IF NOT EXISTS public.ad_triggers (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type     TEXT    NOT NULL
                           CHECK (trigger_type IN ('join_match', 'leave_match', 'app_open', 'reward_claim')),
  ad_unit_id       UUID    REFERENCES public.ad_units(id) ON DELETE SET NULL,
  enabled          BOOLEAN NOT NULL DEFAULT true,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- If the table was previously created with the reserved-word column "trigger",
-- rename it to trigger_type (safe: only runs if the old column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ad_triggers'
      AND column_name  = 'trigger'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'ad_triggers'
      AND column_name  = 'trigger_type'
  ) THEN
    ALTER TABLE public.ad_triggers RENAME COLUMN "trigger" TO trigger_type;
  END IF;
END;
$$;

-- Add created_at if missing
ALTER TABLE public.ad_triggers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.ad_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "at_select" ON public.ad_triggers;
DROP POLICY IF EXISTS "at_admin"  ON public.ad_triggers;

CREATE POLICY "at_select" ON public.ad_triggers FOR SELECT USING (true);
CREATE POLICY "at_admin"  ON public.ad_triggers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─── 3. ad_settings ──────────────────────────────────────────────────────────
-- Ensure UUID primary key version exists (migration 001 used INTEGER, backend_setup used UUID)

CREATE TABLE IF NOT EXISTS public.ad_settings (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  ads_enabled      BOOLEAN NOT NULL DEFAULT false,
  default_cooldown INTEGER NOT NULL DEFAULT 60
);

ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aset_select" ON public.ad_settings;
DROP POLICY IF EXISTS "aset_admin"  ON public.ad_settings;
DROP POLICY IF EXISTS "ad_settings_admin" ON public.ad_settings;

CREATE POLICY "aset_select" ON public.ad_settings FOR SELECT USING (true);
CREATE POLICY "aset_admin"  ON public.ad_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Seed a single row if none exists
INSERT INTO public.ad_settings (ads_enabled, default_cooldown)
  SELECT false, 60
  WHERE NOT EXISTS (SELECT 1 FROM public.ad_settings);


-- ─── 4. Seed default trigger rows ────────────────────────────────────────────
-- One row per trigger type. Disabled by default — admin enables them and
-- assigns ad_unit_id from the dashboard. ON CONFLICT keeps existing settings.

INSERT INTO public.ad_triggers (trigger_type, enabled, cooldown_seconds)
  VALUES
    ('app_open',     false, 3600),
    ('join_match',   false,   60),
    ('leave_match',  false,   60),
    ('reward_claim', false,   60)
  ON CONFLICT DO NOTHING;


-- ─── 5. Enable Realtime on ad_settings so the app reacts to admin changes ───

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_settings;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_units;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_triggers;
  EXCEPTION WHEN others THEN NULL;
  END;
END;
$$;


-- =============================================================================
-- DONE. Summary of changes:
--   • ad_units table ensured with status column (active/inactive filter)
--   • ad_triggers table ensured with trigger_type column
--     (auto-renames reserved "trigger" column if it exists)
--   • ad_settings table ensured with UUID PK + single seeded row
--   • Default trigger rows seeded for all 4 trigger types (disabled by default)
--   • Realtime enabled for ad_settings, ad_units, ad_triggers
-- =============================================================================
