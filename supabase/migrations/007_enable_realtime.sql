-- Migration 007: Enable Supabase Realtime on wallet-related tables
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe version: skips tables already in the publication.

DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['withdrawals', 'wallets', 'wallet_transactions'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      RAISE NOTICE 'Added % to supabase_realtime', tbl;
    ELSE
      RAISE NOTICE '% already in supabase_realtime, skipped', tbl;
    END IF;
  END LOOP;
END $$;
