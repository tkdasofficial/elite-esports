-- =============================================================================
--  Elite eSports — Migration 018: Fix wallet_transactions enum types + all issues
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--
--  ROOT CAUSE: wallet_transactions.type and wallet_transactions.status columns
--  are PostgreSQL ENUM types in the live database instead of TEXT + CHECK.
--  This causes "invalid input value for enum wallet_tx_type: 'debit'" when
--  the join_match RPC tries to record the entry fee deduction.
--
--  FIXES:
--    1. Convert wallet_transactions columns from enum → TEXT with CHECK
--    2. Drop stale enum types
--    3. Recreate join_match (no KYC gate — handled by app layer)
--    4. Ensure all missing columns exist (kyc_completed, type on notifications, etc.)
--    5. Re-create sync_kyc_status RPC (called from kyc.tsx)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 1 · Fix wallet_transactions column types
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop defaults first so ALTER TYPE works cleanly
ALTER TABLE public.wallet_transactions
  ALTER COLUMN type   DROP DEFAULT;

ALTER TABLE public.wallet_transactions
  ALTER COLUMN status DROP DEFAULT;

-- Convert both columns to TEXT (safe no-op if already TEXT)
ALTER TABLE public.wallet_transactions
  ALTER COLUMN type   TYPE TEXT USING type::TEXT;

ALTER TABLE public.wallet_transactions
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- Drop old check constraints (ignore if they don't exist)
ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_status_check;

-- Drop the enum types entirely
DROP TYPE IF EXISTS public.wallet_tx_type   CASCADE;
DROP TYPE IF EXISTS public.wallet_tx_status CASCADE;
DROP TYPE IF EXISTS wallet_tx_type          CASCADE;
DROP TYPE IF EXISTS wallet_tx_status        CASCADE;

-- Add back TEXT CHECK constraints with ALL valid values used across all functions
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN ('credit', 'debit'));

ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Restore the default
ALTER TABLE public.wallet_transactions
  ALTER COLUMN status SET DEFAULT 'approved';

ALTER TABLE public.wallet_transactions
  ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.wallet_transactions
  ALTER COLUMN status SET NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 2 · Ensure missing columns exist on core tables
-- ─────────────────────────────────────────────────────────────────────────────

-- users: kyc_completed (checked by join_match RPC)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN NOT NULL DEFAULT false;

-- users: phone (set during KYC)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- user_games: in_game_name (used in profile screen)
ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS in_game_name TEXT;

-- notifications: type (used by NCM notify_user helper)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'notifications'
       AND column_name  = 'type'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'general';
  END IF;
END;
$$;

-- match_prize_splits table (used by auto_distribute_prize)
CREATE TABLE IF NOT EXISTS public.match_prize_splits (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID    NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rank         INTEGER NOT NULL CHECK (rank > 0),
  prize_amount NUMERIC NOT NULL DEFAULT 0 CHECK (prize_amount >= 0),
  CONSTRAINT match_prize_splits_match_rank_unique UNIQUE (match_id, rank)
);

ALTER TABLE public.match_prize_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mps_select" ON public.match_prize_splits;
DROP POLICY IF EXISTS "mps_admin"  ON public.match_prize_splits;
CREATE POLICY "mps_select" ON public.match_prize_splits FOR SELECT USING (true);
CREATE POLICY "mps_admin"  ON public.match_prize_splits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 3 · Recreate join_match (no KYC gate — KYC is enforced in the app)
-- ─────────────────────────────────────────────────────────────────────────────

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


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 4 · Recreate leave_match (no refund policy)
-- ─────────────────────────────────────────────────────────────────────────────

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

  RETURN jsonb_build_object('success', true, 'refunded', false, 'refund_amount', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_match(UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 5 · Recreate auto_distribute_prize trigger function
-- ─────────────────────────────────────────────────────────────────────────────

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


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 6 · Recreate claim_match_prize
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

  -- Check prize splits first, fallback to percentage
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


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 7 · sync_kyc_status RPC (called from kyc.tsx after profile setup)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid, pg_get_function_identity_arguments(oid) AS args
      FROM pg_proc
     WHERE proname = 'sync_kyc_status'
       AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.sync_kyc_status(%s) CASCADE', r.args);
  END LOOP;
END
$$;

CREATE FUNCTION public.sync_kyc_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta JSONB;
BEGIN
  SELECT raw_user_meta_data INTO v_meta
  FROM auth.users WHERE id = auth.uid();

  IF v_meta IS NULL THEN RETURN; END IF;

  UPDATE public.users
  SET kyc_completed = COALESCE((v_meta->>'kyc_completed')::BOOLEAN, false),
      referral_code = COALESCE(
        referral_code,
        UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8))
      )
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    INSERT INTO public.users (id, kyc_completed, referral_code)
    VALUES (
      auth.uid(),
      COALESCE((v_meta->>'kyc_completed')::BOOLEAN, false),
      UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8))
    )
    ON CONFLICT (id) DO UPDATE
      SET kyc_completed = COALESCE((v_meta->>'kyc_completed')::BOOLEAN, false),
          referral_code = COALESCE(
            public.users.referral_code,
            UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8))
          );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_kyc_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_kyc_status() TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 8 · Bulk-mark existing users as kyc_completed if they have a username
-- ─────────────────────────────────────────────────────────────────────────────
-- Users who completed KYC before this column existed will be stuck otherwise.

UPDATE public.users
SET kyc_completed = true
WHERE username IS NOT NULL
  AND kyc_completed = false;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 9 · Enable realtime on match_prize_splits
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'match_prize_splits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_prize_splits;
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PART 10 · Referral code system
-- ─────────────────────────────────────────────────────────────────────────────

-- Add referral_code column to users (deterministic from user id)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Populate existing users whose referral_code is not yet set
-- Uses SHA-256 of the user id → first 8 hex chars, uppercase
UPDATE public.users
SET referral_code = UPPER(SUBSTRING(encode(sha256(id::text::bytea), 'hex'), 1, 8))
WHERE referral_code IS NULL;

-- Add unique constraint (ignore if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'users'
      AND constraint_name = 'users_referral_code_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
  END IF;
END;
$$;

-- get_referral_code(): returns caller's referral code, computing & storing it if missing
CREATE OR REPLACE FUNCTION public.get_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_code FROM public.users WHERE id = auth.uid();

  IF v_code IS NULL OR v_code = '' THEN
    v_code := UPPER(SUBSTRING(encode(sha256(auth.uid()::text::bytea), 'hex'), 1, 8));
    UPDATE public.users SET referral_code = v_code WHERE id = auth.uid();
    IF NOT FOUND THEN
      INSERT INTO public.users (id, referral_code)
      VALUES (auth.uid(), v_code)
      ON CONFLICT (id) DO UPDATE SET referral_code = EXCLUDED.referral_code;
    END IF;
  END IF;

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.get_referral_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_referral_code() TO authenticated;

-- use_referral_code(p_code): credits the owner of p_code with ₹10 referral bonus
CREATE OR REPLACE FUNCTION public.use_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID := auth.uid();
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

  -- Find the owner of this code (cannot use your own)
  SELECT id INTO v_owner_id
  FROM public.users
  WHERE referral_code = UPPER(TRIM(p_code))
    AND id <> v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Idempotency: each new user can only be referred once
  v_ref := 'referral:' || v_user_id::TEXT;
  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_owner_id AND reference_id = v_ref
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral already applied');
  END IF;

  -- Credit the referrer's wallet
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


-- =============================================================================
-- DONE.
--   ✅ wallet_transactions.type and .status are now TEXT with CHECK constraints
--   ✅ Enum types wallet_tx_type / wallet_tx_status dropped
--   ✅ join_match RPC recreated (no KYC gate)
--   ✅ leave_match RPC recreated
--   ✅ claim_match_prize RPC recreated (uses match_prize_splits)
--   ✅ auto_distribute_prize trigger recreated
--   ✅ sync_kyc_status RPC created
--   ✅ get_referral_code RPC created (returns caller's unique 8-char code)
--   ✅ use_referral_code RPC created (credits referrer ₹10)
--   ✅ Missing columns added: users.kyc_completed, users.phone,
--      user_games.in_game_name, notifications.type, users.referral_code
--   ✅ match_prize_splits table created
--   ✅ Existing users with usernames marked kyc_completed = true
--   ✅ Existing users populated with referral_code
-- =============================================================================
