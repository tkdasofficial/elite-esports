import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';

// ─── Exported Types ────────────────────────────────────────────────────────────

export interface PlatformUser {
  id: string;
  username: string;
  email: string;
  password: string;
  rank: string;
  coins: number;
  status: 'active' | 'suspended' | 'banned';
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
  platformSettings: PlatformSettings;
  settings: PlatformSettings;
  promoCodes: PromoCode[];
  rules: Rule[];
  supportTickets: SupportTicket[];
  matchTags: MatchTag[];
  adminNotifications: AdminNotification[];
  referrals: Referral[];
  referralSettings: ReferralSettings;
  loading: boolean;

  // Fetch from Supabase
  fetchUsers: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchSettings: () => Promise<void>;

  // Users
  registerUser: (user: PlatformUser) => void;
  updatePlatformUser: (id: string, updates: Partial<PlatformUser>) => Promise<void>;
  banUser: (id: string) => Promise<void>;
  unbanUser: (id: string) => Promise<void>;
  suspendUser: (id: string) => Promise<void>;
  unsuspendUser: (id: string) => Promise<void>;
  adjustCoins: (id: string, delta: number) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Transactions
  addAdminTransaction: (tx: Omit<AdminTransaction, 'id' | 'date'>) => void;
  approveTransaction: (id: string) => Promise<void>;
  rejectTransaction: (id: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Settings
  updatePlatformSettings: (updates: Partial<PlatformSettings>) => Promise<void>;
  updateSettings: (updates: Partial<PlatformSettings>) => Promise<void>;

  // Promo Codes (local state — extend to Supabase if needed)
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

  // Admin Notifications
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
  supportEmail: '',
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

const DEFAULT_REFERRAL: ReferralSettings = {
  referrerBonus: 50,
  refereeBonus: 25,
  maxReferrals: 10,
  enabled: true,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapDbStatus(dbStatus: string): PlatformUser['status'] {
  if (dbStatus === 'banned')   return 'banned';
  if (dbStatus === 'inactive') return 'suspended';
  return 'active';
}

function dbStatusFromUI(uiStatus: PlatformUser['status']): string {
  if (uiStatus === 'banned')    return 'banned';
  if (uiStatus === 'suspended') return 'inactive';
  return 'active';
}

function rowToAdminTx(row: any): AdminTransaction {
  return {
    id:       row.id,
    user:     row.profiles?.username ?? row.username ?? 'Unknown',
    userId:   row.user_id,
    userTxId: row.id,
    amount:   row.amount,
    type:     row.type as AdminTransaction['type'],
    status:   row.status as AdminTransaction['status'],
    date:     row.created_at
      ? new Date(row.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '',
    method:   row.method ?? '',
    details:  row.details ?? '',
  };
}

function rowToSettings(row: any): PlatformSettings {
  return {
    upiId:                row.upi_id               ?? '',
    bank:                 row.bank                 ?? '',
    ifsc:                 row.ifsc                 ?? '',
    platformName:         row.platform_name        ?? 'Elite Esports',
    supportEmail:         row.support_email        ?? '',
    maintenanceMode:      row.maintenance_mode     ?? false,
    registrationOpen:     row.registration_open    ?? true,
    minWithdrawal:        row.min_withdrawal       ?? 100,
    maxWithdrawal:        row.max_withdrawal       ?? 10000,
    withdrawalFee:        row.withdrawal_fee       ?? 2,
    referralEnabled:      row.referral_enabled     ?? true,
    notificationsEnabled: row.notifications_enabled ?? true,
    autoApproveDeposits:  row.auto_approve_deposits ?? false,
    maxTeamSize:          row.max_team_size        ?? 4,
    twofa:                row.twofa                ?? true,
    loginNotif:           row.login_notif          ?? true,
    emailAlerts:          row.email_alerts         ?? true,
    pushNotifs:           row.push_notifs          ?? true,
    smsAlerts:            row.sms_alerts           ?? false,
  };
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const usePlatformStore = create<PlatformState>()((set, get) => ({
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
  referralSettings: DEFAULT_REFERRAL,
  loading: false,

  // ── Supabase Fetch ─────────────────────────────────────────────

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) throw error;
      const registeredUsers: PlatformUser[] = (data ?? []).map((u: any) => ({
        id:       u.id,
        username: u.username ?? '',
        email:    u.email ?? '',
        password: '***',
        rank:     u.rank ?? 'Bronze',
        coins:    u.coins ?? 0,
        status:   mapDbStatus(u.status ?? 'active'),
        joined:   u.created_at,
      }));
      set({ registeredUsers });
    } catch (e) {
      console.error('fetchUsers error:', e);
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, profiles(username)')
        .in('type', ['deposit', 'withdrawal'])
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      set({ adminTransactions: (data ?? []).map(rowToAdminTx) });
    } catch (e) {
      console.error('fetchTransactions error:', e);
    }
  },

  fetchSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', '1')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        const s = rowToSettings(data);
        set({ platformSettings: s, settings: s });
      }
    } catch (e) {
      console.error('fetchSettings error:', e);
    }
  },

  // ── Users ─────────────────────────────────────────────────────

  registerUser: (user) =>
    set((s) => ({ registeredUsers: [...s.registeredUsers, user] })),

  updatePlatformUser: async (id, updates) => {
    set((s) => ({
      registeredUsers: s.registeredUsers.map((u) => u.id === id ? { ...u, ...updates } : u),
    }));
    const dbFields: any = {};
    if (updates.username !== undefined) dbFields.username = updates.username;
    if (updates.rank     !== undefined) dbFields.rank     = updates.rank;
    if (updates.coins    !== undefined) dbFields.coins    = updates.coins;
    if (updates.status   !== undefined) dbFields.status   = dbStatusFromUI(updates.status);
    if (Object.keys(dbFields).length > 0) {
      await supabase.from('profiles').update(dbFields).eq('id', id);
    }
  },

  banUser: async (id) => {
    set((s) => ({
      registeredUsers: s.registeredUsers.map((u) => u.id === id ? { ...u, status: 'banned' } : u),
    }));
    await supabase.from('profiles').update({ status: 'banned' }).eq('id', id);
  },

  unbanUser: async (id) => {
    set((s) => ({
      registeredUsers: s.registeredUsers.map((u) => u.id === id ? { ...u, status: 'active' } : u),
    }));
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
  },

  suspendUser: async (id) => {
    set((s) => ({
      registeredUsers: s.registeredUsers.map((u) => u.id === id ? { ...u, status: 'suspended' } : u),
    }));
    await supabase.from('profiles').update({ status: 'inactive' }).eq('id', id);
  },

  unsuspendUser: async (id) => {
    set((s) => ({
      registeredUsers: s.registeredUsers.map((u) => u.id === id ? { ...u, status: 'active' } : u),
    }));
    await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
  },

  adjustCoins: async (id, delta) => {
    set((s) => ({
      registeredUsers: s.registeredUsers.map((u) =>
        u.id === id ? { ...u, coins: Math.max(0, u.coins + delta) } : u
      ),
    }));
    await supabase.rpc('adjust_user_coins', { target_user_id: id, delta });
  },

  deleteUser: async (id) => {
    set((s) => ({ registeredUsers: s.registeredUsers.filter((u) => u.id !== id) }));
    await supabase.from('profiles').delete().eq('id', id);
  },

  // ── Transactions ──────────────────────────────────────────────

  addAdminTransaction: (_tx) => {
    // No-op: transactions are written directly to Supabase by userStore.addTransaction
    // Admin panel sees them via fetchTransactions()
  },

  approveTransaction: async (id) => {
    set((s) => ({
      adminTransactions: s.adminTransactions.map((tx) =>
        tx.id === id ? { ...tx, status: 'success' } : tx
      ),
    }));
    const { error } = await supabase.rpc('approve_transaction', { tx_id: id });
    if (error) {
      console.error('approveTransaction error:', error.message);
      await get().fetchTransactions();
    }
  },

  rejectTransaction: async (id) => {
    set((s) => ({
      adminTransactions: s.adminTransactions.map((tx) =>
        tx.id === id ? { ...tx, status: 'rejected' } : tx
      ),
    }));
    const { error } = await supabase.rpc('reject_transaction', { tx_id: id });
    if (error) {
      console.error('rejectTransaction error:', error.message);
      await get().fetchTransactions();
    }
  },

  deleteTransaction: async (id) => {
    set((s) => ({ adminTransactions: s.adminTransactions.filter((tx) => tx.id !== id) }));
    await supabase.from('transactions').delete().eq('id', id);
  },

  // ── Settings ──────────────────────────────────────────────────

  updatePlatformSettings: async (updates) => {
    const merged = { ...get().platformSettings, ...updates };
    set({ platformSettings: merged, settings: merged });
    const dbFields: any = {};
    if (updates.upiId                !== undefined) dbFields.upi_id                = updates.upiId;
    if (updates.bank                 !== undefined) dbFields.bank                  = updates.bank;
    if (updates.ifsc                 !== undefined) dbFields.ifsc                  = updates.ifsc;
    if (updates.platformName         !== undefined) dbFields.platform_name         = updates.platformName;
    if (updates.supportEmail         !== undefined) dbFields.support_email         = updates.supportEmail;
    if (updates.maintenanceMode      !== undefined) dbFields.maintenance_mode      = updates.maintenanceMode;
    if (updates.registrationOpen     !== undefined) dbFields.registration_open     = updates.registrationOpen;
    if (updates.minWithdrawal        !== undefined) dbFields.min_withdrawal        = updates.minWithdrawal;
    if (updates.maxWithdrawal        !== undefined) dbFields.max_withdrawal        = updates.maxWithdrawal;
    if (updates.withdrawalFee        !== undefined) dbFields.withdrawal_fee        = updates.withdrawalFee;
    if (updates.referralEnabled      !== undefined) dbFields.referral_enabled      = updates.referralEnabled;
    if (updates.notificationsEnabled !== undefined) dbFields.notifications_enabled = updates.notificationsEnabled;
    if (updates.autoApproveDeposits  !== undefined) dbFields.auto_approve_deposits = updates.autoApproveDeposits;
    if (updates.maxTeamSize          !== undefined) dbFields.max_team_size         = updates.maxTeamSize;
    if (updates.twofa                !== undefined) dbFields.twofa                 = updates.twofa;
    if (updates.loginNotif           !== undefined) dbFields.login_notif           = updates.loginNotif;
    if (updates.emailAlerts          !== undefined) dbFields.email_alerts          = updates.emailAlerts;
    if (updates.pushNotifs           !== undefined) dbFields.push_notifs           = updates.pushNotifs;
    if (updates.smsAlerts            !== undefined) dbFields.sms_alerts            = updates.smsAlerts;
    if (Object.keys(dbFields).length > 0) {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({ id: '1', ...dbFields });
      if (error) console.error('updatePlatformSettings error:', error.message);
    }
  },

  updateSettings: async (updates) => get().updatePlatformSettings(updates),

  // ── Promo Codes ───────────────────────────────────────────────

  addPromoCode: (promo) =>
    set((s) => ({
      promoCodes: [{ ...promo, id: `PROMO${Date.now()}`, usedCount: 0 }, ...s.promoCodes],
    })),

  updatePromoCode: (id, updates) =>
    set((s) => ({
      promoCodes: s.promoCodes.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  deletePromoCode: (id) =>
    set((s) => ({ promoCodes: s.promoCodes.filter((p) => p.id !== id) })),

  togglePromoCode: (id) =>
    set((s) => ({
      promoCodes: s.promoCodes.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    })),

  // ── Rules ─────────────────────────────────────────────────────

  addRule: (rule) =>
    set((s) => ({
      rules: [
        ...s.rules,
        { ...rule, isActive: rule.isActive ?? true, id: `RULE${Date.now()}`, createdAt: new Date().toISOString() },
      ],
    })),

  updateRule: (id, updates) =>
    set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),

  deleteRule: (id) =>
    set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),

  // ── Support ───────────────────────────────────────────────────

  updateTicketStatus: (id, status) =>
    set((s) => ({
      supportTickets: s.supportTickets.map((t) =>
        t.id === id ? { ...t, status: status as SupportTicket['status'] } : t
      ),
    })),

  replyToTicket: (id, text) =>
    set((s) => ({
      supportTickets: s.supportTickets.map((t) =>
        t.id === id
          ? { ...t, replies: [...t.replies, { from: 'admin' as const, text, at: new Date().toISOString() }] }
          : t
      ),
    })),

  // ── Tags ──────────────────────────────────────────────────────

  addMatchTag: (tag) =>
    set((s) => ({
      matchTags: [...s.matchTags, { ...tag, isActive: tag.isActive ?? true, id: `TAG${Date.now()}`, usageCount: 0 }],
    })),

  updateMatchTag: (id, updates) =>
    set((s) => ({ matchTags: s.matchTags.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  deleteMatchTag: (id) =>
    set((s) => ({ matchTags: s.matchTags.filter((t) => t.id !== id) })),

  // ── Notifications ─────────────────────────────────────────────

  sendNotification: (notif) =>
    set((s) => ({
      adminNotifications: [
        {
          ...notif,
          type:      notif.type as AdminNotification['type'],
          id:        `NOTIF${Date.now()}`,
          sentAt:    new Date().toISOString(),
          readCount: 0,
        },
        ...s.adminNotifications,
      ],
    })),

  deleteNotification: (id) =>
    set((s) => ({ adminNotifications: s.adminNotifications.filter((n) => n.id !== id) })),

  // ── Referrals ─────────────────────────────────────────────────

  updateReferralSettings: (updates) =>
    set((s) => ({ referralSettings: { ...s.referralSettings, ...updates } })),
}));
