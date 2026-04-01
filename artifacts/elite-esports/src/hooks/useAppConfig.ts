import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface AppConfig {
  support_email:  string | null;
  queries_email:  string | null;
  legal_email:    string | null;
  youtube_url:    string | null;
  facebook_url:   string | null;
  instagram_url:  string | null;
  twitch_url:     string | null;
  twitter_url:    string | null;
  snapchat_url:   string | null;
  linkedin_url:   string | null;
}

const EMPTY: AppConfig = {
  support_email: null, queries_email: null, legal_email: null,
  youtube_url: null, facebook_url: null, instagram_url: null,
  twitch_url: null, twitter_url: null, snapchat_url: null, linkedin_url: null,
};

export function useAppConfig() {
  const [config, setConfig]   = useState<AppConfig>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase
        .from('app_config')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();
      if (active && data) setConfig(data as AppConfig);
      if (active) setLoading(false);
    })();

    const channel = supabase
      .channel('app_config_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_config' }, (payload) => {
        if (payload.new) setConfig(payload.new as AppConfig);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { config, loading };
}
