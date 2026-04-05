import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type MatchWinner = {
  user_id: string;
  username: string;
  avatar_index: number;
  rank: number;
  points: number;
  prize: number;
};

export function useMatchWinners(matchId: string, enabled: boolean) {
  const [winners, setWinners] = useState<MatchWinner[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('match_participants')
        .select('user_id, rank, points, prize, users(username, avatar_index)')
        .eq('match_id', matchId)
        .not('rank', 'is', null)
        .order('rank', { ascending: true });

      if (data) {
        setWinners(
          data.map((row: any) => ({
            user_id: row.user_id,
            username: row.users?.username ?? 'Unknown',
            avatar_index: row.users?.avatar_index ?? 0,
            rank: row.rank,
            points: row.points ?? 0,
            prize: Number(row.prize ?? 0),
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    fetchWinners();
  }, [matchId, enabled]);

  return { winners, loading, refresh: fetchWinners };
}
