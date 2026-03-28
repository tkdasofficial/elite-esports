import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: { username: string; full_name: string; avatar_index: number };
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  game: string;
  created_at: string;
  team_members?: TeamMember[];
}

export function useMyTeam(userId?: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id, role, joined_at, teams(id, name, tag, game, created_at, team_members(id, user_id, role, joined_at, profiles(username, full_name, avatar_index)))')
        .eq('user_id', userId)
        .maybeSingle();
      if (membership) {
        setTeam((membership as any).teams ?? null);
      } else {
        setTeam(null);
      }
    } catch {
      setTeam(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  const refresh = () => { setRefreshing(true); fetch(); };

  useEffect(() => { fetch(); }, [fetch]);

  return { team, loading, refreshing, refresh };
}
