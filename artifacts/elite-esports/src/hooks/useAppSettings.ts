import { useState, useEffect, useCallback } from 'react';
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
  upi_id:       '',
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading,  setLoading]  = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('min_deposit, max_deposit, min_withdraw, max_withdraw, upi_id')
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettings({
          min_deposit:  Number(data.min_deposit)  || 10,
          max_deposit:  Number(data.max_deposit)  || 50000,
          min_withdraw: Number(data.min_withdraw) || 50,
          max_withdraw: Number(data.max_withdraw) || 50000,
          upi_id:       data.upi_id ?? '',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings' },
        (payload) => {
          const d = payload.new as any;
          setSettings({
            min_deposit:  Number(d.min_deposit)  || 10,
            max_deposit:  Number(d.max_deposit)  || 50000,
            min_withdraw: Number(d.min_withdraw) || 50,
            max_withdraw: Number(d.max_withdraw) || 50000,
            upi_id:       d.upi_id ?? '',
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSettings]);

  return { settings, loading, refresh: fetchSettings };
}
