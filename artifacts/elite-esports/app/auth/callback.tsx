import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { navigateAfterAuth } from '@/utils/authHelpers';

function parseUrlParams(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');
  if (qIndex !== -1) {
    const qEnd = hIndex !== -1 && hIndex > qIndex ? hIndex : url.length;
    url.slice(qIndex + 1, qEnd).split('&').forEach(part => {
      const eq = part.indexOf('=');
      if (eq !== -1) result[decodeURIComponent(part.slice(0, eq))] = decodeURIComponent(part.slice(eq + 1));
    });
  }
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

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;

        if (rawCode) {
          await handlePKCE(rawCode, cancelled, (v) => { cancelled = v; });
          return;
        }

        const initialUrl = await Linking.getInitialURL();
        if (!initialUrl) {
          if (!cancelled) router.replace('/(auth)/email-verify');
          return;
        }

        const parsed = parseUrlParams(initialUrl);

        if (parsed.code) {
          await handlePKCE(parsed.code, cancelled, (v) => { cancelled = v; });
          return;
        }

        if (parsed.access_token && parsed.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          });
          if (cancelled) return;
          if (error || !data.session) {
            router.replace('/(auth)/email-verify');
            return;
          }
          if (parsed.type === 'recovery') {
            router.replace('/(auth)/reset-password');
          } else {
            await navigateAfterAuth(data.session.user.id);
          }
          return;
        }

        if (!cancelled) router.replace('/(auth)/email-verify');
      } catch {
        if (!cancelled) router.replace('/(auth)/email-verify');
      }
    }

    async function handlePKCE(
      code: string,
      _cancelled: boolean,
      setC: (v: boolean) => void,
    ) {
      let eventType: string | null = null;

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (!eventType) eventType = event;
      });

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        subscription.unsubscribe();

        if (_cancelled) return;

        if (error || !data.session) {
          router.replace('/(auth)/email-verify');
          return;
        }

        if (eventType === 'PASSWORD_RECOVERY') {
          router.replace('/(auth)/reset-password');
        } else {
          await navigateAfterAuth(data.session.user.id);
        }
      } catch {
        subscription.unsubscribe();
        if (!_cancelled) router.replace('/(auth)/email-verify');
      }
    }

    run();

    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FE4C11" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
});
