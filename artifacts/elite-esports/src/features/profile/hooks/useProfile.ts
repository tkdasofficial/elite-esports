import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { ProfileData } from '@/utils/types';

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
      const [userRes, walletRes, gamesRes] = await Promise.all([
        supabase.from('users').select('id, name, username, avatar_url').eq('id', userId).maybeSingle(),
        supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
        supabase.from('user_games').select('game_id, uid, games(name)').eq('user_id', userId),
      ]);

      const user = userRes.data;
      const wallet = walletRes.data;
      const rawGames = gamesRes.data ?? [];

      const games = rawGames.map((g: any) => ({
        game_id: g.game_id ?? '',
        game: (Array.isArray(g.games) ? g.games[0]?.name : g.games?.name) ?? g.game_id ?? '',
        uid: g.uid ?? '',
      }));

      if (user) {
        const rawAvatarUrl = user.avatar_url ?? '';
        const avatarIndex = /^\d+$/.test(rawAvatarUrl) ? parseInt(rawAvatarUrl, 10) : 0;
        setProfile({
          id: user.id,
          full_name: user.name ?? '',
          username: user.username,
          avatar_index: avatarIndex,
          games,
          balance: wallet?.balance ?? 0,
        });
      } else if (userRes.error && userRes.error.code !== 'PGRST116') {
        setFetchError(userRes.error.message);
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
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert({
          id: userId,
          name: updates.full_name ?? '',
          username: updates.username ?? null,
          avatar_url: String(updates.avatar_index ?? 0),
        }, { onConflict: 'id' });

      if (upsertErr) return { error: new Error(upsertErr.message) };

      if (updates.games !== undefined) {
        const { error: delErr } = await supabase
          .from('user_games')
          .delete()
          .eq('user_id', userId);
        if (delErr) return { error: new Error(delErr.message) };

        const validGames = (updates.games ?? []).filter(g => g.game_id);
        if (validGames.length > 0) {
          const { error: insertErr } = await supabase
            .from('user_games')
            .insert(validGames.map(g => ({
              user_id: userId,
              game_id: g.game_id,
              uid: g.uid,
            })));
          if (insertErr) return { error: new Error(insertErr.message) };
        }
      }

      setProfile(prev => ({
        ...prev,
        full_name: updates.full_name ?? prev.full_name,
        username: updates.username ?? prev.username,
        avatar_index: updates.avatar_index ?? prev.avatar_index,
        games: updates.games ?? prev.games,
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
