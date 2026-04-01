import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';

export interface TeamMember {
  id:        string;
  user_id:   string;
  role:      'captain' | 'member';
  joined_at: string;
  users?:    { username: string | null; name: string | null; avatar_url?: string | null };
}

export interface Team {
  id:         string;
  name:       string;
  tag:        string;
  slogan:     string;
  avatar:     string;
  code:       string;
  game:       string;
  created_by: string;
  created_at: string;
  team_members?: TeamMember[];
}

const MEMBER_SELECT = 'id, user_id, role, joined_at, users:profiles(username, name, avatar_url)';
const TEAM_SELECT   = `id, name, tag, slogan, avatar, code, game, created_by, created_at, team_members(${MEMBER_SELECT})`;

export function useMyTeam(userId?: string) {
  const [team,       setTeam]       = useState<Team | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data: membership } = await supabase
        .from('team_members')
        .select(`team_id, role, joined_at, teams(${TEAM_SELECT})`)
        .eq('user_id', userId)
        .maybeSingle();

      setTeam(membership ? ((membership as any).teams ?? null) : null);
    } catch {
      setTeam(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  const refresh = useCallback(() => { setRefreshing(true); fetchTeam(); }, [fetchTeam]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  /* ─── create team ───────────────────────────────────────────────── */
  const createTeam = useCallback(async (opts: {
    name: string; slogan: string; avatar: string; game: string;
  }): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');

    const tag = opts.name.slice(0, 4).toUpperCase();

    const { data: newTeam, error: teamErr } = await supabase
      .from('teams')
      .insert({
        name:       opts.name.trim(),
        tag,
        slogan:     opts.slogan.trim(),
        avatar:     opts.avatar,
        game:       opts.game,
        created_by: userId,
      })
      .select()
      .single();

    if (teamErr) throw new Error(teamErr.message);

    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: newTeam.id, user_id: userId, role: 'captain' });

    if (memberErr) throw new Error(memberErr.message);
    await fetchTeam();
  }, [userId, fetchTeam]);

  /* ─── join by code ─────────────────────────────────────────────── */
  const joinTeam = useCallback(async (code: string): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');

    const { data: found, error: findErr } = await supabase
      .from('teams')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle();

    if (findErr) throw new Error(findErr.message);
    if (!found)  throw new Error('No team found with that code. Check and try again.');

    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) throw new Error('You are already in a team. Leave your current team first.');

    // Check team member count
    const { count } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', found.id);

    if ((count ?? 0) >= 5) throw new Error('This team is full (max 5 members).');

    const { error: joinErr } = await supabase
      .from('team_members')
      .insert({ team_id: found.id, user_id: userId, role: 'member' });

    if (joinErr) throw new Error(joinErr.message);
    await fetchTeam();
  }, [userId, fetchTeam]);

  /* ─── revoke (kick) a member ────────────────────────────────────── */
  const revokeMember = useCallback(async (memberId: string): Promise<void> => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw new Error(error.message);
    await fetchTeam();
  }, [fetchTeam]);

  /* ─── leave team ────────────────────────────────────────────────── */
  const leaveTeam = useCallback(async (): Promise<void> => {
    if (!userId || !team) throw new Error('No team to leave');
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    await fetchTeam();
  }, [userId, team, fetchTeam]);

  return { team, loading, refreshing, refresh, createTeam, joinTeam, revokeMember, leaveTeam };
}
