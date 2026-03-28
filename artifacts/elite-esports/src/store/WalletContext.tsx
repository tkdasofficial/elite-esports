import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  created_at: string;
}

interface WalletContextValue {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [walletRes, paymentsRes, withdrawalsRes, txnsRes] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
      supabase.from('payments').select('id, amount, utr, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('id, amount, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('wallet_transactions').select('id, type, amount, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    if (walletRes.data) setBalance(walletRes.data.balance ?? 0);

    const deposits: Transaction[] = (paymentsRes.data ?? []).map(p => ({
      id: p.id,
      type: 'credit' as const,
      amount: p.amount,
      status: (p.status as any) ?? 'pending',
      description: p.utr ? `Deposit — UTR: ${p.utr}` : 'Deposit via UPI',
      created_at: p.created_at,
    }));

    const withdrawals: Transaction[] = (withdrawalsRes.data ?? []).map(w => ({
      id: w.id,
      type: 'debit' as const,
      amount: w.amount,
      status: (w.status as any) ?? 'pending',
      description: 'Withdrawal',
      created_at: w.created_at,
    }));

    const walletTxns: Transaction[] = (txnsRes.data ?? []).map(t => ({
      id: t.id,
      type: t.type === 'credit' ? 'credit' : 'debit',
      amount: t.amount,
      status: (t.status as any) ?? 'approved',
      description: t.type === 'credit' ? 'Match prize' : 'Match entry fee',
      created_at: t.created_at,
    }));

    const all = [...deposits, ...withdrawals, ...walletTxns]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setTransactions(all);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      return;
    }
    fetchWallet();
    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wallets',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchWallet())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchWallet]);

  const value = useMemo(() => ({
    balance,
    transactions,
    loading,
    refreshWallet: fetchWallet,
  }), [balance, transactions, loading, fetchWallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
