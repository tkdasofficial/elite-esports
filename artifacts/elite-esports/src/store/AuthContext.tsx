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

function parseDeepLinkParams(url: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Parse query string (?key=value)
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');
  if (qIndex !== -1) {
    const qEnd = hIndex !== -1 && hIndex > qIndex ? hIndex : url.length;
    const qs = url.slice(qIndex + 1, qEnd);
    qs.split('&').forEach(part => {
      const eq = part.indexOf('=');
      if (eq !== -1) {
        const k = decodeURIComponent(part.slice(0, eq));
        const v = decodeURIComponent(part.slice(eq + 1));
        result[k] = v;
      }
    });
  }

  // Parse URL fragment (#key=value) — Supabase implicit flow puts tokens here
  if (hIndex !== -1) {
    const fragment = url.slice(hIndex + 1);
    fragment.split('&').forEach(part => {
      const eq = part.indexOf('=');
      if (eq !== -1) {
        const k = decodeURIComponent(part.slice(0, eq));
        const v = decodeURIComponent(part.slice(eq + 1));
        if (!result[k]) result[k] = v; // query params take precedence
      }
    });
  }

  return result;
}

async function handleAuthUrl(url: string) {
  try {
    const params = parseDeepLinkParams(url);

    /* ── Password reset / recovery ── */
    if (params.type === 'recovery') {
      let session: Session | null = null;

      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);
        if (!error && data.session) session = data.session;
      }

      if (!session && params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (!error && data.session) session = data.session;
      }

      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data?.username) {
          router.replace('/(auth)/set-password');
        } else {
          router.replace('/(auth)/kyc');
        }
      } else {
        router.replace('/(auth)/email-verify');
      }
      return;
    }

    /* ── PKCE code exchange (email verification / magic link) ── */
    if (params.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      if (!error && data.session?.user) {
        await navigateAfterAuth(data.session.user.id);
      }
      return;
    }

    /* ── Legacy implicit flow — tokens in URL fragment ── */
    if (params.access_token && params.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
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
