-- =============================================================================
--  Elite eSports — Migration 015
--  1. prize_tiers table  (per-match prize breakdown, configurable by admin)
--  2. open_to_anyone column on teams  (controls join-request flow)
--  3. team_join_requests table  (non-members request to join team for a match)
--  4. join_match RPC  (atomic join: balance check + deduction + participant insert)
--  5. leave_match RPC update  (NEVER refunds entry fee)
-- =============================================================================


-- ─── 1. PRIZE TIERS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.prize_tiers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rank         INTEGER     NOT NULL CHECK (rank > 0),
  prize_amount NUMERIC     NOT NULL DEFAULT 0 CHECK (prize_amount >= 0),
  CONSTRAINT prize_tiers_match_rank_unique UNIQUE (match_id, rank)
);

ALTER TABLE public.prize_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pt_select" ON public.prize_tiers;
DROP POLICY IF EXISTS "pt_admin"  ON public.prize_tiers;
CREATE POLICY "pt_select" ON public.prize_tiers FOR SELECT USING (true);
CREATE POLICY "pt_admin"  ON public.prize_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─── 2. OPEN_TO_ANYONE ON TEAMS ──────────────────────────────────────────────

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS open_to_anyone BOOLEAN NOT NULL DEFAULT true;


-- ─── 3. TEAM JOIN REQUESTS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id   UUID        REFERENCES public.matches(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','approved','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tjr_team_user_match_unique UNIQUE (team_id, user_id, match_id)
);

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tjr_select" ON public.team_join_requests;
DROP POLICY IF EXISTS "tjr_insert" ON public.team_join_requests;
DROP POLICY IF EXISTS "tjr_update" ON public.team_join_requests;
DROP POLICY IF EXISTS "tjr_admin"  ON public.team_join_requests;

CREATE POLICY "tjr_select" ON public.team_join_requests
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_join_requests.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "tjr_insert" ON public.team_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tjr_update" ON public.team_join_requests
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_join_requests.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "tjr_admin" ON public.team_join_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );


-- ─── 4. join_match RPC ───────────────────────────────────────────────────────
-- Atomically: checks balance, deducts entry fee, inserts participant,
-- increments joined_players. Idempotent (safe to call if already joined).

CREATE OR REPLACE FUNCTION public.join_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID    := auth.uid();
  v_status     TEXT;
  v_fee        NUMERIC;
  v_max        INTEGER;
  v_joined     INTEGER;
  v_balance    NUMERIC;
  v_ref        TEXT    := 'entry:' || _match_id;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Load match
  SELECT status, entry_fee, max_players, joined_players
  INTO v_status, v_fee, v_max, v_joined
  FROM public.matches WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status <> 'upcoming' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is no longer open for registration');
  END IF;

  IF v_joined >= v_max THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is full');
  END IF;

  -- Idempotency: already joined?
  IF EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_joined', true);
  END IF;

  -- Check & deduct entry fee
  IF v_fee > 0 THEN
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_user_id;
    IF NOT FOUND OR v_balance < v_fee THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    -- Deduct from wallet
    UPDATE public.wallets
    SET balance    = balance - v_fee,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- Record the debit
    INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
    VALUES (v_user_id, 'debit', v_fee, 'approved', v_ref);
  END IF;

  -- Insert participant
  INSERT INTO public.match_participants (match_id, user_id)
  VALUES (_match_id, v_user_id);

  -- Increment counter
  UPDATE public.matches
  SET joined_players = joined_players + 1
  WHERE id = _match_id;

  RETURN jsonb_build_object('success', true, 'already_joined', false);
END;
$$;

REVOKE ALL ON FUNCTION public.join_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_match(UUID) TO authenticated;


-- ─── 5. leave_match RPC — NEVER REFUNDS ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.leave_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_status  TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status INTO v_status FROM public.matches WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot leave a completed match');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have not joined this match');
  END IF;

  DELETE FROM public.match_participants
  WHERE match_id = _match_id AND user_id = v_user_id;

  UPDATE public.matches
  SET joined_players = GREATEST(0, joined_players - 1)
  WHERE id = _match_id;

  -- Entry fee is NEVER refunded
  RETURN jsonb_build_object('success', true, 'refunded', false, 'refund_amount', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_match(UUID) TO authenticated;
