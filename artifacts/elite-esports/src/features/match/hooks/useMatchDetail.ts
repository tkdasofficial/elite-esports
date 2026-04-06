import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';
import { adaptMatch } from '@/services/dbAdapters';

const MATCH_SELECT =
  'id, title, game_id, banner_url, entry_fee, prize_pool, joined_players, max_players, status, scheduled_at, room_id, room_password, room_visible, description, rules, live_stream_url, youtube_url, twitch_url, facebook_url, tiktok_url, game_mode, squad_type, created_at, games(name)';

export type GameProfile = {
  uid: string;
  gameName: string;
  username: string;
};

export function useMatchDetail(id: string, userId?: string) {
  const [match, setMatch]       = useState<Match | null>(null);
  const [loading, setLoading]   = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining]   = useState(false);
  const [leaving, setLeaving]   = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (data) setMatch(adaptMatch(data));
    if (userId) {
      const { data: reg } = await supabase
        .from('match_participants')
        .select('id')
        .eq('match_id', id)
        .eq('user_id', userId)
        .maybeSingle();
      setHasJoined(!!reg);
    }
    setLoading(false);
  };

  /** Fetches the user's game profile (uid) for the given game_id, plus their username. */
  const fetchGameProfile = async (gameId: string): Promise<GameProfile | null> => {
    if (!userId) return null;

    const [gameUidRes, userRes] = await Promise.all([
      supabase
        .from('user_games')
        .select('uid, games(name)')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .maybeSingle(),
      supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (!gameUidRes.data) return null;

    const raw = gameUidRes.data;
    const gameName =
      (Array.isArray(raw.games) ? raw.games[0]?.name : (raw.games as any)?.name) ?? 'Unknown';

    return {
      uid:      raw.uid,
      gameName,
      username: userRes.data?.username ?? 'Player',
    };
  };

  const joinMatch = async () => {
    if (!userId) return { error: new Error('Not authenticated') };
    setJoining(true);

    const { data, error } = await supabase.rpc('join_match', { _match_id: id });

    setJoining(false);

    if (error) return { error };

    if (data && data.success === false) {
      return { error: new Error(data.error ?? 'Could not join match') };
    }

    setHasJoined(true);
    await fetch();
    return { error: null };
  };

  const leaveMatch = async (): Promise<{ error: Error | null; refunded: boolean; refundAmount: number }> => {
    if (!userId) return { error: new Error('Not authenticated'), refunded: false, refundAmount: 0 };

    setLeaving(true);
    try {
      const { data, error } = await supabase.rpc('leave_match', { _match_id: id });

      if (error) {
        return { error, refunded: false, refundAmount: 0 };
      }

      if (data?.success === false) {
        return { error: new Error(data.error ?? 'Could not leave match'), refunded: false, refundAmount: 0 };
      }

      setHasJoined(false);
      await fetch();

      return {
        error:        null,
        refunded:     false,
        refundAmount: 0,
      };
    } catch (e: any) {
      return { error: new Error(e?.message ?? 'Failed to leave match'), refunded: false, refundAmount: 0 };
    } finally {
      setLeaving(false);
    }
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(`match-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
        () => { fetch(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, userId]);

  return { match, loading, hasJoined, joining, joinMatch, leaving, leaveMatch, fetchGameProfile };
}
