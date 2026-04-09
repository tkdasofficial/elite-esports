-- =============================================================================
--  Elite eSports — Migration 019: fcm_tokens table + stale-token cleanup
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--
--  1. Ensures fcm_tokens table exists with all required columns & RLS
--  2. Adds performance indexes for fast token lookups
--  3. RPC + weekly pg_cron job to purge tokens not updated in 60 days
-- =============================================================================


-- ─── 1. fcm_tokens table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        TEXT        NOT NULL,
  platform     TEXT        NOT NULL DEFAULT 'android',
  email        TEXT,
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fcm_select_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_insert_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_update_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_delete_own" ON public.fcm_tokens;
DROP POLICY IF EXISTS "fcm_admin"      ON public.fcm_tokens;

CREATE POLICY "fcm_select_own" ON public.fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fcm_insert_own" ON public.fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fcm_update_own" ON public.fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fcm_delete_own" ON public.fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "fcm_admin" ON public.fcm_tokens FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);


-- ─── 2. Performance indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token   ON public.fcm_tokens(token);


-- ─── 3. Stale token cleanup RPC ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_stale_fcm_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.fcm_tokens
  WHERE updated_at < NOW() - INTERVAL '60 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL    ON FUNCTION public.cleanup_stale_fcm_tokens() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_fcm_tokens() TO service_role;


-- ─── 4. Weekly cleanup cron job ───────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('elite-esports-cleanup-fcm-tokens')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'elite-esports-cleanup-fcm-tokens'
);

SELECT cron.schedule(
  'elite-esports-cleanup-fcm-tokens',
  '0 3 * * 0',   -- every Sunday at 03:00 UTC
  $$ SELECT public.cleanup_stale_fcm_tokens(); $$
);
