import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PlatformUser {
  id: string;
  username: string;
  email: string;
  rank: string;
  coins: number;
  status: 'active' | 'banned';
  joined: string;
}

export interface AdminTransaction {
  id: string;
  user: string;
  userId: string;
  userTxId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'success' | 'rejected';
  date: string;
  method: string;
  details?: string;
}

export interface PlatformSettings {
  upiId: string;
  bank: string;
  ifsc: string;
  minWithdrawal: string;
  maxWithdrawal: string;
  platformName: string;
  supportEmail: string;
  maintenance: boolean;
  twofa: boolean;
  loginNotif: boolean;
  emailAlerts: boolean;
  pushNotifs: boolean;
  smsAlerts: boolean;
}

interface PlatformState {
  registeredUsers: PlatformUser[];
  adminTransactions: AdminTransaction[];
  settings: PlatformSettings;

  registerUser: (user: PlatformUser) => void;
  updatePlatformUser: (id: string, updates: Partial<PlatformUser>) => void;
  banUser: (id: string) => void;
  unbanUser: (id: string) => void;
  adjustCoins: (id: string, delta: number) => void;
  deleteUser: (id: string) => void;

  addAdminTransaction: (tx: Omit<AdminTransaction, 'id' | 'date'>) => void;
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  deleteTransaction: (id: string) => void;

  updateSettings: (settings: Partial<PlatformSettings>) => void;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  upiId: '',
  bank: '',
  ifsc: '',
  minWithdrawal: '100',
  maxWithdrawal: '5000',
  platformName: 'Elite Esports',
  supportEmail: 'support@elite.com',
  maintenance: false,
  twofa: true,
  loginNotif: true,
  emailAlerts: true,
  pushNotifs: true,
  smsAlerts: false,
};

const DEFAULT_USERS: PlatformUser[] = [
  {
    id: '1',
    username: 'EsportsPro',
    email: 'pro@elite.com',
    rank: 'Diamond',
    coins: 1250,
    status: 'active',
    joined: '15 Jan 2024',
  },
];

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      registeredUsers: DEFAULT_USERS,
      adminTransactions: [],
      settings: DEFAULT_SETTINGS,

      registerUser: (user) =>
        set((state) => ({
          registeredUsers: [...state.registeredUsers, user],
        })),

      updatePlatformUser: (id, updates) =>
        set((state) => ({
          registeredUsers: state.registeredUsers.map(u =>
            u.id === id ? { ...u, ...updates } : u
          ),
        })),

      banUser: (id) =>
        set((state) => ({
          registeredUsers: state.registeredUsers.map(u =>
            u.id === id ? { ...u, status: 'banned' } : u
          ),
        })),

      unbanUser: (id) =>
        set((state) => ({
          registeredUsers: state.registeredUsers.map(u =>
            u.id === id ? { ...u, status: 'active' } : u
          ),
        })),

      adjustCoins: (id, delta) =>
        set((state) => ({
          registeredUsers: state.registeredUsers.map(u =>
            u.id === id ? { ...u, coins: Math.max(0, u.coins + delta) } : u
          ),
        })),

      deleteUser: (id) =>
        set((state) => ({
          registeredUsers: state.registeredUsers.filter(u => u.id !== id),
        })),

      addAdminTransaction: (tx) =>
        set((state) => ({
          adminTransactions: [
            {
              ...tx,
              id: `TXN${Date.now()}`,
              date: new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            ...state.adminTransactions,
          ],
        })),

      approveTransaction: (id) =>
        set((state) => ({
          adminTransactions: state.adminTransactions.map(tx =>
            tx.id === id ? { ...tx, status: 'success' } : tx
          ),
        })),

      rejectTransaction: (id) =>
        set((state) => ({
          adminTransactions: state.adminTransactions.map(tx =>
            tx.id === id ? { ...tx, status: 'rejected' } : tx
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          adminTransactions: state.adminTransactions.filter(tx => tx.id !== id),
        })),

      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: 'elite-platform-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
