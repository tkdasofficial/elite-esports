import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    coins: number;
    rank: string;
    bio?: string;
    phone?: string;
  } | null;
  gameProfiles: {
    id: string;
    gameName: string;
    ign: string;
    uid: string;
  }[];
  joinedMatchIds: string[];
  transactions: {
    id: string;
    type: 'deposit' | 'withdrawal' | 'win' | 'entry';
    amount: number;
    date: string;
    status: 'pending' | 'success' | 'rejected';
    method?: 'upi' | 'giftcard';
    details?: string;
    title?: string;
  }[];
  team: {
    id: string;
    name: string;
    tag: string;
    members: {
      id: string;
      username: string;
      role: string;
      rank: string;
    }[];
  } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (userData: any, isAdmin?: boolean) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserState['user']>) => void;
  updateCoins: (amount: number) => void;
  addTransaction: (tx: Omit<UserState['transactions'][0], 'id' | 'date'>) => void;
  addGameProfile: (profile: { gameName: string; ign: string; uid: string }) => void;
  updateGameProfile: (id: string, profile: Partial<{ gameName: string; ign: string; uid: string }>) => void;
  removeGameProfile: (id: string) => void;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  createTeam: (name: string, tag: string) => void;
  joinTeam: (teamId: string) => void;
  leaveTeam: () => void;
}

const DEFAULT_USER = {
  id: '1',
  username: 'EsportsPro',
  email: 'pro@elite.com',
  avatar: 'https://picsum.photos/seed/avatar/200',
  coins: 1250,
  rank: 'Diamond',
  bio: 'Professional Esports Player | Tournament Enthusiast',
};

const DEFAULT_GAME_PROFILES = [
  { id: '1', gameName: 'BGMI', ign: 'Elite_Pro_Gamer', uid: '5423198765' },
  { id: '2', gameName: 'Free Fire', ign: 'Elite_FF_King', uid: '9876543210' },
];

const DEFAULT_TRANSACTIONS = [
  { id: '1', type: 'deposit' as const, amount: 500, date: '20 Mar, 10:30 AM', status: 'success' as const, title: 'Added to Wallet' },
  { id: '2', type: 'entry' as const, amount: -50, date: '19 Mar, 08:15 PM', status: 'success' as const, title: 'Pro League Entry' },
  { id: '3', type: 'win' as const, amount: 250, date: '18 Mar, 11:00 PM', status: 'success' as const, title: 'Elite Scrims Win' },
];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: DEFAULT_USER,
      gameProfiles: DEFAULT_GAME_PROFILES,
      joinedMatchIds: [],
      transactions: DEFAULT_TRANSACTIONS,
      team: null,
      isAuthenticated: true,
      isAdmin: false,

      login: (userData, isAdmin = false) =>
        set({ user: userData, isAuthenticated: true, isAdmin }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          joinedMatchIds: [],
          team: null,
        }),

      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      updateCoins: (amount) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, coins: state.user.coins + amount }
            : null,
        })),

      addTransaction: (tx) =>
        set((state) => {
          const newTx = {
            ...tx,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          const updatedCoins =
            tx.status === 'success' && state.user
              ? { user: { ...state.user, coins: state.user.coins + tx.amount } }
              : {};
          return {
            transactions: [newTx, ...state.transactions],
            ...updatedCoins,
          };
        }),

      addGameProfile: (profile) =>
        set((state) => ({
          gameProfiles: [
            ...state.gameProfiles,
            { ...profile, id: Math.random().toString(36).substr(2, 9) },
          ],
        })),

      updateGameProfile: (id, profile) =>
        set((state) => ({
          gameProfiles: state.gameProfiles.map(p =>
            p.id === id ? { ...p, ...profile } : p
          ),
        })),

      removeGameProfile: (id) =>
        set((state) => ({
          gameProfiles: state.gameProfiles.filter(p => p.id !== id),
        })),

      joinMatch: (matchId) =>
        set((state) => ({
          joinedMatchIds: [...state.joinedMatchIds, matchId],
        })),

      leaveMatch: (matchId) =>
        set((state) => ({
          joinedMatchIds: state.joinedMatchIds.filter(id => id !== matchId),
        })),

      createTeam: (name, tag) =>
        set((state) => ({
          team: {
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            name,
            tag,
            members: [
              {
                id: state.user?.id || '1',
                username: state.user?.username || 'EsportsPro',
                role: 'Leader',
                rank: state.user?.rank || 'Diamond',
              },
            ],
          },
        })),

      joinTeam: (teamId) =>
        set((state) => ({
          team: {
            id: teamId,
            name: 'Elite Squad',
            tag: 'ELITE',
            members: [
              { id: '2', username: 'ProSlayer', role: 'Leader', rank: 'Master' },
              {
                id: state.user?.id || '1',
                username: state.user?.username || 'EsportsPro',
                role: 'Member',
                rank: state.user?.rank || 'Diamond',
              },
            ],
          },
        })),

      leaveTeam: () => set({ team: null }),
    }),
    {
      name: 'elite-user-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        gameProfiles: state.gameProfiles,
        joinedMatchIds: state.joinedMatchIds,
        transactions: state.transactions,
        team: state.team,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
