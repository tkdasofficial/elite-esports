import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';

export function useMatchDetail(id: string, userId?: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('matches').select('*').eq('id', id).single();
    if (data) setMatch(data);
    if (userId) {
      const { data: reg } = await supabase
        .from('match_registrations')
        .select('id')
        .eq('match_id', id)
        .eq('user_id', userId)
        .single();
      setHasJoined(!!reg);
    }
    setLoading(false);
  };

  const joinMatch = async () => {
    if (!userId) return { error: new Error('Not authenticated') };
    setJoining(true);
    const { error } = await supabase.from('match_registrations').insert({ match_id: id, user_id: userId });
    setJoining(false);
    if (!error) setHasJoined(true);
    return { error };
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(`match-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, (payload) => {
        setMatch(prev => prev ? { ...prev, ...payload.new } : null);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, userId]);

  return { match, loading, hasJoined, joining, joinMatch };
}
