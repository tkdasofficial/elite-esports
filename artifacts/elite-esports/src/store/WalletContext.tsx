import React, {
  createContext, useContext, useState, useEffect,
  useMemo, useCallback, ReactNode,
} from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { fetchWallet, type WalletTransaction } from '@/services/walletApi';

export type { WalletTransaction as Transaction };

interface WalletContextValue {
  balance:        number;
  transactions:   WalletTransaction[];
  loading:        boolean;
  refreshWallet:  () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/* ─── helpers ──────────────────────────────────────────────────────────── */

/** Try to read the balance from `wallets` table, then fall back to `profiles`. */
async function fetchSupabaseBalance(userId: string): Promise<number> {
  // Primary: dedicated wallets table (backend_setup.sql schema)
  const { data: walletRow } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletRow?.balance != null) return Number(walletRow.balance);

  // Fallback: balance stored on profiles row (001_games.sql schema)
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .maybeSingle();

  return Number(profileRow?.balance ?? 0);
}

/** Fetch all transactions from every Supabase table that may hold them. */
async function fetchSupabaseTransactions(userId: string): Promise<WalletTransaction[]> {
  const [paymentsRes, withdrawalsRes, txnsRes, walletTxnsRes] = await Promise.allSettled([
    supabase
      .from('payments')
      .select('id, amount, utr, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    supabase
      .from('withdrawals')
      .select('id, amount, upi_id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    // Legacy table name used in 001_games.sql
    supabase
      .from('transactions')
      .select('id, type, amount, utr, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    supabase
      .from('wallet_transactions')
      .select('id, type, amount, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  const result: WalletTransaction[] = [];

  // payments table
  if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data) {
    for (const p of paymentsRes.value.data) {
      result.push({
        id:          p.id,
        type:        'credit',
        amount:      Number(p.amount),
        status:      (p.status ?? 'pending') as WalletTransaction['status'],
        description: p.utr ? `Deposit — UTR: ${p.utr}` : 'Deposit via UPI',
        created_at:  p.created_at,
      });
    }
  }

  // withdrawals table
  if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.data) {
    for (const w of withdrawalsRes.value.data) {
      result.push({
        id:          w.id,
        type:        'debit',
        amount:      Number(w.amount),
        status:      (w.status ?? 'pending') as WalletTransaction['status'],
        description: w.upi_id ? `Withdrawal to ${w.upi_id}` : 'Withdrawal',
        created_at:  w.created_at,
      });
    }
  }

  // legacy transactions table
  if (txnsRes.status === 'fulfilled' && txnsRes.value.data) {
    for (const t of txnsRes.value.data) {
      result.push({
        id:          t.id,
        type:        t.type === 'credit' ? 'credit' : 'debit',
        amount:      Number(t.amount),
        status:      (t.status ?? 'pending') as WalletTransaction['status'],
        description: t.utr ? `Deposit — UTR: ${t.utr}` : (t.type === 'credit' ? 'Deposit' : 'Debit'),
        created_at:  t.created_at,
      });
    }
  }

  // wallet_transactions table (prize credits / entry fee debits)
  if (walletTxnsRes.status === 'fulfilled' && walletTxnsRes.value.data) {
    for (const t of walletTxnsRes.value.data) {
      result.push({
        id:          t.id,
        type:        t.type === 'credit' ? 'credit' : 'debit',
        amount:      Number(t.amount),
        status:      (t.status ?? 'approved') as WalletTransaction['status'],
        description: t.type === 'credit' ? 'Match prize' : 'Match entry fee',
        created_at:  t.created_at,
      });
    }
  }

  return result;
}

/** Merge Supabase + Replit API transactions, deduplicate by id, sort newest first. */
function merge(
  supabaseTxns: WalletTransaction[],
  apiTxns:      WalletTransaction[],
): WalletTransaction[] {
  const seen = new Set<string>();
  const all:  WalletTransaction[] = [];

  for (const t of [...supabaseTxns, ...apiTxns]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      all.push(t);
    }
  }

  return all.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
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
      // Run all fetches in parallel; failures are isolated
      const [sbBalance, sbTxns, apiData] = await Promise.allSettled([
        fetchSupabaseBalance(user.id),
        fetchSupabaseTransactions(user.id),
        fetchWallet(),
      ]);

      // Balance: prefer Supabase (source of truth for approved funds)
      const resolvedBalance =
        sbBalance.status === 'fulfilled' ? sbBalance.value :
        apiData.status   === 'fulfilled' ? apiData.value.balance : 0;

      setBalance(resolvedBalance);

      // Transactions: merge both sources
      const supabaseTxns = sbTxns.status   === 'fulfilled' ? sbTxns.value         : [];
      const apiTxns      = apiData.status  === 'fulfilled' ? apiData.value.transactions : [];
      setTransactions(merge(supabaseTxns, apiTxns));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      return;
    }
    loadWallet();
  }, [user, loadWallet]);

  // Realtime: re-fetch on any wallet/payment/withdrawal change in Supabase
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
  }), [balance, transactions, loading, loadWallet]);

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
