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

  // Load stale data from cache immediately, then fetch fresh in background
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
      const { data } = await supabase
        .from('matches')
        .select('*, games(name, banner_url)')
        .order('created_at', { ascending: false });

      if (data) {
        const adapted = data.map(adaptMatch);
        setMatches(adapted);
        // Persist to cache silently
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(adapted)).catch(() => {});
      }
    } catch {
      // Network unavailable — stale cache is already showing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchFresh();
  }, [fetchFresh]);

  useEffect(() => {
    // Step 1: Show stale data instantly
    loadCache().then(() => {
      // Step 2: Silently refresh from network
      fetchFresh();
    });

    // Step 3: Subscribe to real-time changes
    const channel = supabase
      .channel('matches-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchFresh)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { matches, loading, refreshing, refresh };
}
