import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { LeaderEntry, LeaderboardTab } from '@/utils/types';

export function useLeaderboard(tab: LeaderboardTab) {
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    const { data: rows } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('type', tab.toLowerCase())
      .order('points', { ascending: false })
      .limit(50);
    if (rows) setData(rows.map((r, i) => ({ ...r, rank: i + 1 })));
    setLoading(false);
    setRefreshing(false);
  };

  const refresh = () => { setRefreshing(true); fetch(); };

  useEffect(() => { setLoading(true); fetch(); }, [tab]);

  return { data, loading, refreshing, refresh };
}
