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

/**
 * Parses both query string (?key=val) and URL fragment (#key=val) params.
 * Supabase puts tokens in the fragment for implicit flow, so we must read both.
 */
function parseDeepLinkParams(url: string): Record<string, string> {
  const result: Record<string, string> = {};

  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');

  // Parse query string
  if (qIndex !== -1) {
    const qEnd = hIndex !== -1 && hIndex > qIndex ? hIndex : url.length;
    url.slice(qIndex + 1, qEnd).split('&').forEach(part => {
      const eq = part.indexOf('=');
      if (eq !== -1) result[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1));
    });
  }

  // Parse URL fragment — Supabase implicit flow puts access_token/refresh_token here
  if (hIndex !== -1) {
    url.slice(hIndex + 1).split('&').forEach(part => {
      const eq = part.indexOf('=');
      if (eq !== -1) {
        const k = decodeURIComponent(part.slice(0, eq));
        if (!result[k]) result[k] = decodeURIComponent(part.slice(eq + 1));
      }
    });
  }

  return result;
}

async function handleAuthUrl(url: string) {
  try {
    const params = parseDeepLinkParams(url);
    let session: Session | null = null;

    // Try PKCE code exchange first (covers signup verification, magic link, recovery)
    if (params.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      if (!error && data.session) session = data.session;
    }

    // Fall back to implicit flow tokens in URL fragment
    if (!session && params.access_token && params.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (!error && data.session) session = data.session;
    }

    // Navigate based on profile completeness:
    // - No username yet  → KYC page (user sets up profile + password)
    // - Username exists  → straight to the app
    if (session?.user) {
      await navigateAfterAuth(session.user.id);
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
        if (authUser) saveFcmTokenForUser(authUser).catch(() => {});
      }

      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/email-verify');
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      if (initialSession?.user) saveFcmTokenForUser(initialSession.user).catch(() => {});
    });

    // Handle deep links when the app is already open
    const deepLinkSub = Linking.addEventListener('url', (event) => {
      handleAuthUrl(event.url);
    });

    // Handle deep link that cold-started the app
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });

    return () => {
      subscription.unsubscribe();
      deepLinkSub.remove();
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
