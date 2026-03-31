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

-- Service role (used by Firebase Admin SDK on the admin panel) reads ALL tokens
CREATE POLICY "Service role reads all tokens"
  ON public.fcm_tokens
  FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================
-- Admin convenience view
-- Gives the admin panel a single query to fetch all user tokens
-- with profile details joined in.
-- Usage (from admin panel using service role key):
--   SELECT * FROM public.admin_fcm_tokens;
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
