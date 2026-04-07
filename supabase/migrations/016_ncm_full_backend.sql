-- ═════════════════════════════════════════════════════════════════════════════
-- Migration 016 · Native Cloud Messaging (NCM) — Full Backend
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────
-- Architecture:
--   Device registers → stores DUID + push_token in device_registrations
--   Backend event   → trigger calls notify_user() helper
--   notify_user()   → inserts row in ncm_notifications + notifications
--   Supabase Realtime carries the ncm_notifications INSERT to the device
--   App fires a LOCAL notification immediately (online path)
--   Background fetch polls pending rows every 15 min (offline fallback)
-- ═════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1 · device_registrations
--   One row per app-install (unique by DUID — Device Unique ID).
--   DUID is generated once on first launch, persisted in SecureStore on device.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.device_registrations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duid          TEXT        NOT NULL,           -- app-generated device unique ID
  platform      TEXT        NOT NULL DEFAULT 'android'
                            CHECK (platform IN ('ios','android','web')),
  os_version    TEXT,
  push_token    TEXT,                           -- raw APNs/FCM token (optional)
  email         TEXT,
  display_name  TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT device_registrations_duid_key UNIQUE (duid)
);

CREATE INDEX IF NOT EXISTS idx_device_reg_user     ON public.device_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_reg_active   ON public.device_registrations(user_id, is_active);

ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dr_select_own"  ON public.device_registrations;
DROP POLICY IF EXISTS "dr_upsert_own"  ON public.device_registrations;
DROP POLICY IF EXISTS "dr_update_own"  ON public.device_registrations;
DROP POLICY IF EXISTS "dr_admin"       ON public.device_registrations;

CREATE POLICY "dr_select_own" ON public.device_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dr_upsert_own" ON public.device_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dr_update_own" ON public.device_registrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "dr_admin" ON public.device_registrations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2 · ncm_notifications
--   Every notification that should reach a device is queued here.
--   target_user_id = NULL  → broadcast to all active users
--   target_duid    = NULL  → all devices of target_user_id
--   status:
--     pending   – inserted, not yet confirmed delivered
--     delivered – device confirmed receipt (marked by app)
--     failed    – delivery not confirmed after max retries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ncm_notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id  UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  target_duid     TEXT,                       -- optional: target one device only
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  data            JSONB       NOT NULL DEFAULT '{}',
  channel_id      TEXT        NOT NULL DEFAULT 'elite-esports-default',
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','delivered','failed')),
  delivered_at    TIMESTAMPTZ,
  retry_count     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ncm_user_status ON public.ncm_notifications(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_ncm_pending     ON public.ncm_notifications(status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.ncm_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ncm_select_own"  ON public.ncm_notifications;
DROP POLICY IF EXISTS "ncm_update_own"  ON public.ncm_notifications;
DROP POLICY IF EXISTS "ncm_admin_all"   ON public.ncm_notifications;

-- Users can read their own + broadcast (target_user_id IS NULL) notifications
CREATE POLICY "ncm_select_own" ON public.ncm_notifications
  FOR SELECT USING (
    target_user_id = auth.uid()
    OR target_user_id IS NULL
  );

-- Users can mark their own as delivered
CREATE POLICY "ncm_update_own" ON public.ncm_notifications
  FOR UPDATE USING (
    target_user_id = auth.uid()
  );

-- Admins have full access (for broadcasting)
CREATE POLICY "ncm_admin_all" ON public.ncm_notifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- ENABLE REALTIME on ncm_notifications
--   This is what carries INSERT events to connected devices in real time.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'ncm_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ncm_notifications;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'device_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_registrations;
  END IF;
END
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTION · notify_user()
--   Inserts one row into ncm_notifications (triggers Realtime delivery)
--   AND one row into notifications (populates in-app notification list).
--   Called by every trigger below.
--   p_channel maps to Android notification channel:
--     elite-esports-match     → match alerts
--     elite-esports-reward    → prizes & wallet
--     elite-esports-account   → deposits / withdrawals
--     elite-esports-default   → general
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id  UUID,
  p_title    TEXT,
  p_body     TEXT,
  p_channel  TEXT    DEFAULT 'elite-esports-default',
  p_data     JSONB   DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Push queue (drives Realtime → device local notification)
  INSERT INTO public.ncm_notifications
    (target_user_id, title, body, channel_id, data, status)
  VALUES
    (p_user_id, p_title, p_body, p_channel, p_data, 'pending');

  -- In-app notification list
  INSERT INTO public.notifications
    (user_id, title, message, type, is_read)
  VALUES
    (p_user_id, p_title, p_body,
     COALESCE(p_data->>'type', 'general'),
     false);
END;
$$;

REVOKE ALL ON FUNCTION public.notify_user(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.notify_user(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 1 · match_participants INSERT
--   Fires when a user successfully joins a match.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_match_joined()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
BEGIN
  SELECT COALESCE(title, 'a match') INTO v_title
  FROM public.matches WHERE id = NEW.match_id;

  PERFORM public.notify_user(
    NEW.user_id,
    '✅ You''re In!',
    'Successfully joined ' || v_title || '. Get ready to compete!',
    'elite-esports-match',
    jsonb_build_object('type','match_joined','match_id', NEW.match_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_match_joined ON public.match_participants;
CREATE TRIGGER ncm_match_joined
  AFTER INSERT ON public.match_participants
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_match_joined();


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 2 · wallet_transactions INSERT — prize credited
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_wallet_credited()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'prize' OR
     (NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'result:%')
  THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '🏆 Prize Credited!',
      '₹' || NEW.amount || ' has been added to your wallet. Well played!',
      'elite-esports-reward',
      jsonb_build_object('type','prize_credited','amount', NEW.amount, 'ref', NEW.reference_id)
    );

  ELSIF NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'referral:%' THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '🎁 Referral Bonus!',
      '₹' || NEW.amount || ' referral reward added to your wallet.',
      'elite-esports-reward',
      jsonb_build_object('type','referral_bonus','amount', NEW.amount)
    );

  ELSIF NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'ad_bonus:%' THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '📺 Ad Bonus Earned!',
      '₹' || NEW.amount || ' bonus added for watching an ad.',
      'elite-esports-reward',
      jsonb_build_object('type','ad_bonus','amount', NEW.amount)
    );

  ELSIF NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'refund:%' THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '↩️ Entry Fee Refunded',
      '₹' || NEW.amount || ' has been refunded to your wallet.',
      'elite-esports-account',
      jsonb_build_object('type','refund','amount', NEW.amount)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_wallet_credited ON public.wallet_transactions;
CREATE TRIGGER ncm_wallet_credited
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_wallet_credited();


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 3 · payments UPDATE — deposit approved or rejected
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '✅ Deposit Approved!',
      '₹' || NEW.amount || ' has been credited to your Elite eSports wallet.',
      'elite-esports-account',
      jsonb_build_object('type','deposit_approved','amount', NEW.amount)
    );

  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '❌ Deposit Rejected',
      'Your deposit of ₹' || NEW.amount || ' could not be processed. Please contact support.',
      'elite-esports-account',
      jsonb_build_object('type','deposit_rejected','amount', NEW.amount)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_payment_status ON public.payments;
CREATE TRIGGER ncm_payment_status
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_payment_status();


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 4 · withdrawals UPDATE — withdrawal approved or rejected
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_withdrawal_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '💸 Withdrawal Processed!',
      '₹' || NEW.amount || ' is on its way to your account. Allow 1-3 business days.',
      'elite-esports-account',
      jsonb_build_object('type','withdrawal_approved','amount', NEW.amount)
    );

  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '❌ Withdrawal Rejected',
      '₹' || NEW.amount || ' could not be withdrawn. Amount has been refunded to your wallet.',
      'elite-esports-account',
      jsonb_build_object('type','withdrawal_rejected','amount', NEW.amount)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_withdrawal_status ON public.withdrawals;
CREATE TRIGGER ncm_withdrawal_status
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_withdrawal_status();


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 5 · match_results INSERT — result published
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_match_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_prize NUMERIC;
BEGIN
  SELECT COALESCE(title, 'your match') INTO v_title
  FROM public.matches WHERE id = NEW.match_id;

  v_prize := COALESCE(NEW.prize_amount, 0);

  IF v_prize > 0 THEN
    PERFORM public.notify_user(
      NEW.user_id,
      '🏆 You Won! Rank #' || NEW.rank,
      v_title || ' ended. You finished #' || NEW.rank || ' and won ₹' || v_prize || '!',
      'elite-esports-reward',
      jsonb_build_object('type','match_result','match_id', NEW.match_id,
                          'rank', NEW.rank, 'prize', v_prize)
    );
  ELSE
    PERFORM public.notify_user(
      NEW.user_id,
      '📊 Match Result: #' || NEW.rank,
      v_title || ' has ended. You finished in position #' || NEW.rank || '. Better luck next time!',
      'elite-esports-match',
      jsonb_build_object('type','match_result','match_id', NEW.match_id,
                          'rank', NEW.rank, 'prize', 0)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_match_result ON public.match_results;
CREATE TRIGGER ncm_match_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_match_result();


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 6 · matches UPDATE — match goes LIVE or gets CANCELLED
--   Notifies ALL registered participants simultaneously.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_match_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant RECORD;
BEGIN
  -- Match just went live
  IF NEW.status = 'ongoing' AND OLD.status <> 'ongoing' THEN
    FOR v_participant IN
      SELECT user_id FROM public.match_participants WHERE match_id = NEW.id
    LOOP
      PERFORM public.notify_user(
        v_participant.user_id,
        '🎮 Match is LIVE!',
        NEW.title || ' has started! Open the app and join the room now.',
        'elite-esports-match',
        jsonb_build_object('type','match_live','match_id', NEW.id)
      );
    END LOOP;
  END IF;

  -- Match was cancelled
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    FOR v_participant IN
      SELECT user_id FROM public.match_participants WHERE match_id = NEW.id
    LOOP
      PERFORM public.notify_user(
        v_participant.user_id,
        '⚠️ Match Cancelled',
        NEW.title || ' has been cancelled. Your entry fee has been refunded.',
        'elite-esports-account',
        jsonb_build_object('type','match_cancelled','match_id', NEW.id)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_match_status_change ON public.matches;
CREATE TRIGGER ncm_match_status_change
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_match_status_change();


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 7 · payments INSERT — deposit received (pending)
--   Confirms the user's deposit was received and is awaiting admin review.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_payment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_user(
    NEW.user_id,
    '⏳ Deposit Received',
    'Your deposit of ₹' || NEW.amount || ' is under review. We''ll notify you once approved.',
    'elite-esports-account',
    jsonb_build_object('type','deposit_pending','amount', NEW.amount)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_payment_received ON public.payments;
CREATE TRIGGER ncm_payment_received
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_payment_received();


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 8 · withdrawals INSERT — withdrawal requested (pending)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_ncm_withdrawal_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_user(
    NEW.user_id,
    '⏳ Withdrawal Requested',
    'Your withdrawal of ₹' || NEW.amount || ' is being processed. Allow 1-3 business days.',
    'elite-esports-account',
    jsonb_build_object('type','withdrawal_pending','amount', NEW.amount)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_withdrawal_received ON public.withdrawals;
CREATE TRIGGER ncm_withdrawal_received
  AFTER INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_withdrawal_received();


-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN BROADCAST HELPER · broadcast_notification()
--   Admin calls this from the Supabase SQL Editor or admin panel to push a
--   custom notification to ALL active users or a specific user.
--   p_user_id = NULL → send to all active users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_title    TEXT,
  p_body     TEXT,
  p_user_id  UUID    DEFAULT NULL,
  p_channel  TEXT    DEFAULT 'elite-esports-default',
  p_data     JSONB   DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  INTEGER := 0;
  v_target RECORD;
BEGIN
  IF p_user_id IS NOT NULL THEN
    -- Send to single user
    PERFORM public.notify_user(p_user_id, p_title, p_body, p_channel, p_data);
    RETURN 1;
  END IF;

  -- Broadcast to all users who have at least one active device
  FOR v_target IN
    SELECT DISTINCT user_id
    FROM   public.device_registrations
    WHERE  is_active = true
  LOOP
    PERFORM public.notify_user(v_target.user_id, p_title, p_body, p_channel, p_data);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Only admins / service role can broadcast
REVOKE ALL ON FUNCTION public.broadcast_notification(TEXT, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;


-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-CLEANUP · delete delivered notifications older than 30 days
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_old_ncm_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ncm_notifications
  WHERE  status = 'delivered'
    AND  created_at < NOW() - INTERVAL '30 days';

  -- Also mark pending rows older than 7 days as failed (offline too long)
  UPDATE public.ncm_notifications
  SET    status = 'failed'
  WHERE  status = 'pending'
    AND  created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- To run cleanup weekly, call this from Supabase Dashboard → SQL Editor:
-- SELECT public.cleanup_old_ncm_notifications();
-- Or set a pg_cron job if available on your plan.


-- ─────────────────────────────────────────────────────────────────────────────
-- SUMMARY of notification triggers
-- ─────────────────────────────────────────────────────────────────────────────
-- Event                            Trigger Name               Channel
-- ──────────────────────────────── ────────────────────────── ──────────────────────────
-- User joins match                 ncm_match_joined           elite-esports-match
-- Prize / referral / ad / refund   ncm_wallet_credited        elite-esports-reward
-- Deposit submitted                ncm_payment_received       elite-esports-account
-- Deposit approved/rejected        ncm_payment_status         elite-esports-account
-- Withdrawal submitted             ncm_withdrawal_received    elite-esports-account
-- Withdrawal approved/rejected     ncm_withdrawal_status      elite-esports-account
-- Match result published           ncm_match_result           elite-esports-reward/match
-- Match goes live / cancelled      ncm_match_status_change    elite-esports-match
-- Admin manual push                broadcast_notification()   any channel
-- ─────────────────────────────────────────────────────────────────────────────
