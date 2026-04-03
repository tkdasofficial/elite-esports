import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface AdUnits {
  app_open:     string | null;
  interstitial: string | null;
  rewarded:     string | null;
}

const EMPTY: AdUnits = { app_open: null, interstitial: null, rewarded: null };

export function useAdUnits() {
  const [units, setUnits] = useState<AdUnits>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase
        .from('ad_units')
        .select('type, ad_unit_id')
        .eq('status', 'active');

      if (active && data) {
        const map: AdUnits = { app_open: null, interstitial: null, rewarded: null };
        for (const row of data) {
          if (row.type === 'app_open')     map.app_open     = row.ad_unit_id;
          if (row.type === 'interstitial') map.interstitial = row.ad_unit_id;
          if (row.type === 'rewarded')     map.rewarded     = row.ad_unit_id;
        }
        setUnits(map);
      }

      if (active) setReady(true);
    })();

    return () => { active = false; };
  }, []);

  return { units, ready };
}
