-- ============================================================
-- 13_functions.sql
-- Utility functions and stored procedures
-- ============================================================

-- Get global leaderboard (top N active users sorted by coins)
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id       UUID,
  username TEXT,
  coins    INTEGER,
  rank     TEXT,
  avatar   TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.coins, p.rank, p.avatar
  FROM public.profiles p
  WHERE p.status = 'active'
  ORDER BY p.coins DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award coins to a user (admin only)
CREATE OR REPLACE FUNCTION award_coins(target_user_id UUID, amount INTEGER, reason TEXT DEFAULT 'Admin award')
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET coins = coins + amount
  WHERE id = target_user_id;

  INSERT INTO public.transactions (user_id, type, amount, status, title, details)
  VALUES (target_user_id, 'win', amount, 'success', 'Coins Awarded', reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a username is available
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get a user's full wallet summary
CREATE OR REPLACE FUNCTION get_wallet_summary(target_user_id UUID)
RETURNS TABLE (
  coins         INTEGER,
  total_won     BIGINT,
  total_spent   BIGINT,
  total_deposited BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.coins,
    COALESCE(SUM(CASE WHEN t.type = 'win'   AND t.status = 'success' THEN t.amount ELSE 0 END), 0) AS total_won,
    COALESCE(SUM(CASE WHEN t.type = 'entry' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) AS total_spent,
    COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'success' THEN t.amount ELSE 0 END), 0) AS total_deposited
  FROM public.profiles p
  LEFT JOIN public.transactions t ON t.user_id = p.id
  WHERE p.id = target_user_id
  GROUP BY p.coins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
