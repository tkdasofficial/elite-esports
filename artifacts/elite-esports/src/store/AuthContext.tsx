import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { saveFcmTokenForUser, removeFcmTokenForUser } from '@/services/NotificationService';
import { navigateAfterAuth } from '@/utils/authHelpers';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function handleAuthUrl(url: string) {
  try {
    const parsed = Linking.parse(url);
    const params = parsed.queryParams ?? {};

    /* Password reset recovery */
    if (params.type === 'recovery') {
      router.replace('/(auth)/email-verify');
      return;
    }

    /*
     * PKCE code exchange — handles email verification and magic link deep links.
     * OAuth codes from WebBrowser.openAuthSessionAsync are handled by the OAuth
     * caller directly and are resolved before they ever reach Linking, so there
     * is no race condition here.
     */
    if (params.code && typeof params.code === 'string') {
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      if (!error && data.session?.user) {
        await navigateAfterAuth(data.session.user.id);
      }
      return;
    }

    /* Legacy implicit flow — tokens in URL fragment */
    if (params.access_token && params.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token as string,
        refresh_token: params.refresh_token as string,
      });
      if (!error && data.session?.user) {
        await navigateAfterAuth(data.session.user.id);
      }
    }
  } catch {
  }
}

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
        }
      }

      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/email-verify');
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      const authUser = initialSession?.user;
      if (authUser) {
        saveFcmTokenForUser(authUser).catch(() => {});
      }
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });

    const deepLinkSub = Linking.addEventListener('url', (event) => {
      handleAuthUrl(event.url);
    });

    return () => {
      subscription.unsubscribe();
      deepLinkSub.remove();
    };
  }, []);

  const signOut = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) {
      await removeFcmTokenForUser(userId).catch(() => {});
    }
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
