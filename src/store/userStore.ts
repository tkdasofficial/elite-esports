import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';

export interface UserTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'win' | 'entry';
  amount: number;
  date: string;
  status: 'pending' | 'success' | 'rejected';
  method?: 'upi' | 'giftcard';
  details?: string;
  title?: string;
}

export interface GameProfile {
  id: string;
  gameName: string;
  ign: string;
  uid: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  tag: string;
  members: {
    id: string;
    username: string;
    role: string;
    rank: string;
  }[];
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  coins: number;
  rank: string;
  bio?: string;
  phone?: string;
}

interface UserState {
  profileSetupComplete: boolean;
  user: UserProfile | null;
  gameProfiles: GameProfile[];
  joinedMatchIds: string[];
  transactions: UserTransaction[];
  team: TeamInfo | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;

  setProfileSetupComplete: (value: boolean) => void;
  login: (userData: UserProfile, isAdmin?: boolean) => void;
  logout: () => void;
  fetchUserData: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateCoins: (amount: number) => void;
  refreshCoins: (userId: string) => Promise<void>;

  addTransaction: (tx: Omit<UserTransaction, 'id' | 'date'> & { id?: string }) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<UserTransaction, 'id'>>) => Promise<void>;

  addGameProfile: (profile: { gameName: string; ign: string; uid: string }) => Promise<void>;
  updateGameProfile: (id: string, profile: Partial<{ gameName: string; ign: string; uid: string }>) => Promise<void>;
  removeGameProfile: (id: string) => Promise<void>;

  joinMatch: (matchId: string) => Promise<void>;
  leaveMatch: (matchId: string) => Promise<void>;

  createTeam: (name: string, tag: string) => Promise<void>;
  joinTeam: (teamId: string, teamName: string, teamTag: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
}

function formatDate(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function rowToTransaction(row: any): UserTransaction {
  return {
    id:      row.id,
    type:    row.type,
    amount:  row.amount,
    date:    row.created_at
      ? new Date(row.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : formatDate(),
    status:  row.status,
    method:  row.method,
    details: row.details,
    title:   row.title,
  };
}

export const useUserStore = create<UserState>()((set, get) => ({
  profileSetupComplete: false,
  user: null,
  gameProfiles: [],
  joinedMatchIds: [],
  transactions: [],
  team: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,

  setProfileSetupComplete: (value) => set({ profileSetupComplete: value }),

  login: (userData, isAdmin = false) =>
    set({ user: userData, isAuthenticated: true, isAdmin }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      gameProfiles: [],
      joinedMatchIds: [],
      transactions: [],
      team: null,
      profileSetupComplete: false,
    }),

  fetchUserData: async (userId: string) => {
    set({ loading: true });
    try {
      const [gpRes, txRes, mpRes, tmRes] = await Promise.all([
        supabase.from('game_profiles').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('match_participants').select('match_id').eq('user_id', userId),
        supabase.from('team_members').select('team_id, role, rank, teams(id, name, tag, team_members(user_id, role, rank, profiles(id, username)))').eq('user_id', userId).maybeSingle(),
      ]);

      const gameProfiles: GameProfile[] = (gpRes.data ?? []).map((r: any) => ({
        id: r.id, gameName: r.game_name, ign: r.ign, uid: r.uid,
      }));

      const transactions: UserTransaction[] = (txRes.data ?? []).map(rowToTransaction);

      const joinedMatchIds: string[] = (mpRes.data ?? []).map((r: any) => r.match_id);

      let team: TeamInfo | null = null;
      if (tmRes.data?.teams) {
        const t = tmRes.data.teams as any;
        team = {
          id:   t.id,
          name: t.name,
          tag:  t.tag,
          members: (t.team_members ?? []).map((m: any) => ({
            id:       m.profiles?.id ?? '',
            username: m.profiles?.username ?? '',
            role:     m.role,
            rank:     m.rank,
          })),
        };
      }

      set({ gameProfiles, transactions, joinedMatchIds, team });
    } catch (e) {
      console.error('fetchUserData error:', e);
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data) => {
    const userId = get().user?.id;
    if (!userId) return;
    set((s) => ({ user: s.user ? { ...s.user, ...data } : null }));
    const dbFields: any = {};
    if (data.username !== undefined) dbFields.username = data.username;
    if (data.email    !== undefined) dbFields.email    = data.email;
    if (data.avatar   !== undefined) dbFields.avatar   = data.avatar;
    if (data.bio      !== undefined) dbFields.bio      = data.bio;
    if (data.phone    !== undefined) dbFields.phone    = data.phone;
    if (Object.keys(dbFields).length > 0) {
      const { error } = await supabase.from('profiles').update(dbFields).eq('id', userId);
      if (error) console.error('updateProfile error:', error.message);
    }
  },

  updateCoins: (amount) =>
    set((s) => ({
      user: s.user
        ? { ...s.user, coins: Math.max(0, s.user.coins + amount) }
        : null,
    })),

  refreshCoins: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('coins')
      .eq('id', userId)
      .single();
    if (data) {
      set((s) => ({ user: s.user ? { ...s.user, coins: data.coins } : null }));
    }
  },

  addTransaction: async (tx) => {
    const userId = get().user?.id;
    const optimisticId = tx.id ?? Math.random().toString(36).substr(2, 9);
    const newTx: UserTransaction = {
      ...tx,
      id:   optimisticId,
      date: formatDate(),
    };
    set((s) => ({ transactions: [newTx, ...s.transactions] }));

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            id:      optimisticId,
            user_id: userId,
            type:    tx.type,
            amount:  Math.abs(tx.amount),
            status:  tx.status,
            method:  tx.method ?? null,
            title:   tx.title ?? '',
            details: tx.details ?? '',
          })
          .select()
          .single();
        if (error) {
          console.error('addTransaction error:', error.message);
        } else if (data) {
          set((s) => ({
            transactions: s.transactions.map((t) =>
              t.id === optimisticId ? rowToTransaction(data) : t
            ),
          }));
        }
      } catch (e) {
        console.error('addTransaction error:', e);
      }
    }
  },

  updateTransaction: async (id, updates) => {
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    const dbFields: any = {};
    if (updates.status  !== undefined) dbFields.status  = updates.status;
    if (updates.details !== undefined) dbFields.details = updates.details;
    if (Object.keys(dbFields).length > 0) {
      await supabase.from('transactions').update(dbFields).eq('id', id);
    }
  },

  addGameProfile: async (profile) => {
    const userId = get().user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('game_profiles')
      .upsert({
        user_id:   userId,
        game_name: profile.gameName,
        ign:       profile.ign,
        uid:       profile.uid,
      }, { onConflict: 'user_id,game_name' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const gp: GameProfile = { id: data.id, gameName: data.game_name, ign: data.ign, uid: data.uid };
    set((s) => {
      const exists = s.gameProfiles.some((p) => p.gameName === gp.gameName);
      if (exists) {
        return { gameProfiles: s.gameProfiles.map((p) => p.gameName === gp.gameName ? gp : p) };
      }
      return { gameProfiles: [...s.gameProfiles, gp] };
    });
  },

  updateGameProfile: async (id, profile) => {
    const dbFields: any = {};
    if (profile.ign      !== undefined) dbFields.ign       = profile.ign;
    if (profile.uid      !== undefined) dbFields.uid       = profile.uid;
    if (profile.gameName !== undefined) dbFields.game_name = profile.gameName;
    const { error } = await supabase.from('game_profiles').update(dbFields).eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({
      gameProfiles: s.gameProfiles.map((p) => (p.id === id ? { ...p, ...profile } : p)),
    }));
  },

  removeGameProfile: async (id) => {
    const { error } = await supabase.from('game_profiles').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({ gameProfiles: s.gameProfiles.filter((p) => p.id !== id) }));
  },

  joinMatch: async (matchId: string) => {
    const { user } = get();
    if (!user) return;
    const { error } = await supabase.from('match_participants').insert({
      match_id: matchId,
      user_id:  user.id,
      username: user.username,
    });
    if (error && error.code !== '23505') {
      throw new Error(error.message);
    }
    set((s) => ({
      joinedMatchIds: s.joinedMatchIds.includes(matchId)
        ? s.joinedMatchIds
        : [...s.joinedMatchIds, matchId],
    }));
  },

  leaveMatch: async (matchId: string) => {
    const userId = get().user?.id;
    if (!userId) return;
    await supabase
      .from('match_participants')
      .delete()
      .eq('match_id', matchId)
      .eq('user_id', userId);
    set((s) => ({
      joinedMatchIds: s.joinedMatchIds.filter((id) => id !== matchId),
    }));
  },

  createTeam: async (name, tag) => {
    const { user } = get();
    if (!user) return;
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({ name, tag, leader_id: user.id })
      .select()
      .single();
    if (teamError) throw new Error(teamError.message);

    await supabase.from('team_members').insert({
      team_id: teamData.id,
      user_id: user.id,
      role:    'Leader',
      rank:    user.rank,
    });

    set({
      team: {
        id:   teamData.id,
        name: teamData.name,
        tag:  teamData.tag,
        members: [{ id: user.id, username: user.username, role: 'Leader', rank: user.rank }],
      },
    });
  },

  joinTeam: async (teamId, teamName, teamTag) => {
    const { user } = get();
    if (!user) return;
    await supabase.from('team_members').upsert({
      team_id: teamId,
      user_id: user.id,
      role:    'Member',
      rank:    user.rank,
    }, { onConflict: 'team_id,user_id' });
    set({
      team: {
        id:      teamId,
        name:    teamName,
        tag:     teamTag,
        members: [{ id: user.id, username: user.username, role: 'Member', rank: user.rank }],
      },
    });
  },

  leaveTeam: async () => {
    const { user, team } = get();
    if (!user || !team) return;
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id)
      .eq('user_id', user.id);
    set({ team: null });
  },
}));
