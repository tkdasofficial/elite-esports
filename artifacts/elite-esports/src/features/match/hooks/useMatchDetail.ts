import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';
import { adaptMatch } from '@/services/dbAdapters';

export function useMatchDetail(id: string, userId?: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from('matches')
      .select('id, title, game_id, banner_url, entry_fee, prize_pool, joined_players, max_players, status, starts_at, room_id, room_password, description, live_stream_url, created_at, games(name)')
      .eq('id', id)
      .maybeSingle();
    if (data) setMatch(adaptMatch(data));
    if (userId) {
      const { data: reg } = await supabase
        .from('match_participants')
        .select('id')
        .eq('match_id', id)
        .eq('user_id', userId)
        .maybeSingle();
      setHasJoined(!!reg);
    }
    setLoading(false);
  };

  const joinMatch = async () => {
    if (!userId) return { error: new Error('Not authenticated') };
    setJoining(true);
    const { error } = await supabase
      .from('match_participants')
      .insert({ match_id: id, user_id: userId });
    setJoining(false);
    if (!error) {
      setHasJoined(true);
      await supabase
        .from('matches')
        .update({ joined_players: (match?.players_joined ?? 0) + 1 })
        .eq('id', id);
    }
    return { error };
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(`match-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, (payload) => {
        if (payload.new) setMatch(adaptMatch(payload.new));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, userId]);

  return { match, loading, hasJoined, joining, joinMatch };
}
