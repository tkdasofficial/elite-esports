import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
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
  const userRef = useRef(user);
  userRef.current = user;

  const fetchWallet = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    setLoading(true);
    const [{ data: wallet }, { data: txns }] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', currentUser.id).single(),
      supabase.from('transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
    ]);
    if (wallet) setBalance(wallet.balance);
    if (txns) setTransactions(txns);
    setLoading(false);
  }, []);

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
    balance, transactions, loading,
    refreshWallet: fetchWallet,
  }), [balance, transactions, loading, fetchWallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
