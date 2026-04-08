-- =============================================================================
--  Elite eSports — Migration 021: leave_match — remove entry fee refund
--  Run in: Supabase Dashboard → SQL Editor → New query → Run All
--
--  BUSINESS RULE:
--    When a user leaves a match the entry fee is FORFEITED — never refunded.
--    Migration 019 mistakenly added a refund path for 'upcoming' matches.
--    This migration removes that refund logic entirely.
--
--  WHAT CHANGES:
--    • leave_match() no longer touches wallets or wallet_transactions
--    • No 'refund:' reference entries will ever be created
--    • The ncm_wallet_credited trigger's 'refund:' branch stays but
--      will simply never fire (harmless)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.leave_match(_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_status  TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT status INTO v_status
  FROM public.matches WHERE id = _match_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Match not found');
  END IF;

  IF v_status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot leave a completed match');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = _match_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have not joined this match');
  END IF;

  DELETE FROM public.match_participants
  WHERE match_id = _match_id AND user_id = v_user_id;

  UPDATE public.matches
  SET joined_players = GREATEST(0, joined_players - 1)
  WHERE id = _match_id;

  -- Entry fee is forfeited. No wallet credit, no transaction record.

  RETURN jsonb_build_object('success', true, 'refunded', false, 'refund_amount', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.leave_match(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.leave_match(UUID) TO authenticated;

-- =============================================================================
-- DONE.
--   leave_match() now:
--     ✓ Removes user from match_participants
--     ✓ Decrements joined_players count
--     ✗ Does NOT credit wallet
--     ✗ Does NOT create any wallet_transaction record
--     ✗ Does NOT refund the entry fee under any circumstance
-- =============================================================================
