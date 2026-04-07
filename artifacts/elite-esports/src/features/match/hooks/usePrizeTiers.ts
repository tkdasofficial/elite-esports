import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type PrizeTier = {
  rank: number;
  prize_amount: number;
  percentage: number;
};

export function usePrizeTiers(matchId: string, prizePool: number, enabled: boolean) {
  const [tiers, setTiers] = useState<PrizeTier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !matchId) return;
    let cancelled = false;

    const fetchTiers = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('match_prize_splits')
          .select('rank, percentage')
          .eq('match_id', matchId)
          .order('rank', { ascending: true });

        if (cancelled) return;

        if (data && data.length > 0) {
          setTiers(
            data.map(t => ({
              rank:         t.rank,
              percentage:   Number(t.percentage),
              prize_amount: prizePool > 0
                ? Math.round(Number(t.percentage) * prizePool) / 100
                : 0,
            })),
          );
        } else if (prizePool > 0) {
          setTiers([
            { rank: 1, percentage: 50, prize_amount: Math.round(prizePool * 0.50 * 100) / 100 },
            { rank: 2, percentage: 30, prize_amount: Math.round(prizePool * 0.30 * 100) / 100 },
            { rank: 3, percentage: 10, prize_amount: Math.round(prizePool * 0.10 * 100) / 100 },
          ]);
        } else {
          setTiers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTiers();
    return () => { cancelled = true; };
  }, [matchId, prizePool, enabled]);

  return { tiers, loading };
}
