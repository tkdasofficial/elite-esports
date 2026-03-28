import React, { createContext, useContext, useEffect, useState, useMemo, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      initialLoadDone.current = true;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Redirect to auth when session is cleared (sign out) — but only after
      // the initial session load so we don't redirect on first app open.
      if (initialLoadDone.current && !session) {
        router.replace('/(auth)/options');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
