import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type PrizeTier = {
  rank: number;
  prize_amount: number;
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
          .from('prize_tiers')
          .select('rank, prize_amount')
          .eq('match_id', matchId)
          .order('rank', { ascending: true });

        if (cancelled) return;

        if (data && data.length > 0) {
          setTiers(data.map(t => ({ rank: t.rank, prize_amount: Number(t.prize_amount) })));
        } else if (prizePool > 0) {
          setTiers([
            { rank: 1, prize_amount: Math.round(prizePool * 0.50 * 100) / 100 },
            { rank: 2, prize_amount: Math.round(prizePool * 0.30 * 100) / 100 },
            { rank: 3, prize_amount: Math.round(prizePool * 0.10 * 100) / 100 },
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
