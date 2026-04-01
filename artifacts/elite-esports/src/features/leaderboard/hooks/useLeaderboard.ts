import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { LeaderEntry } from '@/utils/types';

export function useLeaderboard() {
  const [data, setData]           = useState<LeaderEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      // Pull every rank-1 result (= a trophy / match win)
      const { data: wins, error } = await supabase
        .from('match_results')
        .select('user_id')
        .eq('rank', 1);

      if (error || !wins) {
        setData([]);
        return;
      }

      if (wins.length === 0) {
        setData([]);
        return;
      }

      // Count trophies per user
      const winsCount = new Map<string, number>();
      for (const row of wins) {
        winsCount.set(row.user_id, (winsCount.get(row.user_id) ?? 0) + 1);
      }

      // Fetch usernames / avatars for every winner
      const userIds = Array.from(winsCount.keys());
      const { data: users } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (!users) {
        setData([]);
        return;
      }

      // Build & sort: most trophies first; same trophies → A–Z by name
      const entries: LeaderEntry[] = users
        .map(u => ({
          id:         u.id,
          username:   u.username ?? 'Unknown',
          wins:       winsCount.get(u.id) ?? 0,
          rank:       0,
          avatar_url: u.avatar_url ?? undefined,
        }))
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
        })
        .slice(0, 100)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));

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
