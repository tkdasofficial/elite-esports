-- Migration 004: Rebuild leaderboard view around trophy wins
-- Run this in your Supabase SQL editor

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  u.id                                                                      AS user_id,
  u.username,
  u.avatar_url,
  COUNT(DISTINCT CASE WHEN mr.rank = 1 THEN mr.match_id END)::INTEGER       AS wins,
  COALESCE(SUM(mr.points), 0)::INTEGER                                      AS total_points,
  COALESCE(SUM(mr.kills),  0)::INTEGER                                      AS total_kills,
  COUNT(DISTINCT mr.match_id)::INTEGER                                       AS matches_played
FROM public.users u
INNER JOIN public.match_results mr ON mr.user_id = u.id
GROUP BY u.id, u.username, u.avatar_url
HAVING COUNT(DISTINCT CASE WHEN mr.rank = 1 THEN mr.match_id END) > 0;
