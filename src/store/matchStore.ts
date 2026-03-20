import { create } from 'zustand';
import { Match } from '../types';

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
}

const now = new Date();

const initialMatches: Match[] = [
  {
    match_id: '1',
    game_name: 'BGMI',
    title: 'Pro Scrims: Elite Division',
    mode: 'Squad',
    banner_image: 'https://picsum.photos/seed/bgmi/800/450',
    team1_name: 'Soul Esports',
    team2_name: 'GodLike',
    team1_logo: 'https://picsum.photos/seed/soul/200/200',
    team2_logo: 'https://picsum.photos/seed/godlike/200/200',
    status: 'live',
    start_time: '10:30 PM',
    entry_fee: '₹50',
    prize: '₹5,000',
    slots_total: 100,
    slots_filled: 85,
  },
  {
    match_id: '2',
    game_name: 'Valorant',
    title: 'Challengers Cup: Finals',
    mode: '4v4',
    banner_image: 'https://picsum.photos/seed/val/800/450',
    team1_name: 'Global Esports',
    team2_name: 'Velocity Gaming',
    team1_logo: 'https://picsum.photos/seed/ge/200/200',
    team2_logo: 'https://picsum.photos/seed/vlt/200/200',
    status: 'upcoming',
    start_time: '11:45 PM',
    entry_fee: '₹100',
    prize: '₹12,000',
    slots_total: 48,
    slots_filled: 12,
  },
  {
    match_id: '3',
    game_name: 'Free Fire',
    title: 'Battle Royale: Season 12',
    mode: '1v1',
    banner_image: 'https://picsum.photos/seed/ff/800/450',
    team1_name: 'Total Gaming',
    team2_name: 'Desi Gamers',
    team1_logo: 'https://picsum.photos/seed/tg/200/200',
    team2_logo: 'https://picsum.photos/seed/dg/200/200',
    status: 'completed',
    start_time: '08:00 PM',
    end_time: '09:30 PM',
    entry_fee: '₹20',
    prize: '₹2,000',
    slots_total: 100,
    slots_filled: 100,
    team1_score: 12,
    team2_score: 8,
    completed_at: new Date(now.getTime() - 3600000).toISOString(),
    show_until: new Date(now.getTime() + 86400000).toISOString(),
    delete_at: new Date(now.getTime() + 172800000).toISOString(),
  },
  {
    match_id: '4',
    game_name: 'COD Mobile',
    title: 'Sniper Only: Duel',
    mode: '1v1',
    banner_image: 'https://picsum.photos/seed/cod/800/450',
    team1_name: 'Ghost',
    team2_name: 'Soap',
    team1_logo: 'https://picsum.photos/seed/ghost/200/200',
    team2_logo: 'https://picsum.photos/seed/soap/200/200',
    status: 'completed',
    start_time: '06:00 PM',
    entry_fee: '₹10',
    prize: '₹500',
    slots_total: 2,
    slots_filled: 2,
    team1_score: 5,
    team2_score: 2,
    completed_at: new Date(now.getTime() - 172800000).toISOString(),
    show_until: new Date(now.getTime() - 3600000).toISOString(),
    delete_at: new Date(now.getTime() + 86400000).toISOString(),
  }
];

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: initialMatches,
  liveMatches: initialMatches.filter(m => m.status === 'live'),
  upcomingMatches: initialMatches.filter(m => m.status === 'upcoming'),
  completedMatches: initialMatches.filter(m => m.status === 'completed'),
  searchQuery: '',
  setMatches: (matches) => set({ 
    matches,
    liveMatches: matches.filter(m => m.status === 'live'),
    upcomingMatches: matches.filter(m => m.status === 'upcoming'),
    completedMatches: matches.filter(m => m.status === 'completed'),
  }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  getMatchById: (id) => get().matches.find(m => m.match_id === id),
  addMatch: (match) => set((state) => {
    const newMatches = [match, ...state.matches];
    return {
      matches: newMatches,
      liveMatches: newMatches.filter(m => m.status === 'live'),
      upcomingMatches: newMatches.filter(m => m.status === 'upcoming'),
      completedMatches: newMatches.filter(m => m.status === 'completed'),
    };
  }),
  updateMatch: (id, updatedMatch) => set((state) => {
    const newMatches = state.matches.map(m => m.match_id === id ? { ...m, ...updatedMatch } : m);
    return {
      matches: newMatches,
      liveMatches: newMatches.filter(m => m.status === 'live'),
      upcomingMatches: newMatches.filter(m => m.status === 'upcoming'),
      completedMatches: newMatches.filter(m => m.status === 'completed'),
    };
  }),
  deleteMatch: (id) => set((state) => {
    const newMatches = state.matches.filter(m => m.match_id !== id);
    return {
      matches: newMatches,
      liveMatches: newMatches.filter(m => m.status === 'live'),
      upcomingMatches: newMatches.filter(m => m.status === 'upcoming'),
      completedMatches: newMatches.filter(m => m.status === 'completed'),
    };
  }),
}));
