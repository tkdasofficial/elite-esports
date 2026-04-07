-- =============================================================================
--  Elite eSports — Migration 017: UPI ID & Admin Settings RPC
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--
--  1. Ensures upi_id column exists in app_settings (safe if already exists)
--  2. Seeds a default app_settings row if none exists
--  3. Creates update_app_settings() — admin-only RPC to update settings
--     (UPI ID, deposit/withdrawal limits) without direct table access
-- =============================================================================


-- ─── 1. Ensure upi_id column exists ──────────────────────────────────────────

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS upi_id TEXT NOT NULL DEFAULT 'yourname@upi';


-- ─── 2. Seed default row if table is empty ───────────────────────────────────

INSERT INTO public.app_settings (id, min_deposit, max_deposit, min_withdraw, max_withdraw, upi_id)
  SELECT gen_random_uuid(), 10, 50000, 50, 50000, 'yourname@upi'
  WHERE NOT EXISTS (SELECT 1 FROM public.app_settings)
  LIMIT 1;


-- ─── 3. Admin-only RPC: update_app_settings ──────────────────────────────────
--   Allows an admin to change UPI ID and deposit/withdrawal limits safely.
--   Returns: { success: bool, error?: string }

CREATE OR REPLACE FUNCTION public.update_app_settings(
  p_upi_id      TEXT    DEFAULT NULL,
  p_min_deposit NUMERIC DEFAULT NULL,
  p_max_deposit NUMERIC DEFAULT NULL,
  p_min_withdraw NUMERIC DEFAULT NULL,
  p_max_withdraw NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = v_user_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  UPDATE public.app_settings SET
    upi_id       = COALESCE(p_upi_id,       upi_id),
    min_deposit  = COALESCE(p_min_deposit,  min_deposit),
    max_deposit  = COALESCE(p_max_deposit,  max_deposit),
    min_withdraw = COALESCE(p_min_withdraw, min_withdraw),
    max_withdraw = COALESCE(p_max_withdraw, max_withdraw);

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.update_app_settings(TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_app_settings(TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;


-- ─── 4. Admin-only RPC: get_admin_settings ───────────────────────────────────
--   Returns full app_settings row (for admin panel display)

CREATE OR REPLACE FUNCTION public.get_admin_settings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN := false;
  v_row public.app_settings;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = v_user_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  SELECT * INTO v_row FROM public.app_settings LIMIT 1;

  RETURN jsonb_build_object(
    'success',      true,
    'upi_id',       v_row.upi_id,
    'min_deposit',  v_row.min_deposit,
    'max_deposit',  v_row.max_deposit,
    'min_withdraw', v_row.min_withdraw,
    'max_withdraw', v_row.max_withdraw
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_settings() TO authenticated;


-- ─── 5. Enable Realtime on app_settings ──────────────────────────────────────
--   When admin updates upi_id (or limits), all open app sessions refresh
--   automatically via the realtime subscription in useAppSettings.ts

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname   = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'app_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
  END IF;
END
$$;


-- =============================================================================
-- DONE.
--   • app_settings.upi_id column added / confirmed
--   • Default row seeded (if empty)
--   • Realtime enabled on app_settings (live UPI ID push to all open sessions)
--   • update_app_settings(upi_id, limits...) RPC created (admin only)
--   • get_admin_settings() RPC created (admin only)
--
-- ─── HOW TO SET YOUR UPI ID ──────────────────────────────────────────────────
-- Option A — Direct SQL (Supabase Dashboard → SQL Editor):
--   UPDATE public.app_settings SET upi_id = 'yourname@bank';
--
-- Option B — Via RPC (from any authenticated admin session):
--   SELECT update_app_settings(p_upi_id => 'yourname@bank');
-- =============================================================================
