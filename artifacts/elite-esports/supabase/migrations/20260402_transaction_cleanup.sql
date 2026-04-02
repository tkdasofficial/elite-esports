-- =============================================================================
--  Elite eSports — Auto-delete transaction history older than 7 days
--  Run once in: Supabase Dashboard → SQL Editor → New query → Run
--
--  Uses pg_cron (available on Supabase Pro) to run nightly at midnight UTC.
--  If pg_cron is not available on your plan, the manual DELETE function below
--  can be called from a daily Supabase Edge Function cron instead.
-- =============================================================================

-- ── 1. Enable realtime on wallet_transactions so the app gets instant updates ──
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
    RAISE NOTICE 'wallet_transactions added to supabase_realtime';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'wallet_transactions already in supabase_realtime — skipped';
  END;
END;
$$;

-- ── 2. Helper function that deletes records older than 7 days ──
CREATE OR REPLACE FUNCTION public.cleanup_old_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove wallet_transactions older than 7 days
  DELETE FROM public.wallet_transactions
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Remove payments (deposits) older than 7 days
  DELETE FROM public.payments
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Remove withdrawals older than 7 days
  DELETE FROM public.withdrawals
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Remove legacy transactions older than 7 days (if table exists)
  BEGIN
    DELETE FROM public.transactions
    WHERE created_at < NOW() - INTERVAL '7 days';
  EXCEPTION WHEN undefined_table THEN
    NULL; -- table may not exist on all deployments
  END;
END;
$$;

-- ── 3. Schedule nightly cleanup via pg_cron (Supabase Pro / Business plans) ──
--      Runs at 00:00 UTC every day.
--      If you are on the Free plan, skip this block and call
--      cleanup_old_transactions() from a Supabase Edge Function cron trigger.
DO $$
BEGIN
  -- Only schedule if pg_cron extension is available
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN
    -- Remove any existing job with the same name first
    BEGIN
      PERFORM cron.unschedule('elite-esports-cleanup-transactions');
    EXCEPTION WHEN others THEN
      NULL;
    END;

    PERFORM cron.schedule(
      'elite-esports-cleanup-transactions',
      '0 0 * * *',
      $$SELECT public.cleanup_old_transactions();$$
    );
    RAISE NOTICE 'pg_cron job scheduled: elite-esports-cleanup-transactions';
  ELSE
    RAISE NOTICE 'pg_cron not available — call cleanup_old_transactions() from an Edge Function cron instead.';
  END IF;
END;
$$;

-- ── 4. Run the cleanup immediately to remove any stale records right now ──
SELECT public.cleanup_old_transactions();

-- =============================================================================
-- DONE.
--  • wallet_transactions is now in supabase_realtime
--  • Records older than 7 days are deleted from wallet_transactions,
--    payments, withdrawals, and transactions tables
--  • Nightly cleanup job registered (if pg_cron available)
-- =============================================================================
