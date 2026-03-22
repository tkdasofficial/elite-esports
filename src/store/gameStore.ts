import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import { Game } from '../types';

interface GameState {
  games: Game[];
  loading: boolean;
  fetchGames: () => Promise<void>;
  addGame: (game: Omit<Game, 'id' | 'matches'>) => Promise<void>;
  updateGame: (id: string, updates: Partial<Omit<Game, 'id'>>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  incrementMatches: (name: string) => Promise<void>;
  decrementMatches: (name: string) => Promise<void>;
  getActiveGames: () => Game[];
  getGameByName: (name: string) => Game | undefined;
}

export const useGameStore = create<GameState>()((set, get) => ({
  games: [],
  loading: false,

  fetchGames: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      set({ games: (data ?? []) as Game[] });
    } catch (e) {
      console.error('fetchGames error:', e);
    } finally {
      set({ loading: false });
    }
  },

  addGame: async (game) => {
    const { data, error } = await supabase
      .from('games')
      .insert({
        name: game.name,
        category: game.category,
        logo: game.logo,
        banner: game.banner,
        status: game.status,
        matches: 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    set((s) => ({ games: [...s.games, data as Game] }));
  },

  updateGame: async (id, updates) => {
    const { error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({
      games: s.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  },

  deleteGame: async (id) => {
    const { error } = await supabase.from('games').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({ games: s.games.filter((g) => g.id !== id) }));
  },

  toggleStatus: async (id) => {
    const game = get().games.find((g) => g.id === id);
    if (!game) return;
    const newStatus = game.status === 'active' ? 'inactive' : 'active';
    await get().updateGame(id, { status: newStatus });
  },

  incrementMatches: async (name) => {
    const game = get().games.find((g) => g.name === name);
    if (!game) return;
    await get().updateGame(game.id, { matches: game.matches + 1 });
  },

  decrementMatches: async (name) => {
    const game = get().games.find((g) => g.name === name);
    if (!game) return;
    await get().updateGame(game.id, { matches: Math.max(0, game.matches - 1) });
  },

  getActiveGames: () => get().games.filter((g) => g.status === 'active'),
  getGameByName: (name) => get().games.find((g) => g.name === name),
}));
