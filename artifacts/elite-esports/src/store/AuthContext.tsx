import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  adminLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        router.replace('/(auth)/options');
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session?.user?.id) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }
    setAdminLoading(true);
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.is_admin === true);
        setAdminLoading(false);
      });
  }, [session?.user?.id, loading]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    isAdmin,
    adminLoading,
    signOut,
  }), [session, loading, isAdmin, adminLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
