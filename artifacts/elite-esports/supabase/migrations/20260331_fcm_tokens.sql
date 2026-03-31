-- ============================================================
-- FCM Push Notification Tokens
-- Run this in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        text        NOT NULL,
  platform     text        NOT NULL CHECK (platform IN ('android', 'ios')),
  email        text,
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fcm_tokens_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS fcm_tokens_user_id_idx  ON public.fcm_tokens (user_id);
CREATE INDEX IF NOT EXISTS fcm_tokens_platform_idx ON public.fcm_tokens (platform);

ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own tokens
CREATE POLICY "Users manage own tokens"
  ON public.fcm_tokens
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (used by Firebase Admin SDK on the admin panel) can read ALL tokens
CREATE POLICY "Service role reads all tokens"
  ON public.fcm_tokens
  FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================
-- Admin view: all tokens with profile details joined in
-- Query:  SELECT * FROM public.admin_fcm_tokens;
-- ============================================================
CREATE OR REPLACE VIEW public.admin_fcm_tokens AS
SELECT
  ft.id,
  ft.user_id,
  ft.token,
  ft.platform,
  ft.email,
  COALESCE(p.full_name, ft.display_name) AS display_name,
  p.username,
  ft.created_at,
  ft.updated_at
FROM public.fcm_tokens ft
LEFT JOIN public.profiles p ON p.id = ft.user_id;

-- ============================================================
-- Coverage analysis view: shows every profile and whether it
-- has an FCM token registered. Use this to identify accounts
-- that are missing tokens.
--
-- Query:  SELECT * FROM public.fcm_coverage;
-- Filter: SELECT * FROM public.fcm_coverage WHERE has_token = false;
-- Stats:  SELECT has_token, COUNT(*) FROM public.fcm_coverage GROUP BY has_token;
-- ============================================================
CREATE OR REPLACE VIEW public.fcm_coverage AS
SELECT
  p.id                                        AS user_id,
  p.full_name                                 AS display_name,
  p.username,
  COALESCE(ft.email, p.id::text)              AS email,
  ft.token IS NOT NULL                        AS has_token,
  ft.platform,
  ft.token,
  ft.created_at                               AS token_registered_at,
  ft.updated_at                               AS token_last_synced_at
FROM public.profiles p
LEFT JOIN public.fcm_tokens ft ON ft.user_id = p.id;
