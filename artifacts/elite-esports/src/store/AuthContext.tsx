import React, {
  createContext, useContext, useEffect, useState,
  useCallback, useMemo, useRef, ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { initFCMForUser, deregisterFCMToken } from '@/services/FCMService';
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

  // Track the FCM cleanup function so we can call it on sign-out
  const fcmCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const authUser = newSession?.user;
          if (authUser) {
            // Register FCM token and subscribe to refresh events
            fcmCleanupRef.current?.(); // clean up previous subscription
            const cleanup = await initFCMForUser(authUser).catch(() => () => {});
            fcmCleanupRef.current = cleanup;

            if (event === 'SIGNED_IN') {
              deviceFingerprint.logEvent('sign_in', authUser.email).catch(() => {});
            }
          }
        }

        if (event === 'SIGNED_OUT') {
          deviceFingerprint.logEvent('sign_out').catch(() => {});
          router.replace('/(auth)/email-verify');
        }
      },
    );

    // Restore existing session on app launch
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);

      if (initialSession?.user) {
        // Register / refresh FCM token for the restored session
        const cleanup = await initFCMForUser(initialSession.user).catch(() => () => {});
        fcmCleanupRef.current = cleanup;
      }
    });

    return () => {
      subscription.unsubscribe();
      fcmCleanupRef.current?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    const userId = session?.user?.id;
    // Stop token refresh listener before deregistering
    fcmCleanupRef.current?.();
    fcmCleanupRef.current = null;
    if (userId) await deregisterFCMToken(userId).catch(() => {});
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
