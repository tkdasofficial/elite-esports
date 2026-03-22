-- ============================================================
-- 05_match_participants.sql
-- Match registration / participants table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.match_participants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (match_id, user_id)
);

CREATE INDEX idx_participants_match ON public.match_participants(match_id);
CREATE INDEX idx_participants_user  ON public.match_participants(user_id);

-- Auto-increment slots_filled when a participant joins
CREATE OR REPLACE FUNCTION increment_slots()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.matches
  SET slots_filled = slots_filled + 1
  WHERE match_id = NEW.match_id
    AND slots_filled < slots_total;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_participant_join
  AFTER INSERT ON public.match_participants
  FOR EACH ROW EXECUTE FUNCTION increment_slots();

-- Auto-decrement slots_filled when a participant leaves
CREATE OR REPLACE FUNCTION decrement_slots()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.matches
  SET slots_filled = GREATEST(0, slots_filled - 1)
  WHERE match_id = OLD.match_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_participant_leave
  AFTER DELETE ON public.match_participants
  FOR EACH ROW EXECUTE FUNCTION decrement_slots();
