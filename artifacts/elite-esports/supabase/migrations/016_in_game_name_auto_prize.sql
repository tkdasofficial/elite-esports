-- ── 1. Add in_game_name column to user_games ──────────────────────────────
ALTER TABLE public.user_games
  ADD COLUMN IF NOT EXISTS in_game_name TEXT;

-- ── 2. Auto prize distribution ────────────────────────────────────────────
--
--  Fires AFTER INSERT on match_results.
--  Looks up the prize amount for that rank from match_prize_splits,
--  credits the winner's wallet, and records a wallet_transaction.
--  Idempotent: skips if a prize transaction already exists for this
--  user + match combination.

CREATE OR REPLACE FUNCTION public.auto_distribute_prize()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prize   NUMERIC;
  v_ref     TEXT;
BEGIN
  v_ref := NEW.match_id::TEXT;

  -- Only act if a prize split exists for this rank
  SELECT prize_amount
    INTO v_prize
    FROM public.match_prize_splits
   WHERE match_id = NEW.match_id
     AND rank     = NEW.rank
   LIMIT 1;

  IF v_prize IS NULL OR v_prize <= 0 THEN
    RETURN NEW;
  END IF;

  -- Idempotency guard: skip if already paid for this user + match
  IF EXISTS (
    SELECT 1
      FROM public.wallet_transactions
     WHERE user_id      = NEW.user_id
       AND type         = 'prize'
       AND reference_id = v_ref
  ) THEN
    RETURN NEW;
  END IF;

  -- Credit the winner's wallet (upsert in case wallet row doesn't exist yet)
  INSERT INTO public.wallets (user_id, balance)
       VALUES (NEW.user_id, v_prize)
  ON CONFLICT (user_id)
  DO UPDATE SET balance    = public.wallets.balance + EXCLUDED.balance,
                updated_at = NOW();

  -- Record the prize transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
       VALUES (NEW.user_id, 'prize', v_prize, 'completed', v_ref);

  RETURN NEW;
END;
$$;

-- Drop & recreate trigger cleanly
DROP TRIGGER IF EXISTS trg_auto_prize_on_result ON public.match_results;

CREATE TRIGGER trg_auto_prize_on_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_distribute_prize();
