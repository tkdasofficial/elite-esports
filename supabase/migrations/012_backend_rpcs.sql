-- =============================================================================
--  Elite eSports — Migration 012: Backend RPCs & Wallet Sync
--  Run in: Supabase Dashboard → SQL Editor → New query → Run
--
--  0. Adds upi_id column to app_settings (for deposit UPI ID)
--  1. Patches claim_match_prize to also update wallets.balance
--  2. Creates leave_match RPC (atomic leave + refund + wallet sync)
--  3. Creates get_user_match_result RPC (prize calculated on backend)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Add upi_id to app_settings
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS upi_id TEXT NOT NULL DEFAULT 'elite@upi';


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PATCH claim_match_prize — also update wallets.balance so realtime fires
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.claim_match_prize(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID    := auth.uid();
  v_status     TEXT;
  v_prize_pool NUMERIC;
  v_rank       INTEGER;
  v_points     INTEGER;
  v_prize      NUMERIC;
  v_ref        TEXT    := 'result:' || _match_id;
  v_already    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, prize_pool
  INTO v_status, v_prize_pool
  FROM public.matches
  WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status <> 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is not completed yet');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You did not participate in this match');
  END IF;

  SELECT rank, points
  INTO v_rank, v_points
  FROM public.match_results
  WHERE match_id = _match_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No result recorded for you in this match');
  END IF;

  v_prize := CASE v_rank
    WHEN 1 THEN v_prize_pool * 0.50
    WHEN 2 THEN v_prize_pool * 0.30
    WHEN 3 THEN v_prize_pool * 0.10
    ELSE 0
  END;

  IF v_prize <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No prize for your rank');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prize already claimed');
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', v_prize, 'approved', v_ref);

  -- Sync wallets.balance so realtime fires immediately
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, v_prize, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_prize,
        updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'prize',   v_prize,
    'rank',    v_rank,
    'points',  v_points
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_match_prize(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_match_prize(UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. leave_match — atomic leave + refund + wallet sync
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.leave_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID    := auth.uid();
  v_status    TEXT;
  v_fee       NUMERIC;
  v_refunded  BOOLEAN := false;
  v_ref       TEXT    := 'refund:' || _match_id;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, entry_fee
  INTO v_status, v_fee
  FROM public.matches
  WHERE id = _match_id;

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

  -- Remove participant
  DELETE FROM public.match_participants
  WHERE match_id = _match_id AND user_id = v_user_id;

  -- Decrement player count (floor at 0)
  UPDATE public.matches
  SET joined_players = GREATEST(0, joined_players - 1)
  WHERE id = _match_id;

  -- Refund entry fee for upcoming matches (idempotent)
  IF v_fee > 0 AND v_status = 'upcoming' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE user_id = v_user_id AND reference_id = v_ref
    ) THEN
      INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
      VALUES (v_user_id, 'credit', v_fee, 'approved', v_ref);

      -- Sync wallets.balance so realtime fires immediately
      INSERT INTO public.wallets (user_id, balance, updated_at)
      VALUES (v_user_id, v_fee, NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET balance    = public.wallets.balance + v_fee,
            updated_at = NOW();

      v_refunded := true;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success',       true,
    'refunded',      v_refunded,
    'refund_amount', CASE WHEN v_refunded THEN v_fee ELSE 0 END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.leave_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_match(UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. get_user_match_result — backend-computed prize for display
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_match_result(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID    := auth.uid();
  v_prize_pool NUMERIC;
  v_rank       INTEGER;
  v_kills      INTEGER;
  v_points     INTEGER;
  v_prize      NUMERIC;
  v_claimed    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT rank, kills, points
  INTO v_rank, v_kills, v_points
  FROM public.match_results
  WHERE match_id = _match_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT prize_pool INTO v_prize_pool
  FROM public.matches WHERE id = _match_id;

  v_prize := CASE v_rank
    WHEN 1 THEN v_prize_pool * 0.50
    WHEN 2 THEN v_prize_pool * 0.30
    WHEN 3 THEN v_prize_pool * 0.10
    ELSE 0
  END;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id
      AND reference_id = 'result:' || _match_id::text
      AND type = 'credit'
  ) INTO v_claimed;

  RETURN jsonb_build_object(
    'found',          true,
    'rank',           v_rank,
    'kills',          v_kills,
    'points',         v_points,
    'prize',          v_prize,
    'already_claimed', v_claimed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_match_result(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_match_result(UUID) TO authenticated;
