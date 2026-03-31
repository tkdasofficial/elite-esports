import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';
import { adaptMatch } from '@/services/dbAdapters';

const CACHE_KEY = 'cache:matches';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setMatches(JSON.parse(cached));
        setLoading(false);
      }
    } catch {
      // ignore cache read errors
    }
  }, []);

  const fetchFresh = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('matches')
        .select('id, title, game_id, banner_url, entry_fee, prize_pool, joined_players, max_players, status, scheduled_at, room_id, room_password, room_visible, description, rules, live_stream_url, created_at, games(name)')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      if (data) {
        const adapted = data.map(adaptMatch);
        setMatches(adapted);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(adapted)).catch(() => {});
      }
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
    fetchFresh();
  }, [fetchFresh]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFresh();
  }, [fetchFresh]);

  useEffect(() => {
    loadCache().then(() => {
      fetchFresh();
    });

    const channel = supabase
      .channel('matches-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchFresh)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { matches, loading, refreshing, error, refresh, retry };
}
