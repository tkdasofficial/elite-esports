-- Migration 008: Auto-delete transactions older than 7 days using pg_cron
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
--
-- pg_cron is built into Supabase — no extra setup needed.
-- This schedules a job that runs every day at midnight (UTC) and permanently
-- deletes any transaction records older than 7 days from all 4 tables.

-- Enable the pg_cron extension (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing version of this job (safe if it doesn't exist yet)
SELECT cron.unschedule('elite-esports-purge-old-transactions')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'elite-esports-purge-old-transactions'
);

-- Schedule nightly purge at 00:00 UTC every day
SELECT cron.schedule(
  'elite-esports-purge-old-transactions',
  '0 0 * * *',
  $$
    DELETE FROM public.payments
      WHERE created_at < NOW() - INTERVAL '7 days';

    DELETE FROM public.withdrawals
      WHERE created_at < NOW() - INTERVAL '7 days';

    DELETE FROM public.wallet_transactions
      WHERE created_at < NOW() - INTERVAL '7 days';

    DELETE FROM public.transactions
      WHERE created_at < NOW() - INTERVAL '7 days';
  $$
);

-- Verify: you can view all scheduled jobs with:
-- SELECT * FROM cron.job;
