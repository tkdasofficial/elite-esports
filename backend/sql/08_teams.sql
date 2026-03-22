-- ============================================================
-- 08_teams.sql
-- Teams and team members tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  tag         TEXT NOT NULL,
  leader_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS public.team_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'Member' CHECK (role IN ('Leader', 'Member')),
  rank        TEXT NOT NULL DEFAULT 'Bronze',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
