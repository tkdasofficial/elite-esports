import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';
import { adaptMatch } from '@/services/dbAdapters';

const MATCH_SELECT =
  'id, title, game_id, banner_url, entry_fee, prize_pool, joined_players, max_players, status, scheduled_at, room_id, room_password, room_visible, description, rules, live_stream_url, youtube_url, twitch_url, facebook_url, tiktok_url, created_at, games(name)';

export function useMatchDetail(id: string, userId?: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

  /**
   * Removes the current user from the match.
   * - Deletes their row from match_participants.
   * - Decrements joined_players on the match.
   * - Credits a refund to wallet_transactions if the match is still upcoming
   *   and there was an entry fee.
   *
   * Returns { error, refunded } — refunded=true means the entry fee was returned.
   */
  const leaveMatch = async (): Promise<{ error: Error | null; refunded: boolean }> => {
    if (!userId) return { error: new Error('Not authenticated'), refunded: false };
    if (!match)  return { error: new Error('Match data unavailable'), refunded: false };

    setLeaving(true);
    try {
      // ── Step 1: Remove the participant row ─────────────────────────────
      const { error: deleteError } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', id)
        .eq('user_id', userId);

      if (deleteError) return { error: deleteError, refunded: false };

      // ── Step 2: Decrement the player count ─────────────────────────────
      // Clamp at 0 to avoid negative counts if there's any stale state.
      const newCount = Math.max(0, match.players_joined - 1);
      await supabase
        .from('matches')
        .update({ joined_players: newCount })
        .eq('id', id);

      // ── Step 3: Refund entry fee (upcoming matches only) ───────────────
      let refunded = false;
      if (match.entry_fee > 0 && match.status === 'upcoming') {
        const { error: refundError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id:      userId,
            type:         'credit',
            amount:       match.entry_fee,
            status:       'completed',
            reference_id: `refund:${id}`,
          });
        // Credit the local wallet immediately even if DB insert succeeded
        if (!refundError) refunded = true;
      }

      // ── Step 4: Sync local state ───────────────────────────────────────
      setHasJoined(false);
      await fetch();

      return { error: null, refunded };
    } catch (e: any) {
      return { error: new Error(e?.message ?? 'Failed to leave match'), refunded: false };
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
        () => {
          fetch();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, userId]);

  return { match, loading, hasJoined, joining, joinMatch, leaving, leaveMatch };
}
