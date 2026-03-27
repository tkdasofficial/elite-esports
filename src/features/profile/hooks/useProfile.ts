import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { ProfileData } from '@/utils/types';

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setProfile({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
    setLoading(false);
  }, [userId]);

  const save = async (updates: ProfileData) => {
    if (!userId) return { error: new Error('Not authenticated') };
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...updates });
    if (!error) setProfile(prev => ({ ...prev, ...updates }));
    return { error };
  };

  useEffect(() => { fetch(); }, [fetch]);

  return { profile, loading, save, refresh: fetch };
}
