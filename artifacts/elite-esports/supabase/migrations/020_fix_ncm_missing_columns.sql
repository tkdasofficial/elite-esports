-- =============================================================================
--  Elite eSports — Migration 020: Fix ncm_notifications missing columns
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--
--  ROOT CAUSE:
--    ncm_notifications was created without the `data` JSONB column and
--    `retry_count` INTEGER column. The notify_user() trigger function
--    (which fires on every match join, wallet credit, payment, etc.)
--    tries to INSERT into these missing columns →
--      "column data of relation ncm_notifications does not exist"
--
--  FIX:
--    1. Add missing columns to ncm_notifications (safe with IF NOT EXISTS)
--    2. Recreate notify_user() with correct column list
--    3. Recreate all NCM trigger functions (they all call notify_user)
-- =============================================================================


-- ─── PART 1 · Add missing columns to ncm_notifications ───────────────────────

ALTER TABLE public.ncm_notifications
  ADD COLUMN IF NOT EXISTS data        JSONB   NOT NULL DEFAULT '{}';

ALTER TABLE public.ncm_notifications
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

-- Ensure channel_id exists (may be missing in some schema versions)
ALTER TABLE public.ncm_notifications
  ADD COLUMN IF NOT EXISTS channel_id TEXT NOT NULL DEFAULT 'elite-esports-default';

-- Ensure delivered_at exists
ALTER TABLE public.ncm_notifications
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add useful indexes if not present
CREATE INDEX IF NOT EXISTS idx_ncm_user_status ON public.ncm_notifications(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_ncm_pending     ON public.ncm_notifications(status, created_at)
  WHERE status = 'pending';


-- ─── PART 2 · Recreate notify_user() helper ──────────────────────────────────
--   Called by all 8 NCM triggers below. Inserts into BOTH tables:
--     ncm_notifications  → Realtime push to device
--     notifications      → In-app notification list

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id  UUID,
  p_title    TEXT,
  p_body     TEXT,
  p_channel  TEXT  DEFAULT 'elite-esports-default',
  p_data     JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ncm_notifications
    (target_user_id, title, body, channel_id, data, status)
  VALUES
    (p_user_id, p_title, p_body, p_channel, COALESCE(p_data, '{}'), 'pending');

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


-- ─── PART 3 · Recreate all NCM trigger functions ─────────────────────────────

-- Trigger 1: match joined
CREATE OR REPLACE FUNCTION public.trg_ncm_match_joined()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title TEXT;
BEGIN
  SELECT COALESCE(title, 'a match') INTO v_title FROM public.matches WHERE id = NEW.match_id;
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


-- Trigger 2: wallet credited
CREATE OR REPLACE FUNCTION public.trg_ncm_wallet_credited()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'result:%' THEN
    PERFORM public.notify_user(
      NEW.user_id, '🏆 Prize Credited!',
      '₹' || NEW.amount || ' has been added to your wallet. Well played!',
      'elite-esports-reward',
      jsonb_build_object('type','prize_credited','amount', NEW.amount, 'ref', NEW.reference_id)
    );
  ELSIF NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'referral:%' THEN
    PERFORM public.notify_user(
      NEW.user_id, '🎁 Referral Bonus!',
      '₹' || NEW.amount || ' referral reward added to your wallet.',
      'elite-esports-reward',
      jsonb_build_object('type','referral_bonus','amount', NEW.amount)
    );
  ELSIF NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'ad_bonus:%' THEN
    PERFORM public.notify_user(
      NEW.user_id, '📺 Ad Bonus Earned!',
      '₹' || NEW.amount || ' bonus added for watching an ad.',
      'elite-esports-reward',
      jsonb_build_object('type','ad_bonus','amount', NEW.amount)
    );
  ELSIF NEW.reference_id IS NOT NULL AND NEW.reference_id LIKE 'refund:%' THEN
    PERFORM public.notify_user(
      NEW.user_id, '↩️ Entry Fee Refunded',
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


-- Trigger 3: payment status update
CREATE OR REPLACE FUNCTION public.trg_ncm_payment_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.notify_user(
      NEW.user_id, '✅ Deposit Approved!',
      '₹' || NEW.amount || ' has been credited to your Elite eSports wallet.',
      'elite-esports-account',
      jsonb_build_object('type','deposit_approved','amount', NEW.amount)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.notify_user(
      NEW.user_id, '❌ Deposit Rejected',
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


-- Trigger 4: withdrawal status update
CREATE OR REPLACE FUNCTION public.trg_ncm_withdrawal_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    PERFORM public.notify_user(
      NEW.user_id, '💸 Withdrawal Processed!',
      '₹' || NEW.amount || ' is on its way to your account. Allow 1-3 business days.',
      'elite-esports-account',
      jsonb_build_object('type','withdrawal_approved','amount', NEW.amount)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    PERFORM public.notify_user(
      NEW.user_id, '❌ Withdrawal Rejected',
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


-- Trigger 5: match result inserted
CREATE OR REPLACE FUNCTION public.trg_ncm_match_result()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_title TEXT; v_prize NUMERIC;
BEGIN
  SELECT COALESCE(title, 'your match') INTO v_title FROM public.matches WHERE id = NEW.match_id;
  v_prize := COALESCE(NEW.prize_amount, 0);
  IF v_prize > 0 THEN
    PERFORM public.notify_user(
      NEW.user_id, '🏆 You Won! Rank #' || NEW.rank,
      v_title || ' ended. You finished #' || NEW.rank || ' and won ₹' || v_prize || '!',
      'elite-esports-reward',
      jsonb_build_object('type','match_result','match_id', NEW.match_id,'rank', NEW.rank,'prize', v_prize)
    );
  ELSE
    PERFORM public.notify_user(
      NEW.user_id, '📊 Match Result: #' || NEW.rank,
      v_title || ' has ended. You finished in position #' || NEW.rank || '. Better luck next time!',
      'elite-esports-match',
      jsonb_build_object('type','match_result','match_id', NEW.match_id,'rank', NEW.rank,'prize', 0)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ncm_match_result ON public.match_results;
CREATE TRIGGER ncm_match_result
  AFTER INSERT ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.trg_ncm_match_result();


-- Trigger 6: match goes live or gets cancelled
CREATE OR REPLACE FUNCTION public.trg_ncm_match_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_participant RECORD;
BEGIN
  IF NEW.status = 'ongoing' AND OLD.status <> 'ongoing' THEN
    FOR v_participant IN SELECT user_id FROM public.match_participants WHERE match_id = NEW.id LOOP
      PERFORM public.notify_user(
        v_participant.user_id, '🎮 Match is LIVE!',
        NEW.title || ' has started! Open the app and join the room now.',
        'elite-esports-match',
        jsonb_build_object('type','match_live','match_id', NEW.id)
      );
    END LOOP;
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    FOR v_participant IN SELECT user_id FROM public.match_participants WHERE match_id = NEW.id LOOP
      PERFORM public.notify_user(
        v_participant.user_id, '⚠️ Match Cancelled',
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


-- Trigger 7: deposit received (pending)
CREATE OR REPLACE FUNCTION public.trg_ncm_payment_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_user(
    NEW.user_id, '⏳ Deposit Received',
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


-- Trigger 8: withdrawal requested (pending)
CREATE OR REPLACE FUNCTION public.trg_ncm_withdrawal_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_user(
    NEW.user_id, '⏳ Withdrawal Requested',
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


-- ─── PART 4 · Recreate broadcast_notification ────────────────────────────────

CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_title   TEXT,
  p_body    TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller  UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_uid     UUID;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = v_caller) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;

  IF p_user_id IS NOT NULL THEN
    PERFORM public.notify_user(p_user_id, p_title, p_body, 'elite-esports-default',
      jsonb_build_object('type','broadcast'));
    RETURN jsonb_build_object('success', true, 'sent_to', p_user_id);
  ELSE
    FOR v_uid IN
      SELECT DISTINCT user_id FROM public.device_registrations WHERE is_active = true
    LOOP
      PERFORM public.notify_user(v_uid, p_title, p_body, 'elite-esports-default',
        jsonb_build_object('type','broadcast'));
    END LOOP;
    RETURN jsonb_build_object('success', true, 'sent_to', 'all');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.broadcast_notification(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.broadcast_notification(TEXT, TEXT, UUID) TO authenticated;


-- =============================================================================
-- DONE.
--   • ncm_notifications.data JSONB column added
--   • ncm_notifications.retry_count INTEGER column added
--   • notify_user() recreated with correct INSERT (includes data column)
--   • All 8 NCM trigger functions recreated
--   • broadcast_notification() recreated
--
-- After running this, match joining will no longer show any errors.
-- =============================================================================
