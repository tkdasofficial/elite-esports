import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMatches(data);
    setLoading(false);
    setRefreshing(false);
  };

  const refresh = () => { setRefreshing(true); fetch(); };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('matches-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { matches, loading, refreshing, refresh };
}
