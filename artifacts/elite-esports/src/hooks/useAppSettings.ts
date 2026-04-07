import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export interface AppSettings {
  min_deposit:  number;
  max_deposit:  number;
  min_withdraw: number;
  max_withdraw: number;
  upi_id:       string;
}

const DEFAULTS: AppSettings = {
  min_deposit:  10,
  max_deposit:  50000,
  min_withdraw: 50,
  max_withdraw: 50000,
  upi_id:       'tusharkantidasofficial@oksbi',
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('min_deposit, max_deposit, min_withdraw, max_withdraw, upi_id')
          .limit(1)
          .maybeSingle();

        if (data) {
          setSettings({
            min_deposit:  Number(data.min_deposit),
            max_deposit:  Number(data.max_deposit),
            min_withdraw: Number(data.min_withdraw),
            max_withdraw: Number(data.max_withdraw),
            upi_id:       data.upi_id ?? 'elite@upi',
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { settings, loading };
}
