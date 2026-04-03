import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { LeaderEntry } from '@/utils/types';

export function useLeaderboard() {
  const [data, setData]             = useState<LeaderEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('leaderboard')
        .select('user_id, username, avatar_url, wins, total_points, total_kills, matches_played')
        .order('wins', { ascending: false })
        .order('total_points', { ascending: false })
        .limit(100);

      if (error || !rows) {
        setData([]);
        return;
      }

      const entries: LeaderEntry[] = rows.map((row, i) => ({
        id:             row.user_id,
        username:       row.username ?? 'Unknown',
        wins:           row.wins ?? 0,
        rank:           i + 1,
        avatar_url:     row.avatar_url ?? undefined,
        total_points:   row.total_points ?? 0,
        total_kills:    row.total_kills ?? 0,
        matches_played: row.matches_played ?? 0,
      }));

      setData(entries);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => { setRefreshing(true); fetch(); };

  useEffect(() => { setLoading(true); fetch(); }, []);

  return { data, loading, refreshing, refresh };
}
