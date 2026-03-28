-- =============================================================================
-- Elite eSports — Complete Backend Setup
-- Paste the entire contents into:
--   Supabase Dashboard → SQL Editor → New query → Run All
-- Safe to run multiple times (all statements are idempotent).
-- =============================================================================


-- ─── SECTION 1: ADD MISSING COLUMNS TO EXISTING TABLES ───────────────────────

-- users table is missing updated_at (used by profile save)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ─── SECTION 2: CREATE MISSING TABLE — teams ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  tag        TEXT        NOT NULL CHECK (char_length(tag) <= 5),
  game       TEXT        NOT NULL,
  created_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policies for teams (basic insert + select; update policy added after team_members exists)
DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin"  ON public.teams;

CREATE POLICY "teams_select" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = created_by);


-- ─── SECTION 3: CREATE MISSING TABLE — team_members ──────────────────────────
-- Must be created BEFORE the teams_update policy (which references this table)

CREATE TABLE IF NOT EXISTS public.team_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;

CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT USING (true);

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE USING (auth.uid() = user_id);


-- ─── SECTION 4: ADD REMAINING teams POLICIES (requires team_members to exist) ─

CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = teams.id
        AND user_id = auth.uid()
        AND role = 'captain'
    )
  );

CREATE POLICY "teams_admin" ON public.teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );


-- ─── SECTION 5: ENABLE REALTIME (safe — skips tables already in publication) ──
-- Uses exception handling so re-running never throws an error.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'matches',
    'notifications',
    'wallets',
    'wallet_transactions'
  ] LOOP
    BEGIN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl
      );
    EXCEPTION WHEN others THEN
      -- Table is already a member of the publication — safe to ignore
      NULL;
    END;
  END LOOP;
END;
$$;


-- ─── SECTION 6: STORAGE BUCKET FOR GAME BANNERS ──────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('game-banners', 'game-banners', true)
  ON CONFLICT (id) DO NOTHING;

-- Drop & recreate storage policies so they are always up to date
DROP POLICY IF EXISTS "game_banners_read"   ON storage.objects;
DROP POLICY IF EXISTS "game_banners_insert" ON storage.objects;
DROP POLICY IF EXISTS "game_banners_delete" ON storage.objects;

CREATE POLICY "game_banners_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-banners');

CREATE POLICY "game_banners_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "game_banners_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );


-- ─── SECTION 7: SEED DEFAULT app_settings ROW (if empty) ─────────────────────

INSERT INTO public.app_settings (id, min_deposit, max_deposit, min_withdraw, max_withdraw)
  SELECT gen_random_uuid(), 10, 50000, 50, 50000
  WHERE NOT EXISTS (SELECT 1 FROM public.app_settings)
  LIMIT 1;


-- ─── SECTION 8: SEED DEFAULT ad_settings ROW (if empty) ─────────────────────

INSERT INTO public.ad_settings (id, ads_enabled, default_cooldown)
  SELECT gen_random_uuid(), false, 60
  WHERE NOT EXISTS (SELECT 1 FROM public.ad_settings)
  LIMIT 1;


-- =============================================================================
-- DONE. The following objects were created / updated:
--   • users.updated_at column added
--   • teams table created (with RLS policies)
--   • team_members table created (with RLS policies)
--   • Realtime enabled for: matches, notifications, wallets, wallet_transactions
--   • Storage bucket "game-banners" created (public read, admin write)
--   • Default rows seeded in app_settings and ad_settings
-- =============================================================================
