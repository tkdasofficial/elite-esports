import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Exported Types ────────────────────────────────────────────────────────────

export interface PlatformUser {
  id: string;
  username: string;
  email: string;
  password: string;
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
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFee: number;
  referralEnabled: boolean;
  notificationsEnabled: boolean;
  autoApproveDeposits: boolean;
  maxTeamSize: number;
  twofa: boolean;
  loginNotif: boolean;
  emailAlerts: boolean;
  pushNotifs: boolean;
  smsAlerts: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'flat';
  maxUses: number;
  usedCount: number;
  expiry: string;
  isActive: boolean;
}

export interface Rule {
  id: string;
  title: string;
  category: string;
  content: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  user: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  replies: { from: 'user' | 'admin'; text: string; at: string }[];
}

export interface MatchTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  isActive: boolean;
  usageCount: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  type: 'announcement' | 'tournament' | 'reward' | 'system';
  audience: 'all' | 'premium' | 'inactive';
  sentAt: string;
  readCount: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  refereeId: string;
  refereeName: string;
  status: 'pending' | 'completed';
  bonusPaid: number;
  date: string;
}

export interface ReferralSettings {
  referrerBonus: number;
  refereeBonus: number;
  maxReferrals: number;
  enabled: boolean;
}

// ─── Store Interface ────────────────────────────────────────────────────────────

interface PlatformState {
  registeredUsers: PlatformUser[];
  adminTransactions: AdminTransaction[];
  /** Canonical settings object */
  platformSettings: PlatformSettings;
  /** Alias for platformSettings — used by AdminDashboard & Wallet */
  settings: PlatformSettings;
  promoCodes: PromoCode[];
  rules: Rule[];
  supportTickets: SupportTicket[];
  matchTags: MatchTag[];
  adminNotifications: AdminNotification[];
  referrals: Referral[];
  referralSettings: ReferralSettings;

  // Users
  registerUser: (user: PlatformUser) => void;
  updatePlatformUser: (id: string, updates: Partial<PlatformUser>) => void;
  banUser: (id: string) => void;
  unbanUser: (id: string) => void;
  adjustCoins: (id: string, delta: number) => void;
  deleteUser: (id: string) => void;

  // Transactions
  addAdminTransaction: (tx: Omit<AdminTransaction, 'id' | 'date'>) => void;
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  deleteTransaction: (id: string) => void;

  // Settings
  updatePlatformSettings: (updates: Partial<PlatformSettings>) => void;
  /** @deprecated prefer updatePlatformSettings */
  updateSettings: (updates: Partial<PlatformSettings>) => void;

  // Promo Codes
  addPromoCode: (promo: Omit<PromoCode, 'id' | 'usedCount'>) => void;
  updatePromoCode: (id: string, updates: Partial<PromoCode>) => void;
  deletePromoCode: (id: string) => void;
  togglePromoCode: (id: string) => void;

  // Rules
  addRule: (rule: Omit<Rule, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;

  // Support
  updateTicketStatus: (id: string, status: string) => void;
  replyToTicket: (id: string, text: string) => void;

  // Tags
  addMatchTag: (tag: Omit<MatchTag, 'id' | 'usageCount' | 'isActive'> & { isActive?: boolean }) => void;
  updateMatchTag: (id: string, updates: Partial<MatchTag>) => void;
  deleteMatchTag: (id: string) => void;

  // Notifications
  sendNotification: (notif: { title: string; body: string; type: string; audience: AdminNotification['audience'] }) => void;
  deleteNotification: (id: string) => void;

  // Referrals
  updateReferralSettings: (updates: Partial<ReferralSettings>) => void;
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: PlatformSettings = {
  upiId: '',
  bank: '',
  ifsc: '',
  platformName: 'Elite Esports',
  supportEmail: 'support@elite.com',
  maintenanceMode: false,
  registrationOpen: true,
  minWithdrawal: 100,
  maxWithdrawal: 10000,
  withdrawalFee: 2,
  referralEnabled: true,
  notificationsEnabled: true,
  autoApproveDeposits: false,
  maxTeamSize: 4,
  twofa: true,
  loginNotif: true,
  emailAlerts: true,
  pushNotifs: true,
  smsAlerts: false,
};

const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  referrerBonus: 50,
  refereeBonus: 25,
  maxReferrals: 10,
  enabled: true,
};

// ─── Store ─────────────────────────────────────────────────────────────────────

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      registeredUsers: [],
      adminTransactions: [],
      platformSettings: DEFAULT_SETTINGS,
      settings: DEFAULT_SETTINGS,
      promoCodes: [],
      rules: [],
      supportTickets: [],
      matchTags: [],
      adminNotifications: [],
      referrals: [],
      referralSettings: DEFAULT_REFERRAL_SETTINGS,

      // ── Users ──
      registerUser: (user) =>
        set((s) => ({ registeredUsers: [...s.registeredUsers, user] })),

      updatePlatformUser: (id, updates) =>
        set((s) => ({
          registeredUsers: s.registeredUsers.map(u => u.id === id ? { ...u, ...updates } : u),
        })),

      banUser: (id) =>
        set((s) => ({
          registeredUsers: s.registeredUsers.map(u => u.id === id ? { ...u, status: 'banned' } : u),
        })),

      unbanUser: (id) =>
        set((s) => ({
          registeredUsers: s.registeredUsers.map(u => u.id === id ? { ...u, status: 'active' } : u),
        })),

      adjustCoins: (id, delta) =>
        set((s) => ({
          registeredUsers: s.registeredUsers.map(u =>
            u.id === id ? { ...u, coins: Math.max(0, u.coins + delta) } : u
          ),
        })),

      deleteUser: (id) =>
        set((s) => ({ registeredUsers: s.registeredUsers.filter(u => u.id !== id) })),

      // ── Transactions ──
      addAdminTransaction: (tx) =>
        set((s) => ({
          adminTransactions: [
            {
              ...tx,
              id: `TXN${Date.now()}`,
              date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            },
            ...s.adminTransactions,
          ],
        })),

      approveTransaction: (id) =>
        set((s) => ({
          adminTransactions: s.adminTransactions.map(tx => tx.id === id ? { ...tx, status: 'success' } : tx),
        })),

      rejectTransaction: (id) =>
        set((s) => ({
          adminTransactions: s.adminTransactions.map(tx => tx.id === id ? { ...tx, status: 'rejected' } : tx),
        })),

      deleteTransaction: (id) =>
        set((s) => ({ adminTransactions: s.adminTransactions.filter(tx => tx.id !== id) })),

      // ── Settings ──
      updatePlatformSettings: (updates) =>
        set((s) => {
          const merged = { ...s.platformSettings, ...updates };
          return { platformSettings: merged, settings: merged };
        }),

      updateSettings: (updates) =>
        set((s) => {
          const merged = { ...s.platformSettings, ...updates };
          return { platformSettings: merged, settings: merged };
        }),

      // ── Promo Codes ──
      addPromoCode: (promo) =>
        set((s) => ({
          promoCodes: [{ ...promo, id: `PROMO${Date.now()}`, usedCount: 0 }, ...s.promoCodes],
        })),

      updatePromoCode: (id, updates) =>
        set((s) => ({
          promoCodes: s.promoCodes.map(p => p.id === id ? { ...p, ...updates } : p),
        })),

      deletePromoCode: (id) =>
        set((s) => ({ promoCodes: s.promoCodes.filter(p => p.id !== id) })),

      togglePromoCode: (id) =>
        set((s) => ({
          promoCodes: s.promoCodes.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p),
        })),

      // ── Rules ──
      addRule: (rule) =>
        set((s) => ({
          rules: [
            ...s.rules,
            { ...rule, isActive: rule.isActive ?? true, id: `RULE${Date.now()}`, createdAt: new Date().toISOString() },
          ],
        })),

      updateRule: (id, updates) =>
        set((s) => ({ rules: s.rules.map(r => r.id === id ? { ...r, ...updates } : r) })),

      deleteRule: (id) =>
        set((s) => ({ rules: s.rules.filter(r => r.id !== id) })),

      // ── Support ──
      updateTicketStatus: (id, status) =>
        set((s) => ({
          supportTickets: s.supportTickets.map(t =>
            t.id === id ? { ...t, status: status as SupportTicket['status'] } : t
          ),
        })),

      replyToTicket: (id, text) =>
        set((s) => ({
          supportTickets: s.supportTickets.map(t =>
            t.id === id
              ? { ...t, replies: [...t.replies, { from: 'admin' as const, text, at: new Date().toISOString() }] }
              : t
          ),
        })),

      // ── Tags ──
      addMatchTag: (tag) =>
        set((s) => ({
          matchTags: [...s.matchTags, { ...tag, isActive: tag.isActive ?? true, id: `TAG${Date.now()}`, usageCount: 0 }],
        })),

      updateMatchTag: (id, updates) =>
        set((s) => ({ matchTags: s.matchTags.map(t => t.id === id ? { ...t, ...updates } : t) })),

      deleteMatchTag: (id) =>
        set((s) => ({ matchTags: s.matchTags.filter(t => t.id !== id) })),

      // ── Notifications ──
      sendNotification: (notif) =>
        set((s) => ({
          adminNotifications: [
            {
              ...notif,
              type: notif.type as AdminNotification['type'],
              id: `NOTIF${Date.now()}`,
              sentAt: new Date().toISOString(),
              readCount: 0,
            },
            ...s.adminNotifications,
          ],
        })),

      deleteNotification: (id) =>
        set((s) => ({ adminNotifications: s.adminNotifications.filter(n => n.id !== id) })),

      // ── Referrals ──
      updateReferralSettings: (updates) =>
        set((s) => ({ referralSettings: { ...s.referralSettings, ...updates } })),
    }),
    {
      name: 'elite-platform-v3',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
