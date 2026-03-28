import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { LeaderEntry, LeaderboardTab } from '@/utils/types';

export function useLeaderboard(_tab: LeaderboardTab) {
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    const { data: rows } = await supabase
      .from('leaderboard')
      .select('user_id, username, avatar_url, total_points, total_kills, matches_played')
      .order('total_points', { ascending: false })
      .limit(50);
    if (rows) {
      setData(rows.map((r, i) => ({
        id: r.user_id,
        username: r.username ?? 'Unknown',
        kills: Number(r.total_kills ?? 0),
        points: Number(r.total_points ?? 0),
        rank: i + 1,
        avatar_url: r.avatar_url ?? undefined,
      })));
    }
    setLoading(false);
    setRefreshing(false);
  };

  const refresh = () => { setRefreshing(true); fetch(); };

  useEffect(() => { setLoading(true); fetch(); }, [_tab]);

  return { data, loading, refreshing, refresh };
}
