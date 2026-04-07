import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type MatchWinner = {
  user_id: string;
  username: string;
  avatar_index: number;
  rank: number;
  kills: number;
  points: number;
  prize: number;
};

export function useMatchWinners(matchId: string, enabled: boolean) {
  const [winners, setWinners] = useState<MatchWinner[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const { data: results } = await supabase
        .from('match_results')
        .select('user_id, rank, kills, points')
        .eq('match_id', matchId)
        .gt('rank', 0)
        .order('rank', { ascending: true });

      if (!results || results.length === 0) {
        setWinners([]);
        return;
      }

      const { data: matchData } = await supabase
        .from('matches')
        .select('prize_pool')
        .eq('id', matchId)
        .maybeSingle();

      const prizePool = Number(matchData?.prize_pool ?? 0);

      const { data: splitData } = await supabase
        .from('match_prize_splits')
        .select('rank, percentage')
        .eq('match_id', matchId)
        .order('rank', { ascending: true });

      const tierMap: Record<number, number> = {};
      if (splitData && splitData.length > 0) {
        splitData.forEach(s => {
          tierMap[s.rank] = prizePool > 0
            ? Math.round(Number(s.percentage) * prizePool) / 100
            : 0;
        });
      } else {
        tierMap[1] = Math.round(prizePool * 0.50 * 100) / 100;
        tierMap[2] = Math.round(prizePool * 0.30 * 100) / 100;
        tierMap[3] = Math.round(prizePool * 0.10 * 100) / 100;
      }

      const userIds = results.map(r => r.user_id);
      const { data: users } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const userMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
      (users ?? []).forEach(u => {
        userMap[u.id] = { username: u.username, avatar_url: u.avatar_url };
      });

      setWinners(
        results.map(r => {
          const u = userMap[r.user_id];
          const avatarRaw = u?.avatar_url ?? '0';
          const avatarIndex = /^\d+$/.test(avatarRaw) ? parseInt(avatarRaw, 10) : 0;
          return {
            user_id:      r.user_id,
            username:     u?.username ?? 'Unknown',
            avatar_index: avatarIndex,
            rank:         r.rank,
            kills:        r.kills ?? 0,
            points:       r.points ?? 0,
            prize:        tierMap[r.rank] ?? 0,
          };
        }),
      );
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
