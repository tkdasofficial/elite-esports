import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';

export function useMatchDetail(id: string, userId?: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const fetchData = useCallback(async () => {
    const currentUserId = userIdRef.current;
    const [matchRes, regRes] = await Promise.all([
      supabase.from('matches').select('*').eq('id', id).single(),
      currentUserId
        ? supabase.from('match_registrations').select('id').eq('match_id', id).eq('user_id', currentUserId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (matchRes.data) setMatch(matchRes.data);
    setHasJoined(!!regRes.data);
    setLoading(false);
  }, [id]);

  const joinMatch = async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return { error: new Error('Not authenticated') };
    if (!match) return { error: new Error('Match not found') };
    if (match.players_joined >= match.max_players) return { error: new Error('Match is full') };
    setJoining(true);
    const { error } = await supabase.from('match_registrations').insert({ match_id: id, user_id: currentUserId });
    if (!error) {
      setHasJoined(true);
      setMatch(prev => prev ? { ...prev, players_joined: prev.players_joined + 1 } : null);
    }
    setJoining(false);
    return { error };
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`match-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, (payload) => {
        setMatch(prev => prev ? { ...prev, ...(payload.new as Partial<Match>) } : null);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, fetchData]);

  return { match, loading, hasJoined, joining, joinMatch, refresh: fetchData };
}
