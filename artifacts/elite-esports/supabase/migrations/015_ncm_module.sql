-- =============================================================================
--  Elite eSports — Migration 015: Native Cloud Messaging (NCM) Module
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--
--  Creates two tables:
--    1. device_registrations  — one row per device per user (DUID + push token)
--    2. ncm_notifications     — admin-authored push payloads + delivery status
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. device_registrations
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.device_registrations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duid         TEXT        NOT NULL UNIQUE,
  platform     TEXT        NOT NULL DEFAULT 'android',
  os_version   TEXT,
  push_token   TEXT,
  email        TEXT,
  display_name TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dr_select_own"  ON public.device_registrations;
DROP POLICY IF EXISTS "dr_upsert_own"  ON public.device_registrations;
DROP POLICY IF EXISTS "dr_admin"       ON public.device_registrations;

-- Users can only see their own registrations
CREATE POLICY "dr_select_own" ON public.device_registrations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert / update their own device rows
CREATE POLICY "dr_upsert_own" ON public.device_registrations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can see and manage all registrations
CREATE POLICY "dr_admin" ON public.device_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_device_reg_user ON public.device_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_reg_duid  ON public.device_registrations(duid);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ncm_notifications
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ncm_notifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  body           TEXT        NOT NULL,
  channel_id     TEXT        NOT NULL DEFAULT 'elite-esports-default',
  -- NULL = broadcast to all; otherwise targets a specific user / device
  target_user_id UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  target_duid    TEXT        REFERENCES public.device_registrations(duid) ON DELETE SET NULL,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'delivered', 'failed')),
  delivered_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ncm_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ncm_select_own"  ON public.ncm_notifications;
DROP POLICY IF EXISTS "ncm_update_own"  ON public.ncm_notifications;
DROP POLICY IF EXISTS "ncm_admin"       ON public.ncm_notifications;

-- Devices can read notifications targeting them (or broadcast)
CREATE POLICY "ncm_select_own" ON public.ncm_notifications
  FOR SELECT USING (
    target_user_id IS NULL
    OR target_user_id = auth.uid()
  );

-- Devices can mark their own notifications as delivered
CREATE POLICY "ncm_update_own" ON public.ncm_notifications
  FOR UPDATE USING (
    target_user_id IS NULL
    OR target_user_id = auth.uid()
  );

-- Admins can do everything (create / read / update / delete)
CREATE POLICY "ncm_admin" ON public.ncm_notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ncm_status      ON public.ncm_notifications(status);
CREATE INDEX IF NOT EXISTS idx_ncm_target_user ON public.ncm_notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_ncm_target_duid ON public.ncm_notifications(target_duid);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Enable Realtime on both tables
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_registrations;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ncm_notifications;
  EXCEPTION WHEN others THEN NULL;
  END;
END;
$$;


-- =============================================================================
-- DONE.
--   Tables:   device_registrations, ncm_notifications
--   RLS:      Enabled on both tables
--   Realtime: Both tables added to supabase_realtime publication
-- =============================================================================
