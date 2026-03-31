import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';
import { adaptMatch } from '@/services/dbAdapters';

export function useLiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('matches')
        .select('id, title, game_id, banner_url, entry_fee, prize_pool, joined_players, max_players, status, scheduled_at, room_id, room_password, room_visible, description, live_stream_url, created_at, games(name)')
        .eq('status', 'ongoing')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      if (data) setMatches(data.map(adaptMatch));
    } catch {
      if (matches.length === 0) {
        setError('Could not load matches. Tap to retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matches.length]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    fetchMatches();
    const channel = supabase
      .channel('live-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { matches, loading, refreshing, error, refresh, retry };
}
