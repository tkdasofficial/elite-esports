import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type PrizeTier = {
  rank: number;
  prize_amount: number;
};

export function usePrizeTiers(matchId: string) {
  const [tiers, setTiers] = useState<PrizeTier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    const fetchTiers = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('match_prize_splits')
          .select('rank, prize_amount')
          .eq('match_id', matchId)
          .order('rank', { ascending: true });

        if (cancelled) return;

        setTiers(
          (data ?? []).map(t => ({
            rank:         t.rank,
            prize_amount: Number(t.prize_amount ?? 0),
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTiers();
    return () => { cancelled = true; };
  }, [matchId]);

  return { tiers, loading };
}
