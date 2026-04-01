-- =============================================================================
--  Elite eSports — Prize Claim RPC
--  Run this in: Supabase Dashboard → SQL Editor → New query → Run
--
--  Creates a SECURITY DEFINER function so authenticated users can claim their
--  prize without needing direct INSERT access to wallet_transactions.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.claim_match_prize(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_status       TEXT;
  v_prize_pool   NUMERIC;
  v_rank         INTEGER;
  v_points       INTEGER;
  v_prize        NUMERIC;
  v_ref          TEXT := 'result:' || _match_id;
  v_already      BOOLEAN;
BEGIN
  -- 1. Must be logged in
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 2. Load match status and prize_pool
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

  -- 3. Verify the user participated
  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You did not participate in this match');
  END IF;

  -- 4. Load the user's result
  SELECT rank, points
  INTO v_rank, v_points
  FROM public.match_results
  WHERE match_id = _match_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No result recorded for you in this match');
  END IF;

  -- 5. Calculate prize by rank
  v_prize :=
    CASE v_rank
      WHEN 1 THEN v_prize_pool * 0.50
      WHEN 2 THEN v_prize_pool * 0.30
      WHEN 3 THEN v_prize_pool * 0.10
      ELSE 0
    END;

  IF v_prize <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No prize for your rank');
  END IF;

  -- 6. Idempotency: check if already claimed
  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prize already claimed');
  END IF;

  -- 7. Insert the credit (SECURITY DEFINER bypasses RLS)
  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', v_prize, 'approved', v_ref);

  RETURN jsonb_build_object(
    'success', true,
    'prize',   v_prize,
    'rank',    v_rank,
    'points',  v_points
  );
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.claim_match_prize(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_match_prize(UUID) TO authenticated;
