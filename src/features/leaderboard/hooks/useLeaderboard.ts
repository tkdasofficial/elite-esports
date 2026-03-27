import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { LeaderEntry, LeaderboardTab } from '@/utils/types';

export function useLeaderboard(tab: LeaderboardTab) {
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data: rows, error: err } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('type', tab.toLowerCase())
      .order('points', { ascending: false })
      .limit(50);
    if (err) setError(err.message);
    else { setData((rows ?? []).map((r, i) => ({ ...r, rank: i + 1 }))); setError(null); }
    setLoading(false);
    setRefreshing(false);
  }, [tab]);

  const refresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  return { data, loading, refreshing, refresh, error };
}
