import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else { setMatches(data ?? []); setError(null); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const refresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('matches-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  return { matches, loading, refreshing, refresh, error };
}
