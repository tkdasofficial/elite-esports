-- =============================================================================
--  Elite eSports — Teams Complete Setup
--  Paste ALL of this into:
--    Supabase Dashboard → SQL Editor → New query → Run All
--
--  ✅ Safe to run on a FRESH or EXISTING database.
--     Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS.
-- =============================================================================


-- ─── 1. TEAMS TABLE ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  tag        TEXT        NOT NULL DEFAULT '' CHECK (char_length(tag) <= 5),
  slogan     TEXT        NOT NULL DEFAULT '',
  avatar     TEXT        NOT NULL DEFAULT '0',
  code       TEXT        UNIQUE,
  game       TEXT        NOT NULL DEFAULT '',
  created_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns that may be missing on existing tables
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS slogan     TEXT        NOT NULL DEFAULT '';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS avatar     TEXT        NOT NULL DEFAULT '0';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS code       TEXT        UNIQUE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS game       TEXT        NOT NULL DEFAULT '';

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin"  ON public.teams;

CREATE POLICY "teams_select" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = created_by);


-- ─── 2. TEAM_MEMBERS TABLE ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.team_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('captain','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tm_select"         ON public.team_members;
DROP POLICY IF EXISTS "tm_insert_own"     ON public.team_members;
DROP POLICY IF EXISTS "tm_delete_own"     ON public.team_members;
DROP POLICY IF EXISTS "tm_delete_captain" ON public.team_members;

CREATE POLICY "tm_select" ON public.team_members
  FOR SELECT USING (true);

CREATE POLICY "tm_insert_own" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Captain can kick any member; member can leave themselves
CREATE POLICY "tm_delete_captain" ON public.team_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'captain'
    )
  );


-- ─── 3. TEAMS UPDATE POLICY (requires team_members to exist) ─────────────────

CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'captain'
    )
  );

CREATE POLICY "teams_admin" ON public.teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );


-- ─── 4. REALTIME ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
  EXCEPTION WHEN others THEN NULL;
  END;
END;
$$;


-- =============================================================================
-- DONE. Tables created: teams, team_members
-- RLS policies applied. Realtime enabled.
-- =============================================================================
