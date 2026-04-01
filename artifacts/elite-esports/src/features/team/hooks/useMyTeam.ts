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

/** PostgreSQL undefined_column error code */
const PG_UNDEFINED_COLUMN = '42703';

export function useMyTeam(userId?: string) {
  const [team,       setTeam]       = useState<Team | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      /* Step 1 — find the user's latest team membership (limit 1 avoids maybeSingle error when multiple rows exist) */
      const { data: memberships, error: memErr } = await supabase
        .from('team_members')
        .select('team_id, role, joined_at')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (memErr || !memberships || memberships.length === 0) {
        setTeam(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const membership = memberships[0];

      /* Step 2 — fetch the team row (try full columns, fall back to basic) */
      let teamRow: Team | null = null;
      const { data: fullTeam, error: fullErr } = await supabase
        .from('teams')
        .select('id, name, tag, slogan, avatar, code, game, created_by, created_at')
        .eq('id', membership.team_id)
        .maybeSingle();

      if (fullErr) {
        /* Extended columns may not exist yet — fall back to base columns */
        const { data: basicTeam } = await supabase
          .from('teams')
          .select('id, name, tag, game, created_by, created_at')
          .eq('id', membership.team_id)
          .maybeSingle();
        if (basicTeam) {
          teamRow = { ...(basicTeam as any), slogan: '', avatar: '0', code: '--------' };
        }
      } else {
        teamRow = fullTeam as Team | null;
      }

      if (!teamRow) {
        setTeam(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      /* Step 3 — fetch all members of that team */
      const { data: membersRaw } = await supabase
        .from('team_members')
        .select('id, user_id, role, joined_at')
        .eq('team_id', teamRow.id)
        .order('joined_at', { ascending: true });

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

      setTeam({ ...teamRow, team_members: teamMembers });
    } catch (err) {
      console.error('[useMyTeam] fetchTeam error:', err);
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

    /* Check the user isn't already in a team */
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error('You are already in a team. Leave your current team first.');
    }

    const tag  = opts.name.trim().slice(0, 4).toUpperCase();
    const code = genCode();

    /* Try inserting with all extended columns first */
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

    let teamId: string;

    if (teamErr) {
      /* If the error is missing columns, fall back to the base schema */
      if (teamErr.code === PG_UNDEFINED_COLUMN || teamErr.message?.includes('column')) {
        const { data: fallback, error: fallbackErr } = await supabase
          .from('teams')
          .insert({ name: opts.name.trim(), tag, game: opts.game, created_by: userId })
          .select()
          .single();
        if (fallbackErr) throw new Error(fallbackErr.message);
        teamId = fallback.id;
      } else {
        throw new Error(teamErr.message);
      }
    } else {
      teamId = newTeam.id;
    }

    /* Add the creator as captain */
    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: userId, role: 'captain' });

    if (memberErr) throw new Error(memberErr.message);
    await fetchTeam();
  }, [userId, fetchTeam]);

  /* ─── update team (captain only) ───────────────────────────────── */
  const updateTeam = useCallback(async (opts: {
    name: string; slogan: string; avatar: string;
  }): Promise<void> => {
    if (!userId || !team) throw new Error('No team to update');
    const tag = opts.name.trim().slice(0, 4).toUpperCase();
    const { error } = await supabase
      .from('teams')
      .update({ name: opts.name.trim(), tag, slogan: opts.slogan.trim(), avatar: opts.avatar })
      .eq('id', team.id);

    if (error) throw new Error(error.message);
    await fetchTeam();
  }, [userId, team, fetchTeam]);

  /* ─── join by code ─────────────────────────────────────────────── */
  const joinTeam = useCallback(async (code: string): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error('You are already in a team. Leave your current team first.');
    }

    const { data: found, error: findErr } = await supabase
      .from('teams')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle();

    if (findErr) throw new Error(findErr.message);
    if (!found)  throw new Error('No team found with that code. Check and try again.');

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
