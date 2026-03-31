import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';
import { adaptMatch } from '@/services/dbAdapters';

export function useMyMatches(userId?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from('match_participants')
      .select('match_id, joined_at, matches(id, title, game_id, banner_url, entry_fee, prize_pool, joined_players, max_players, status, scheduled_at, room_id, room_password, room_visible, description, rules, live_stream_url, created_at, games(name))')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    if (data) {
      const resolved = data
        .map((row: any) => row.matches)
        .filter(Boolean)
        .map(adaptMatch);
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
