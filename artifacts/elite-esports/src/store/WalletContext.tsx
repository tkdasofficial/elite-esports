import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useAuth } from '@/store/AuthContext';
import { fetchWallet, type WalletTransaction } from '@/services/walletApi';

export type { WalletTransaction as Transaction };

interface WalletContextValue {
  balance: number;
  transactions: WalletTransaction[];
  loading: boolean;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchWallet();
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch {
      // Non-critical — silently ignore, keep stale data
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

  const value = useMemo(() => ({
    balance,
    transactions,
    loading,
    refreshWallet: loadWallet,
  }), [balance, transactions, loading, loadWallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
