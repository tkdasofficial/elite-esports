-- ============================================================
-- 04_matches.sql
-- Tournament matches table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.matches (
  match_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_name      TEXT NOT NULL,
  title          TEXT NOT NULL,
  mode           TEXT NOT NULL DEFAULT '1v1' CHECK (mode IN ('1v1', '2v2', '4v4', 'Squad')),
  banner_image   TEXT DEFAULT '',
  team1_name     TEXT DEFAULT '',
  team2_name     TEXT DEFAULT '',
  team1_logo     TEXT DEFAULT '',
  team2_logo     TEXT DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('live', 'upcoming', 'completed')),
  start_time     TIMESTAMPTZ NOT NULL,
  end_time       TIMESTAMPTZ,
  entry_fee      TEXT NOT NULL DEFAULT '₹0',
  prize          TEXT NOT NULL DEFAULT '₹0',
  slots_total    INTEGER NOT NULL DEFAULT 100,
  slots_filled   INTEGER NOT NULL DEFAULT 0,
  team1_score    INTEGER DEFAULT 0,
  team2_score    INTEGER DEFAULT 0,
  completed_at   TIMESTAMPTZ,
  show_until     TIMESTAMPTZ,
  delete_at      TIMESTAMPTZ,
  winners        JSONB DEFAULT '{}'::JSONB,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT slots_check CHECK (slots_filled <= slots_total)
);

CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_start_time ON public.matches(start_time);

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
