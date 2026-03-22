-- ============================================================
-- 07_game_profiles.sql
-- User in-game profiles (IGN / UID per game)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.game_profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_name   TEXT NOT NULL,
  ign         TEXT NOT NULL,
  uid         TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, game_name)
);

CREATE INDEX idx_game_profiles_user ON public.game_profiles(user_id);

CREATE TRIGGER game_profiles_updated_at
  BEFORE UPDATE ON public.game_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
