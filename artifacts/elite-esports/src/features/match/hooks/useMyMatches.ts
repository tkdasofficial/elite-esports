import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';

export function useMyMatches(userId?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from('match_registrations')
      .select('match_id, matches(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) {
      const resolved = data.map((row: any) => row.matches).filter(Boolean) as Match[];
      setMatches(resolved);
    }
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  const refresh = () => { setRefreshing(true); fetch(); };

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { matches, loading, refreshing, refresh };
}
