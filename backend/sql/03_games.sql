-- ============================================================
-- 03_games.sql
-- Games catalogue table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.games (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Battle Royale',
  logo        TEXT DEFAULT '',
  banner      TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  matches     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial games
INSERT INTO public.games (name, category, status) VALUES
  ('Free Fire',        'Battle Royale', 'active'),
  ('BGMI',             'Battle Royale', 'active'),
  ('Call of Duty',     'FPS',           'active'),
  ('Clash Royale',     'Strategy',      'active'),
  ('Valorant',         'FPS',           'active'),
  ('Chess',            'Strategy',      'active')
ON CONFLICT DO NOTHING;
