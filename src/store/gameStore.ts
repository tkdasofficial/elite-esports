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

const INITIAL_GAMES: Game[] = [
  {
    id: '1',
    name: 'BGMI',
    category: 'Battle Royale',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    status: 'active',
    matches: 0,
  },
  {
    id: '2',
    name: 'Free Fire',
    category: 'Battle Royale',
    logo: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
    status: 'active',
    matches: 0,
  },
  {
    id: '3',
    name: 'Valorant',
    category: 'FPS',
    logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
    status: 'active',
    matches: 0,
  },
  {
    id: '4',
    name: 'COD Mobile',
    category: 'FPS',
    logo: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=200&q=80',
    banner: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80',
    status: 'active',
    matches: 0,
  },
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      games: INITIAL_GAMES,

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
      name: 'elite-games-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ games: state.games }),
      merge: (persisted, current) => ({
        ...current,
        games: (persisted as any).games ?? current.games,
      }),
    }
  )
);
