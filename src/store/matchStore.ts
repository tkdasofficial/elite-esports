import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Match, MatchParticipant, MatchWinners } from '../types';

interface MatchState {
  matches: Match[];
  liveMatches: Match[];
  upcomingMatches: Match[];
  completedMatches: Match[];
  searchQuery: string;
  setMatches: (matches: Match[]) => void;
  setSearchQuery: (query: string) => void;
  getMatchById: (id: string) => Match | undefined;
  addMatch: (match: Match) => void;
  updateMatch: (id: string, match: Partial<Match>) => void;
  deleteMatch: (id: string) => void;
  addParticipant: (matchId: string, participant: MatchParticipant) => void;
  removeParticipant: (matchId: string, userId: string) => void;
  setMatchWinners: (matchId: string, winners: MatchWinners) => void;
}

const deriveFiltered = (matches: Match[]) => ({
  liveMatches: matches.filter(m => m.status === 'live'),
  upcomingMatches: matches.filter(m => m.status === 'upcoming'),
  completedMatches: matches.filter(m => m.status === 'completed'),
});

export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      matches: [],
      liveMatches: [],
      upcomingMatches: [],
      completedMatches: [],
      searchQuery: '',

      setMatches: (matches) => set({ matches, ...deriveFiltered(matches) }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      getMatchById: (id) => get().matches.find(m => m.match_id === id),

      addMatch: (match) => set((state) => {
        const newMatches = [match, ...state.matches];
        return { matches: newMatches, ...deriveFiltered(newMatches) };
      }),

      updateMatch: (id, updatedMatch) => set((state) => {
        const newMatches = state.matches.map(m =>
          m.match_id === id ? { ...m, ...updatedMatch } : m
        );
        return { matches: newMatches, ...deriveFiltered(newMatches) };
      }),

      deleteMatch: (id) => set((state) => {
        const newMatches = state.matches.filter(m => m.match_id !== id);
        return { matches: newMatches, ...deriveFiltered(newMatches) };
      }),

      addParticipant: (matchId, participant) => set((state) => {
        const newMatches = state.matches.map(m => {
          if (m.match_id !== matchId) return m;
          const existing = m.participants ?? [];
          if (existing.some(p => p.id === participant.id)) return m;
          return { ...m, participants: [...existing, participant] };
        });
        return { matches: newMatches, ...deriveFiltered(newMatches) };
      }),

      removeParticipant: (matchId, userId) => set((state) => {
        const newMatches = state.matches.map(m => {
          if (m.match_id !== matchId) return m;
          return { ...m, participants: (m.participants ?? []).filter(p => p.id !== userId) };
        });
        return { matches: newMatches, ...deriveFiltered(newMatches) };
      }),

      setMatchWinners: (matchId, winners) => set((state) => {
        const newMatches = state.matches.map(m =>
          m.match_id === matchId ? { ...m, winners } : m
        );
        return { matches: newMatches, ...deriveFiltered(newMatches) };
      }),
    }),
    {
      name: 'elite-matches-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ matches: state.matches }),
      merge: (persisted, current) => {
        const matches = (persisted as any).matches ?? current.matches;
        return { ...current, matches, ...deriveFiltered(matches) };
      },
    }
  )
);
