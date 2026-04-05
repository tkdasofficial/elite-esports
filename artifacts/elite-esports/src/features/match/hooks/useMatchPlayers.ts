import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type MatchPlayer = {
  user_id: string;
  username: string;
  avatar_index: number;
  joined_at: string;
};

export function useMatchPlayers(matchId: string, enabled: boolean) {
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('match_participants')
        .select('user_id, created_at, users(username, avatar_index)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (data) {
        setPlayers(
          data.map((row: any) => ({
            user_id: row.user_id,
            username: row.users?.username ?? 'Unknown',
            avatar_index: row.users?.avatar_index ?? 0,
            joined_at: row.created_at,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    fetchPlayers();

    const channel = supabase
      .channel(`match-players-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_participants',
          filter: `match_id=eq.${matchId}`,
        },
        () => { fetchPlayers(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, enabled]);

  return { players, loading, refresh: fetchPlayers };
}
