-- ─────────────────────────────────────────────────────────────────────────────
-- Elite eSports — Missing Tables & Columns Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. ADD MISSING COLUMNS TO EXISTING TABLES ───────────────────────────────

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── 2. TEAMS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  tag        TEXT NOT NULL CHECK (char_length(tag) <= 5),
  game       TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin"  ON public.teams;

CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON public.teams FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ─── 3. TEAM MEMBERS ──────────────────────────────────────────────────────────
-- Created BEFORE the teams_update policy so the cross-table reference works
CREATE TABLE IF NOT EXISTS public.team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE USING (auth.uid() = user_id);

-- Now safe to add the teams_update policy that references team_members
CREATE POLICY "teams_update" ON public.teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'captain'
    )
  );
CREATE POLICY "teams_admin" ON public.teams FOR ALL
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ─── 4. BROADCASTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title   TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broadcasts_select" ON public.broadcasts;
DROP POLICY IF EXISTS "broadcasts_admin"  ON public.broadcasts;

CREATE POLICY "broadcasts_select" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "broadcasts_admin" ON public.broadcasts FOR ALL
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- ─── 5. ENABLE REALTIME FOR KEY TABLES ────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- ─── 6. STORAGE BUCKET FOR GAME BANNERS ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('game-banners', 'game-banners', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "banners_read"   ON storage.objects;
DROP POLICY IF EXISTS "banners_insert" ON storage.objects;
DROP POLICY IF EXISTS "banners_delete" ON storage.objects;

CREATE POLICY "banners_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-banners');
CREATE POLICY "banners_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
CREATE POLICY "banners_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'game-banners'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
