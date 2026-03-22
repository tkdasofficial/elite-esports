-- ============================================================
-- 16_platform_tables.sql
-- Missing tables: platform_settings, campaigns, notifications
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── PLATFORM SETTINGS (singleton) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id                   TEXT PRIMARY KEY DEFAULT '1',
  upi_id               TEXT DEFAULT '',
  bank                 TEXT DEFAULT '',
  ifsc                 TEXT DEFAULT '',
  platform_name        TEXT DEFAULT 'Elite Esports',
  support_email        TEXT DEFAULT '',
  maintenance_mode     BOOLEAN DEFAULT FALSE,
  registration_open    BOOLEAN DEFAULT TRUE,
  min_withdrawal       INTEGER DEFAULT 100,
  max_withdrawal       INTEGER DEFAULT 10000,
  withdrawal_fee       NUMERIC DEFAULT 2,
  referral_enabled     BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  auto_approve_deposits BOOLEAN DEFAULT FALSE,
  max_team_size        INTEGER DEFAULT 4,
  twofa                BOOLEAN DEFAULT TRUE,
  login_notif          BOOLEAN DEFAULT TRUE,
  email_alerts         BOOLEAN DEFAULT TRUE,
  push_notifs          BOOLEAN DEFAULT TRUE,
  sms_alerts           BOOLEAN DEFAULT FALSE,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings (id) VALUES ('1') ON CONFLICT DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_read_all"    ON public.platform_settings;
DROP POLICY IF EXISTS "settings_admin_update" ON public.platform_settings;

CREATE POLICY "settings_read_all"
  ON public.platform_settings FOR SELECT USING (true);

CREATE POLICY "settings_admin_update"
  ON public.platform_settings FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ── CAMPAIGNS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  ad_type          TEXT NOT NULL DEFAULT 'Image'
                   CHECK (ad_type IN ('Image', 'Video', 'Banner')),
  trigger_type     TEXT NOT NULL DEFAULT 'Welcome'
                   CHECK (trigger_type IN ('Welcome', 'Join', 'Leave', 'Reward', 'Timer')),
  media_url        TEXT DEFAULT '',
  duration         INTEGER DEFAULT 5,
  is_skippable     BOOLEAN DEFAULT TRUE,
  skip_after       INTEGER DEFAULT 3,
  interval_minutes INTEGER DEFAULT 5,
  priority         INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive')),
  title            TEXT DEFAULT '',
  description      TEXT DEFAULT '',
  button_text      TEXT DEFAULT '',
  link_url         TEXT DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaigns_select_all"  ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_insert" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_update" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_delete" ON public.campaigns;

CREATE POLICY "campaigns_select_all"
  ON public.campaigns FOR SELECT USING (true);

CREATE POLICY "campaigns_admin_insert"
  ON public.campaigns FOR INSERT
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "campaigns_admin_update"
  ON public.campaigns FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "campaigns_admin_delete"
  ON public.campaigns FOR DELETE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ── NOTIFICATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT '',
  message      TEXT DEFAULT '',
  full_message TEXT DEFAULT '',
  time         TEXT DEFAULT '',
  icon_type    TEXT DEFAULT 'bell',
  icon_color   TEXT DEFAULT '',
  icon_bg      TEXT DEFAULT '',
  action_label TEXT DEFAULT '',
  action_path  TEXT DEFAULT '',
  unread       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_own_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_own_delete" ON public.notifications;

CREATE POLICY "notifications_own_select"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "notifications_insert_all"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_own_update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_own_delete"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ── BANNERS (ensure it exists) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image       TEXT DEFAULT '',
  title       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  button_text TEXT DEFAULT '',
  link        TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_select_all"   ON public.banners;
DROP POLICY IF EXISTS "banners_admin_insert" ON public.banners;
DROP POLICY IF EXISTS "banners_admin_update" ON public.banners;
DROP POLICY IF EXISTS "banners_admin_delete" ON public.banners;

CREATE POLICY "banners_select_all"
  ON public.banners FOR SELECT USING (true);

CREATE POLICY "banners_admin_insert"
  ON public.banners FOR INSERT
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "banners_admin_update"
  ON public.banners FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "banners_admin_delete"
  ON public.banners FOR DELETE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ── CATEGORIES RLS (ensure correct policies) ──────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all"   ON public.categories;
DROP POLICY IF EXISTS "categories_admin_insert"  ON public.categories;
DROP POLICY IF EXISTS "categories_admin_update"  ON public.categories;
DROP POLICY IF EXISTS "categories_admin_delete"  ON public.categories;

CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "categories_admin_insert"
  ON public.categories FOR INSERT
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "categories_admin_update"
  ON public.categories FOR UPDATE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "categories_admin_delete"
  ON public.categories FOR DELETE
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- ── RPC: approve_transaction ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.approve_transaction(tx_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  SELECT * INTO v_tx FROM public.transactions WHERE id = tx_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF v_tx.status = 'success' THEN RETURN; END IF;

  UPDATE public.transactions SET status = 'success' WHERE id = tx_id;

  IF v_tx.type = 'deposit' THEN
    UPDATE public.profiles SET coins = coins + v_tx.amount WHERE id = v_tx.user_id;
  ELSIF v_tx.type = 'withdrawal' THEN
    UPDATE public.profiles SET coins = GREATEST(0, coins - v_tx.amount) WHERE id = v_tx.user_id;
  END IF;
END;
$$;

-- ── RPC: reject_transaction ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_transaction(tx_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  UPDATE public.transactions SET status = 'rejected' WHERE id = tx_id;
END;
$$;

-- ── RPC: adjust_user_coins ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.adjust_user_coins(target_user_id UUID, delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_coins INTEGER;
BEGIN
  IF NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  UPDATE public.profiles
    SET coins = GREATEST(0, coins + delta)
  WHERE id = target_user_id
  RETURNING coins INTO new_coins;
  RETURN new_coins;
END;
$$;
