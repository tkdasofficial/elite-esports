import React, {
  createContext, useContext, useState, useEffect,
  useMemo, useCallback, ReactNode,
} from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import type { WalletTransaction } from '@/services/walletApi';

export type { WalletTransaction as Transaction };

interface WalletContextValue {
  balance:       number;
  transactions:  WalletTransaction[];
  loading:       boolean;
  refreshWallet: () => Promise<void>;
  creditBalance: (amount: number) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/* ─── helpers ──────────────────────────────────────────────────────────── */

async function fetchSupabaseBalance(userId: string): Promise<number> {
  // 1. Try the wallets table (kept in sync by DB triggers)
  const { data: walletRow } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletRow?.balance != null) return Number(walletRow.balance);

  // 2. Fall back to profiles.balance
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .maybeSingle();

  if (profileRow?.balance != null) return Number(profileRow.balance);

  return 0;
}

/** ISO timestamp exactly 7 days ago */
function sevenDaysAgo(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function labelFromRef(referenceId: string | null, type: string): string {
  if (!referenceId) return type === 'credit' ? 'Credit' : 'Debit';
  if (referenceId.startsWith('result:'))  return 'Prize Won';
  if (referenceId.startsWith('entry:'))   return 'Entry Fee';
  if (referenceId.startsWith('refund:'))  return 'Refund';
  return type === 'credit' ? 'Credit' : 'Entry Fee';
}

function descFromRef(referenceId: string | null, type: string): string {
  if (!referenceId) return type === 'credit' ? 'Wallet credit' : 'Wallet debit';
  if (referenceId.startsWith('result:'))  return 'Match prize credited';
  if (referenceId.startsWith('entry:'))   return 'Match entry fee';
  if (referenceId.startsWith('refund:'))  return 'Match refund';
  return referenceId;
}

async function fetchSupabaseTransactions(userId: string): Promise<WalletTransaction[]> {
  const cutoff = sevenDaysAgo();

  const [paymentsRes, withdrawalsRes, txnsRes, walletTxnsRes] = await Promise.allSettled([
    // Deposits submitted by user
    supabase
      .from('payments')
      .select('id, amount, utr, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false }),

    // Withdrawal requests
    supabase
      .from('withdrawals')
      .select('id, amount, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false }),

    // Legacy transactions table (from 001_games.sql schema)
    supabase
      .from('transactions')
      .select('id, type, amount, utr, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false }),

    // Internal ledger: entry fees, prizes, bonuses
    // NOTE: wallet_transactions has no 'description' column — use reference_id instead
    supabase
      .from('wallet_transactions')
      .select('id, type, amount, status, reference_id, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false }),
  ]);

  const seen = new Set<string>();
  const result: WalletTransaction[] = [];

  const push = (tx: WalletTransaction) => {
    if (!seen.has(tx.id)) {
      seen.add(tx.id);
      result.push(tx);
    }
  };

  // ── Deposits ──
  if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data) {
    for (const p of paymentsRes.value.data) {
      push({
        id:          p.id,
        type:        'credit',
        amount:      Number(p.amount),
        status:      (p.status ?? 'pending') as WalletTransaction['status'],
        description: p.utr ? `UTR: ${p.utr}` : 'Deposit via UPI',
        label:       'Deposit',
        created_at:  p.created_at,
      });
    }
  }

  // ── Withdrawals ──
  if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.data) {
    for (const w of withdrawalsRes.value.data) {
      push({
        id:          w.id,
        type:        'debit',
        amount:      Number(w.amount),
        status:      (w.status ?? 'pending') as WalletTransaction['status'],
        description: 'Withdrawal request',
        label:       'Withdrawal',
        created_at:  w.created_at,
      });
    }
  }

  // ── Legacy transactions table ──
  if (txnsRes.status === 'fulfilled' && txnsRes.value.data) {
    for (const t of txnsRes.value.data) {
      push({
        id:          t.id,
        type:        t.type === 'credit' ? 'credit' : 'debit',
        amount:      Number(t.amount),
        status:      (t.status ?? 'pending') as WalletTransaction['status'],
        description: t.utr ? `UTR: ${t.utr}` : (t.type === 'credit' ? 'Deposit' : 'Withdrawal'),
        label:       t.type === 'credit' ? 'Deposit' : 'Withdrawal',
        created_at:  t.created_at,
      });
    }
  }

  // ── Wallet transactions (prizes, entry fees, bonuses) ──
  if (walletTxnsRes.status === 'fulfilled' && walletTxnsRes.value.data) {
    for (const t of walletTxnsRes.value.data) {
      const ref = t.reference_id as string | null;
      push({
        id:          t.id,
        type:        t.type === 'credit' ? 'credit' : 'debit',
        amount:      Number(t.amount),
        status:      'approved' as WalletTransaction['status'],
        description: descFromRef(ref, t.type),
        label:       labelFromRef(ref, t.type),
        created_at:  t.created_at,
      });
    }
  }

  // Sort newest first across all sources
  result.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return result;
}

/* ─── provider ─────────────────────────────────────────────────────────── */

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance,      setBalance]      = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading,      setLoading]      = useState(false);

  const loadWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [balanceResult, txnsResult] = await Promise.allSettled([
        fetchSupabaseBalance(user.id),
        fetchSupabaseTransactions(user.id),
      ]);
      setBalance(balanceResult.status === 'fulfilled' ? balanceResult.value : 0);
      setTransactions(txnsResult.status === 'fulfilled' ? txnsResult.value : []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /** Immediately credit the local balance — used after prize claims so the
   *  UI updates instantly without waiting for the DB trigger to propagate. */
  const creditBalance = useCallback((amount: number) => {
    setBalance(prev => Math.max(0, prev + amount));
  }, []);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      return;
    }
    loadWallet();
  }, [user, loadWallet]);

  // Realtime: re-fetch whenever admin approves/rejects or a new row is inserted
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`wallet-unified-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wallets',
        filter: `user_id=eq.${user.id}`,
      }, loadWallet)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'payments',
        filter: `user_id=eq.${user.id}`,
      }, loadWallet)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'withdrawals',
        filter: `user_id=eq.${user.id}`,
      }, loadWallet)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wallet_transactions',
        filter: `user_id=eq.${user.id}`,
      }, loadWallet)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadWallet]);

  const value = useMemo(() => ({
    balance,
    transactions,
    loading,
    refreshWallet: loadWallet,
    creditBalance,
  }), [balance, transactions, loading, loadWallet, creditBalance]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
