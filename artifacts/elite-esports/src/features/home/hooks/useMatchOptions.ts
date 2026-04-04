import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

interface MatchOptions {
  modes: string[];
  squads: string[];
  loading: boolean;
}

export function useMatchOptions(): MatchOptions {
  const [modes,   setModes]   = useState<string[]>([]);
  const [squads,  setSquads]  = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetch() {
      try {
        const [modesRes, squadsRes] = await Promise.all([
          supabase
            .from('match_modes')
            .select('name')
            .eq('status', 'active')
            .order('sort_order', { ascending: true }),
          supabase
            .from('squad_types')
            .select('name')
            .eq('status', 'active')
            .order('sort_order', { ascending: true }),
        ]);

        if (!active) return;

        if (modesRes.data)  setModes(modesRes.data.map((r: any) => r.name));
        if (squadsRes.data) setSquads(squadsRes.data.map((r: any) => r.name));
      } catch {
        // Tables may not exist yet — fall back to static options (handled in AdvancedFiltersSheet)
      } finally {
        if (active) setLoading(false);
      }
    }

    fetch();
    return () => { active = false; };
  }, []);

  return { modes, squads, loading };
}
