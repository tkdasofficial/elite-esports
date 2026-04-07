-- =============================================================================
--  Migration 017 · Fix in_game_name, phone, avatar, and auto-prize
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--  Safe to run multiple times (idempotent).
-- =============================================================================


-- ── 1. Ensure in_game_name column exists in user_games ───────────────────────
ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS in_game_name TEXT;


-- ── 2. Ensure avatar_url column exists in users ───────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Make sure phone column exists in users for direct storage
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;


-- ── 3. Create match_prize_splits table ────────────────────────────────────────
--  The app reads from match_prize_splits (not prize_tiers).
--  This table stores per-rank prize amounts set by admin for each match.

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


-- ── 4. Auto-distribute prizes when admin publishes match results ───────────────
--
--  Fires AFTER INSERT on match_results.
--  Priority: match_prize_splits for that rank → fallback: prize_pool percentages.
--  Idempotent: skips if wallet_transaction already exists for this user+match.

CREATE OR REPLACE FUNCTION public.auto_distribute_prize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize     NUMERIC := 0;
  v_pool      NUMERIC := 0;
  v_ref       TEXT    := 'autopay:' || NEW.match_id::TEXT;
BEGIN
  -- 1. Lookup explicit prize split for this rank
  SELECT prize_amount
    INTO v_prize
    FROM public.match_prize_splits
   WHERE match_id = NEW.match_id
     AND rank     = NEW.rank
   LIMIT 1;

  -- 2. Fallback to prize_pool percentage if no explicit split
  IF v_prize IS NULL OR v_prize <= 0 THEN
    SELECT prize_pool INTO v_pool
      FROM public.matches
     WHERE id = NEW.match_id;

    v_prize := CASE NEW.rank
      WHEN 1 THEN COALESCE(v_pool, 0) * 0.50
      WHEN 2 THEN COALESCE(v_pool, 0) * 0.30
      WHEN 3 THEN COALESCE(v_pool, 0) * 0.10
      ELSE 0
    END;
  END IF;

  -- Nothing to distribute
  IF v_prize <= 0 THEN
    RETURN NEW;
  END IF;

  -- 3. Idempotency guard: skip if already paid for this user + match
  IF EXISTS (
    SELECT 1
      FROM public.wallet_transactions
     WHERE user_id      = NEW.user_id
       AND reference_id = v_ref
  ) THEN
    RETURN NEW;
  END IF;

  -- 4. Credit the winner's wallet
  INSERT INTO public.wallets (user_id, balance, updated_at)
       VALUES (NEW.user_id, v_prize, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET balance    = public.wallets.balance + EXCLUDED.balance,
                updated_at = NOW();

  -- 5. Record the prize transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
       VALUES (NEW.user_id, 'credit', v_prize, 'approved', v_ref);

  -- 6. Fire in-app notification
  PERFORM public.notify_user(
    NEW.user_id,
    CASE WHEN NEW.rank <= 3 THEN '🏆 Prize Credited! Rank #' || NEW.rank ELSE '📊 Match Result: #' || NEW.rank END,
    '₹' || v_prize || ' has been automatically added to your wallet. GG!',
    'elite-esports-reward',
    jsonb_build_object('type', 'prize_auto', 'match_id', NEW.match_id, 'rank', NEW.rank, 'prize', v_prize)
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the result insert even if notification/wallet fails
  RETURN NEW;
END;
$$;

-- Drop & recreate trigger cleanly
DROP TRIGGER IF EXISTS trg_auto_prize_on_result ON public.match_results;

CREATE TRIGGER trg_auto_prize_on_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_distribute_prize();


-- ── 5. Migrate data from prize_tiers → match_prize_splits (if prize_tiers exists) ─
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'prize_tiers'
  ) THEN
    INSERT INTO public.match_prize_splits (match_id, rank, prize_amount)
    SELECT match_id, rank, prize_amount FROM public.prize_tiers
    ON CONFLICT (match_id, rank) DO NOTHING;
  END IF;
END;
$$;

-- ── 6. Add kyc_completed column to users if missing (used by join_match RPC) ──
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN NOT NULL DEFAULT false;


-- ── 7. Add type column to notifications if missing (used by notify_user RPC) ──
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'general';


-- ── 8. Enable realtime on match_prize_splits ──────────────────────────────────
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
END
$$;


-- ── 9. sync_kyc_status RPC ────────────────────────────────────────────────────
-- Called from kyc.tsx after auth.updateUser() sets kyc_completed = true
-- in auth metadata. This function syncs that flag into public.users
-- so the join_match RPC (which checks users.kyc_completed) works correctly.
CREATE OR REPLACE FUNCTION public.sync_kyc_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta  JSONB;
BEGIN
  -- Read kyc_completed from the caller's auth metadata
  SELECT raw_user_meta_data
    INTO v_meta
    FROM auth.users
   WHERE id = auth.uid();

  IF v_meta IS NULL THEN
    RETURN;
  END IF;

  -- Sync the flag into public.users
  UPDATE public.users
     SET kyc_completed = COALESCE((v_meta->>'kyc_completed')::boolean, false),
         updated_at    = NOW()
   WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_kyc_status() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_kyc_status() FROM anon;


-- ── 10. updated_at column on users ───────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
