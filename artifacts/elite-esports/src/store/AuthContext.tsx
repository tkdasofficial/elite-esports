import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { saveFcmTokenForUser, removeFcmTokenForUser } from '@/services/NotificationService';
import { deviceFingerprint } from '@/services/DeviceFingerprint';

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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const authUser = newSession?.user;
        if (authUser) {
          saveFcmTokenForUser(authUser).catch(() => {});
          if (event === 'SIGNED_IN') {
            deviceFingerprint.logEvent('sign_in', authUser.email).catch(() => {});
          }
        }
      }

      if (event === 'SIGNED_OUT') {
        deviceFingerprint.logEvent('sign_out').catch(() => {});
        router.replace('/(auth)/email-verify');
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      if (initialSession?.user) saveFcmTokenForUser(initialSession.user).catch(() => {});
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) await removeFcmTokenForUser(userId).catch(() => {});
    await supabase.auth.signOut();
  }, [session?.user?.id]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signOut,
  }), [session, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
