-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 015: KYC gate inside join_match SECURITY DEFINER function
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY: join_match runs as SECURITY DEFINER (bypasses RLS).
-- App-level KYC checks can be bypassed by calling the RPC directly.
-- This fix adds the KYC enforcement INSIDE the function itself.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.join_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      UUID    := auth.uid();
  v_status       TEXT;
  v_max_players  INTEGER;
  v_joined       INTEGER;
  v_fee          NUMERIC;
  v_balance      NUMERIC;
  v_ref          TEXT    := 'entry:' || _match_id;
  v_already      BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 0. KYC gate — must have completed profile setup
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_user_id AND kyc_completed = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile setup required before joining a match');
  END IF;

  -- 1. Load match details
  SELECT status, max_players, joined_players, entry_fee
  INTO v_status, v_max_players, v_joined, v_fee
  FROM public.matches
  WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status <> 'upcoming' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is not open for registration');
  END IF;

  IF v_joined >= v_max_players THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match is full');
  END IF;

  -- 2. Idempotency: already joined?
  SELECT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already joined this match');
  END IF;

  -- 3. Balance check (only if entry_fee > 0)
  IF v_fee > 0 THEN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM public.wallets
    WHERE user_id = v_user_id;

    IF v_balance IS NULL OR v_balance < v_fee THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    -- 4a. Deduct from wallet
    UPDATE public.wallets
    SET balance    = balance - v_fee,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- 4b. Record the debit transaction
    INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
    VALUES (v_user_id, 'debit', v_fee, 'approved', v_ref);
  END IF;

  -- 5. Add participant
  INSERT INTO public.match_participants (match_id, user_id)
  VALUES (_match_id, v_user_id)
  ON CONFLICT (match_id, user_id) DO NOTHING;

  -- 6. Increment joined_players
  UPDATE public.matches
  SET joined_players = joined_players + 1
  WHERE id = _match_id;

  RETURN jsonb_build_object(
    'success',    true,
    'fee_paid',   v_fee,
    'match_id',   _match_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.join_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_match(UUID) TO authenticated;
