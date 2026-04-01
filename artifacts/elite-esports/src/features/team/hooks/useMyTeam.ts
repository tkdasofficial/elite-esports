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

/** Generate a random 8-char uppercase alphanumeric code */
function genCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export function useMyTeam(userId?: string) {
  const [team,       setTeam]       = useState<Team | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      /* Step 1 — find which team this user belongs to */
      const { data: membership, error: memErr } = await supabase
        .from('team_members')
        .select('team_id, role, joined_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (memErr || !membership) {
        setTeam(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      /* Step 2 — fetch the team row */
      const { data: teamRow, error: teamErr } = await supabase
        .from('teams')
        .select('id, name, tag, slogan, avatar, code, game, created_by, created_at')
        .eq('id', membership.team_id)
        .maybeSingle();

      if (teamErr || !teamRow) {
        setTeam(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      /* Step 3 — fetch all members of that team */
      const { data: membersRaw } = await supabase
        .from('team_members')
        .select('id, user_id, role, joined_at')
        .eq('team_id', teamRow.id);

      const members = membersRaw ?? [];

      /* Step 4 — fetch profiles for all members */
      const userIds = members.map(m => m.user_id);
      let profileMap: Record<string, { username: string | null; name: string | null; avatar_url?: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url')
          .in('id', userIds);

        (profiles ?? []).forEach(p => {
          profileMap[p.id] = { username: p.username ?? null, name: p.name ?? null, avatar_url: p.avatar_url ?? null };
        });
      }

      const teamMembers: TeamMember[] = members.map(m => ({
        id:        m.id,
        user_id:   m.user_id,
        role:      m.role as 'captain' | 'member',
        joined_at: m.joined_at,
        users:     profileMap[m.user_id] ?? { username: null, name: null },
      }));

      setTeam({ ...(teamRow as Team), team_members: teamMembers });
    } catch (err) {
      console.error('fetchTeam error:', err);
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

    const tag  = opts.name.slice(0, 4).toUpperCase();
    const code = genCode();

    const { data: newTeam, error: teamErr } = await supabase
      .from('teams')
      .insert({
        name:       opts.name.trim(),
        tag,
        slogan:     opts.slogan.trim(),
        avatar:     opts.avatar,
        code,
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

  /* ─── update team (captain only) ───────────────────────────────── */
  const updateTeam = useCallback(async (opts: {
    name: string; slogan: string; avatar: string;
  }): Promise<void> => {
    if (!userId || !team) throw new Error('No team to update');
    const tag = opts.name.slice(0, 4).toUpperCase();
    const { error } = await supabase
      .from('teams')
      .update({
        name:   opts.name.trim(),
        tag,
        slogan: opts.slogan.trim(),
        avatar: opts.avatar,
      })
      .eq('id', team.id);

    if (error) throw new Error(error.message);
    await fetchTeam();
  }, [userId, team, fetchTeam]);

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

  return { team, loading, refreshing, refresh, createTeam, updateTeam, joinTeam, revokeMember, leaveTeam };
}
