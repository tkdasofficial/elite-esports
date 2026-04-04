-- Migration 013: Add game_mode and squad_type to matches table
-- Also creates match_modes table for admin-configurable mode types
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── 1. Add game_mode and squad_type columns to matches ───────────────────────

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS game_mode  TEXT,
  ADD COLUMN IF NOT EXISTS squad_type TEXT;

-- ─── 2. Create match_modes table (admin-configurable mode types) ──────────────

CREATE TABLE IF NOT EXISTS public.match_modes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.match_modes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mm_select" ON public.match_modes;
DROP POLICY IF EXISTS "mm_admin"  ON public.match_modes;

CREATE POLICY "mm_select" ON public.match_modes FOR SELECT USING (true);
CREATE POLICY "mm_admin"  ON public.match_modes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- ─── 3. Create squad_types table (admin-configurable squad types) ─────────────

CREATE TABLE IF NOT EXISTS public.squad_types (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.squad_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "st_select" ON public.squad_types;
DROP POLICY IF EXISTS "st_admin"  ON public.squad_types;

CREATE POLICY "st_select" ON public.squad_types FOR SELECT USING (true);
CREATE POLICY "st_admin"  ON public.squad_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- ─── 4. Seed default mode types ───────────────────────────────────────────────

INSERT INTO public.match_modes (name, sort_order) VALUES
  ('Full Map',      1),
  ('TDM',           2),
  ('PVP',           3),
  ('Battle Royale', 4),
  ('Clash Squad',   5),
  ('Ranked',        6)
ON CONFLICT (name) DO NOTHING;

-- ─── 5. Seed default squad types ──────────────────────────────────────────────

INSERT INTO public.squad_types (name, sort_order) VALUES
  ('Solo',  1),
  ('Duo',   2),
  ('3v3',   3),
  ('4v4',   4),
  ('Squad', 5)
ON CONFLICT (name) DO NOTHING;
