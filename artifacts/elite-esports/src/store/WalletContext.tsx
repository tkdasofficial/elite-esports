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
}

const WalletContext = createContext<WalletContextValue | null>(null);

async function fetchSupabaseBalance(userId: string): Promise<number> {
  const { data: walletRow } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletRow?.balance != null) return Number(walletRow.balance);

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .maybeSingle();

  if (profileRow?.balance != null) return Number(profileRow.balance);

  return 0;
}

function sevenDaysAgo(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function labelFromRef(referenceId: string | null, type: string): string {
  if (!referenceId) return type === 'credit' ? 'Deposit' : 'Withdraw';
  if (referenceId.startsWith('result:'))     return 'Winning Prize';
  if (referenceId.startsWith('autopay:'))    return 'Auto Prize';
  if (referenceId.startsWith('entry:'))      return 'Entry Fee';
  if (referenceId.startsWith('refund:'))     return 'Refund';
  if (referenceId.startsWith('referral:'))   return 'Referral Bonus';
  if (referenceId.startsWith('ad_bonus:'))   return 'Ad Bonus';
  if (referenceId.startsWith('sponsored:'))  return 'Sponsored Reward';
  if (referenceId.startsWith('deposit:'))    return 'Deposit';
  if (referenceId.startsWith('withdraw:'))   return 'Withdraw';
  return type === 'credit' ? 'Deposit' : 'Entry Fee';
}

function descFromRef(referenceId: string | null, type: string): string {
  if (!referenceId) return type === 'credit' ? 'Wallet deposit' : 'Wallet debit';
  if (referenceId.startsWith('result:'))     return 'Match winning prize credited';
  if (referenceId.startsWith('autopay:'))    return 'Auto prize distributed for match result';
  if (referenceId.startsWith('entry:'))      return 'Match entry fee paid';
  if (referenceId.startsWith('refund:'))     return 'Entry fee refunded';
  if (referenceId.startsWith('referral:'))   return 'Referral reward earned';
  if (referenceId.startsWith('ad_bonus:'))   return 'Ad reward bonus';
  if (referenceId.startsWith('sponsored:'))  return 'Sponsorship reward approved';
  if (referenceId.startsWith('deposit:'))    return 'Wallet deposit';
  if (referenceId.startsWith('withdraw:'))   return 'Withdrawal request';
  return referenceId;
}

async function fetchSupabaseTransactions(userId: string): Promise<WalletTransaction[]> {
  const cutoff = sevenDaysAgo();

  const [paymentsRes, withdrawalsRes, txnsRes, walletTxnsRes] = await Promise.allSettled([
    supabase
      .from('payments')
      .select('id, amount, utr, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false }),

    supabase
      .from('withdrawals')
      .select('id, amount, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false }),

    supabase
      .from('transactions')
      .select('id, type, amount, utr, status, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false }),

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
    if (!seen.has(tx.id)) { seen.add(tx.id); result.push(tx); }
  };

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

  result.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return result;
}

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

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      return;
    }
    loadWallet();
  }, [user, loadWallet]);

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
