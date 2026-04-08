-- =============================================================================
--  Elite eSports — Migration 019: Fix wallet_transactions.reference_id type
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--
--  ROOT CAUSE:
--    wallet_transactions.reference_id was created as UUID in the live DB.
--    All RPCs (join_match, leave_match, claim_match_prize, auto_distribute_prize,
--    credit_ad_bonus, use_referral_code) insert TEXT like 'entry:<uuid>'
--    into this column → "column reference_id is of type uuid but expression
--    is of type text" error when joining a match.
--
--  FIX:
--    1. Drop the UUID check constraint if any
--    2. Convert column to TEXT
--    3. Recreate all wallet RPCs to use TEXT reference_id
-- =============================================================================


-- ─── PART 1 · Convert reference_id from UUID → TEXT ─────────────────────────

-- Drop any default that might block the ALTER
ALTER TABLE public.wallet_transactions
  ALTER COLUMN reference_id DROP DEFAULT;

-- Convert UUID → TEXT (safe no-op if already TEXT)
ALTER TABLE public.wallet_transactions
  ALTER COLUMN reference_id TYPE TEXT USING reference_id::TEXT;

-- ─── PART 2 · Recreate join_match ────────────────────────────────────────────

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
  v_ref        TEXT    := 'entry:' || _match_id::TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

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

  IF EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_joined', true);
  END IF;

  IF v_fee > 0 THEN
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = v_user_id;
    IF NOT FOUND OR COALESCE(v_balance, 0) < v_fee THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    UPDATE public.wallets
    SET balance    = balance - v_fee,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
    VALUES (v_user_id, 'debit', v_fee, 'approved', v_ref);
  END IF;

  INSERT INTO public.match_participants (match_id, user_id)
  VALUES (_match_id, v_user_id)
  ON CONFLICT (match_id, user_id) DO NOTHING;

  UPDATE public.matches
  SET joined_players = joined_players + 1
  WHERE id = _match_id;

  RETURN jsonb_build_object('success', true, 'already_joined', false);
END;
$$;

REVOKE ALL ON FUNCTION public.join_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_match(UUID) TO authenticated;


-- ─── PART 3 · Recreate leave_match ───────────────────────────────────────────

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
  v_ref       TEXT    := 'refund:' || _match_id::TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, entry_fee INTO v_status, v_fee
  FROM public.matches WHERE id = _match_id;

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

  -- Refund entry fee for upcoming matches (idempotent)
  IF COALESCE(v_fee, 0) > 0 AND v_status = 'upcoming' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE user_id = v_user_id AND reference_id = v_ref
    ) THEN
      INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
      VALUES (v_user_id, 'credit', v_fee, 'approved', v_ref);

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


-- ─── PART 4 · Recreate claim_match_prize ─────────────────────────────────────

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
  v_ref        TEXT    := 'result:' || _match_id::TEXT;
  v_already    BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status, prize_pool INTO v_status, v_prize_pool
  FROM public.matches WHERE id = _match_id;

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

  SELECT rank, points INTO v_rank, v_points
  FROM public.match_results WHERE match_id = _match_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No result recorded for you in this match');
  END IF;

  SELECT prize_amount INTO v_prize
  FROM public.match_prize_splits
  WHERE match_id = _match_id AND rank = v_rank
  LIMIT 1;

  IF v_prize IS NULL OR v_prize <= 0 THEN
    v_prize := CASE v_rank
      WHEN 1 THEN v_prize_pool * 0.50
      WHEN 2 THEN v_prize_pool * 0.30
      WHEN 3 THEN v_prize_pool * 0.10
      ELSE 0
    END;
  END IF;

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

  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, v_prize, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_prize,
        updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true, 'prize', v_prize, 'rank', v_rank, 'points', v_points
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_match_prize(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_match_prize(UUID) TO authenticated;


-- ─── PART 5 · Recreate auto_distribute_prize trigger ─────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid, pg_get_function_identity_arguments(oid) AS args
      FROM pg_proc
     WHERE proname = 'auto_distribute_prize'
       AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.auto_distribute_prize(%s) CASCADE', r.args);
  END LOOP;
END
$$;

CREATE FUNCTION public.auto_distribute_prize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize NUMERIC := 0;
  v_pool  NUMERIC := 0;
  v_ref   TEXT    := 'autopay:' || NEW.match_id::TEXT;
BEGIN
  SELECT prize_amount
    INTO v_prize
    FROM public.match_prize_splits
   WHERE match_id = NEW.match_id AND rank = NEW.rank
   LIMIT 1;

  IF v_prize IS NULL OR v_prize <= 0 THEN
    SELECT prize_pool INTO v_pool FROM public.matches WHERE id = NEW.match_id;
    v_prize := CASE NEW.rank
      WHEN 1 THEN COALESCE(v_pool, 0) * 0.50
      WHEN 2 THEN COALESCE(v_pool, 0) * 0.30
      WHEN 3 THEN COALESCE(v_pool, 0) * 0.10
      ELSE 0
    END;
  END IF;

  IF v_prize <= 0 THEN RETURN NEW; END IF;

  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
     WHERE user_id = NEW.user_id AND reference_id = v_ref
  ) THEN RETURN NEW; END IF;

  INSERT INTO public.wallets (user_id, balance, updated_at)
       VALUES (NEW.user_id, v_prize, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + EXCLUDED.balance,
        updated_at = NOW();

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
       VALUES (NEW.user_id, 'credit', v_prize, 'approved', v_ref);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_prize_on_result ON public.match_results;
CREATE TRIGGER trg_auto_prize_on_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_distribute_prize();


-- ─── PART 6 · Recreate credit_ad_bonus ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.credit_ad_bonus()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ref     TEXT;
  v_already BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_ref := 'ad_bonus:' || v_user_id::TEXT || ':' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bonus already claimed today');
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', 1, 'approved', v_ref);

  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + 1,
        updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'amount', 1);
END;
$$;

REVOKE ALL ON FUNCTION public.credit_ad_bonus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_ad_bonus() TO authenticated;


-- ─── PART 7 · Recreate use_referral_code ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.use_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID    := auth.uid();
  v_owner_id  UUID;
  v_reward    NUMERIC := 10;
  v_ref       TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No code provided');
  END IF;

  SELECT id INTO v_owner_id
  FROM public.users
  WHERE referral_code = UPPER(TRIM(p_code))
    AND id <> v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  v_ref := 'referral:' || v_user_id::TEXT;
  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_owner_id AND reference_id = v_ref
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral already applied');
  END IF;

  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (v_owner_id, v_reward, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = public.wallets.balance + v_reward,
        updated_at = NOW();

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_owner_id, 'credit', v_reward, 'approved', v_ref);

  RETURN jsonb_build_object('success', true, 'reward', v_reward);
END;
$$;

REVOKE ALL ON FUNCTION public.use_referral_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.use_referral_code(TEXT) TO authenticated;


-- ─── PART 8 · Recreate get_user_match_result ─────────────────────────────────

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

  SELECT prize_amount INTO v_prize
  FROM public.match_prize_splits
  WHERE match_id = _match_id AND rank = v_rank
  LIMIT 1;

  IF v_prize IS NULL OR v_prize <= 0 THEN
    v_prize := CASE v_rank
      WHEN 1 THEN v_prize_pool * 0.50
      WHEN 2 THEN v_prize_pool * 0.30
      WHEN 3 THEN v_prize_pool * 0.10
      ELSE 0
    END;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id
      AND reference_id = 'result:' || _match_id::TEXT
      AND type = 'credit'
  ) INTO v_claimed;

  RETURN jsonb_build_object(
    'found',           true,
    'rank',            v_rank,
    'kills',           v_kills,
    'points',          v_points,
    'prize',           COALESCE(v_prize, 0),
    'already_claimed', v_claimed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_match_result(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_match_result(UUID) TO authenticated;


-- =============================================================================
-- DONE.
--   • wallet_transactions.reference_id converted from UUID → TEXT
--   • join_match, leave_match, claim_match_prize, auto_distribute_prize,
--     credit_ad_bonus, use_referral_code, get_user_match_result all recreated
--     with TEXT reference_id values (e.g. 'entry:<uuid>', 'refund:<uuid>')
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste this entire file → Run
-- =============================================================================
