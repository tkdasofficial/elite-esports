import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Game } from '../types';

interface GameState {
  games: Game[];
  addGame: (game: Omit<Game, 'id' | 'matches'>) => void;
  updateGame: (id: string, updates: Partial<Omit<Game, 'id'>>) => void;
  deleteGame: (id: string) => void;
  toggleStatus: (id: string) => void;
  incrementMatches: (name: string) => void;
  decrementMatches: (name: string) => void;
  getActiveGames: () => Game[];
  getGameByName: (name: string) => Game | undefined;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      games: [],

      addGame: (game) =>
        set((state) => ({
          games: [
            ...state.games,
            { ...game, id: Math.random().toString(36).slice(2, 10), matches: 0 },
          ],
        })),

      updateGame: (id, updates) =>
        set((state) => ({
          games: state.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      deleteGame: (id) =>
        set((state) => ({ games: state.games.filter((g) => g.id !== id) })),

      toggleStatus: (id) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id
              ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' }
              : g
          ),
        })),

      incrementMatches: (name) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.name === name ? { ...g, matches: g.matches + 1 } : g
          ),
        })),

      decrementMatches: (name) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.name === name ? { ...g, matches: Math.max(0, g.matches - 1) } : g
          ),
        })),

      getActiveGames: () => get().games.filter((g) => g.status === 'active'),
      getGameByName: (name) => get().games.find((g) => g.name === name),
    }),
    {
      name: 'elite-games-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ games: state.games }),
      merge: (persisted, current) => ({
        ...current,
        games: (persisted as any).games ?? current.games,
      }),
    }
  )
);
