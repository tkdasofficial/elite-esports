import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import { Match, MatchParticipant, MatchWinners } from '../types';

interface MatchState {
  matches: Match[];
  liveMatches: Match[];
  upcomingMatches: Match[];
  completedMatches: Match[];
  searchQuery: string;
  loading: boolean;
  fetchMatches: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  getMatchById: (id: string) => Match | undefined;
  addMatch: (match: Omit<Match, 'match_id' | 'participants' | 'winners'>) => Promise<Match>;
  updateMatch: (id: string, match: Partial<Match>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  addParticipant: (matchId: string, participant: MatchParticipant) => void;
  removeParticipant: (matchId: string, userId: string) => void;
  setMatchWinners: (matchId: string, winners: MatchWinners) => Promise<void>;
}

const deriveFiltered = (matches: Match[]) => ({
  liveMatches:      matches.filter((m) => m.status === 'live'),
  upcomingMatches:  matches.filter((m) => m.status === 'upcoming'),
  completedMatches: matches.filter((m) => m.status === 'completed'),
});

function rowToMatch(row: any): Match {
  const participants: MatchParticipant[] = (row.match_participants ?? []).map((p: any) => ({
    id: p.user_id,
    username: p.username,
    joinedAt: p.joined_at,
  }));
  const { match_participants: _mp, ...rest } = row;
  return { ...rest, participants, winners: row.winners ?? {} } as Match;
}

export const useMatchStore = create<MatchState>()((set, get) => ({
  matches: [],
  liveMatches: [],
  upcomingMatches: [],
  completedMatches: [],
  searchQuery: '',
  loading: false,

  fetchMatches: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, match_participants(id, user_id, username, joined_at)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const matches = (data ?? []).map(rowToMatch);
      set({ matches, loading: false, ...deriveFiltered(matches) });
    } catch (e) {
      console.error('fetchMatches error:', e);
      set({ loading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  getMatchById: (id) => get().matches.find((m) => m.match_id === id),

  addMatch: async (match) => {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        game_name:    match.game_name,
        title:        match.title,
        mode:         match.mode,
        banner_image: match.banner_image,
        team1_name:   match.team1_name,
        team2_name:   match.team2_name,
        team1_logo:   match.team1_logo,
        team2_logo:   match.team2_logo,
        status:       match.status,
        start_time:   match.start_time,
        end_time:     match.end_time ?? null,
        entry_fee:    match.entry_fee,
        prize:        match.prize,
        slots_total:  match.slots_total,
        slots_filled: 0,
        team1_score:  match.team1_score ?? 0,
        team2_score:  match.team2_score ?? 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const newMatch: Match = { ...data, participants: [], winners: {} };
    set((s) => {
      const newMatches = [newMatch, ...s.matches];
      return { matches: newMatches, ...deriveFiltered(newMatches) };
    });
    return newMatch;
  },

  updateMatch: async (id, updatedMatch) => {
    const { participants: _p, ...fields } = updatedMatch as any;
    const dbFields: Record<string, any> = {};
    const allowed = [
      'game_name','title','mode','banner_image','team1_name','team2_name',
      'team1_logo','team2_logo','status','start_time','end_time','entry_fee',
      'prize','slots_total','slots_filled','team1_score','team2_score',
      'completed_at','show_until','delete_at','winners',
    ];
    for (const key of allowed) {
      if (key in fields) dbFields[key] = fields[key];
    }
    if (Object.keys(dbFields).length > 0) {
      const { error } = await supabase
        .from('matches')
        .update(dbFields)
        .eq('match_id', id);
      if (error) throw new Error(error.message);
    }
    set((s) => {
      const newMatches = s.matches.map((m) =>
        m.match_id === id ? { ...m, ...updatedMatch } : m
      );
      return { matches: newMatches, ...deriveFiltered(newMatches) };
    });
  },

  deleteMatch: async (id) => {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('match_id', id);
    if (error) throw new Error(error.message);
    set((s) => {
      const newMatches = s.matches.filter((m) => m.match_id !== id);
      return { matches: newMatches, ...deriveFiltered(newMatches) };
    });
  },

  addParticipant: (matchId, participant) =>
    set((s) => {
      const newMatches = s.matches.map((m) => {
        if (m.match_id !== matchId) return m;
        const existing = m.participants ?? [];
        if (existing.some((p) => p.id === participant.id)) return m;
        return {
          ...m,
          participants: [...existing, participant],
          slots_filled: (m.slots_filled ?? 0) + 1,
        };
      });
      return { matches: newMatches, ...deriveFiltered(newMatches) };
    }),

  removeParticipant: (matchId, userId) =>
    set((s) => {
      const newMatches = s.matches.map((m) => {
        if (m.match_id !== matchId) return m;
        const newParticipants = (m.participants ?? []).filter((p) => p.id !== userId);
        return {
          ...m,
          participants: newParticipants,
          slots_filled: Math.max(0, (m.slots_filled ?? 0) - 1),
        };
      });
      return { matches: newMatches, ...deriveFiltered(newMatches) };
    }),

  setMatchWinners: async (matchId, winners) => {
    const { error } = await supabase
      .from('matches')
      .update({ winners })
      .eq('match_id', matchId);
    if (error) throw new Error(error.message);
    set((s) => {
      const newMatches = s.matches.map((m) =>
        m.match_id === matchId ? { ...m, winners } : m
      );
      return { matches: newMatches, ...deriveFiltered(newMatches) };
    });
  },
}));
