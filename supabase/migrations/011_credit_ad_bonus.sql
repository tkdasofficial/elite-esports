-- Migration 011: SECURITY DEFINER RPC to credit ₹1 ad reward bonus
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Called from the mobile app after user earns a rewarded ad.

CREATE OR REPLACE FUNCTION public.credit_ad_bonus()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ref     TEXT;
  v_already BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Deduplicate: one bonus per calendar day per user
  v_ref := 'ad_bonus:' || v_user_id::text || ':' || TO_CHAR(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

  SELECT EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE user_id = v_user_id AND reference_id = v_ref
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bonus already claimed today');
  END IF;

  INSERT INTO public.wallet_transactions (user_id, type, amount, status, reference_id)
  VALUES (v_user_id, 'credit', 1, 'approved', v_ref);

  RETURN jsonb_build_object('success', true, 'amount', 1);
END;
$$;

REVOKE ALL ON FUNCTION public.credit_ad_bonus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_ad_bonus() TO authenticated;
