import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { ProfileData } from '@/utils/types';

const toGamesArray = (raw: unknown): { game: string; uid: string }[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [];
};

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_index, games, balance, is_admin')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        setFetchError(error.message);
      }
      if (data) {
        setProfile({ ...data, games: toGamesArray(data.games) });
      }
    } catch (e: any) {
      setFetchError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const save = async (updates: Partial<ProfileData>): Promise<{ error: Error | null }> => {
    if (!userId) return { error: new Error('Not authenticated') };
    try {
      const payload = {
        id: userId,
        full_name: updates.full_name ?? '',
        username: updates.username ?? null,
        avatar_index: updates.avatar_index ?? 0,
        games: toGamesArray(updates.games),
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (upsertErr) return { error: new Error(upsertErr.message) };

      setProfile(prev => ({
        ...prev,
        ...payload,
      }));
      return { error: null };
    } catch (e: any) {
      return { error: new Error(e?.message ?? 'Save failed') };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, fetchError, save, refresh: fetchProfile };
}
