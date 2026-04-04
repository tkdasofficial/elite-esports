import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { deepLinkService, type AuthUrlParams } from '@/services/DeepLinkService';
import { deviceFingerprint } from '@/services/DeviceFingerprint';
import { navigateAfterAuth } from '@/utils/authHelpers';

type ScreenState =
  | { phase: 'loading'; message: string }
  | { phase: 'error'; title: string; detail: string; action: 'retry' | 'signin' };

function isRecovery(params: AuthUrlParams): boolean {
  const t = (params.type ?? '').toLowerCase();
  return t === 'recovery' || t === 'password_recovery';
}

export default function AuthCallback() {
  const routerParams = useLocalSearchParams<{
    code?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();

  const [state, setState] = useState<ScreenState>({
    phase: 'loading',
    message: 'Verifying your link…',
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const buffered = deepLinkService.consumeBufferedUrl();

      let params: AuthUrlParams = { ...routerParams };

      if (buffered) {
        const parsed = deepLinkService.parseAuthParams(buffered);
        params = { ...parsed, ...params };
      }

      await deviceFingerprint.logEvent('deep_link_received', undefined,
        `type=${params.type ?? 'none'} hasCode=${!!params.code}`);

      if (params.error) {
        const msg = params.error_description ?? params.error ?? 'Unknown error';
        await deviceFingerprint.logEvent('callback_error', undefined, msg);
        if (!cancelled) {
          setState({
            phase: 'error',
            title: 'Link Error',
            detail: msg,
            action: 'signin',
          });
        }
        return;
      }

      if (params.code) {
        await handlePKCE(params.code, params, () => cancelled);
        return;
      }

      if (params.access_token && params.refresh_token) {
        await handleImplicit(params, () => cancelled);
        return;
      }

      if (!cancelled) {
        await deviceFingerprint.logEvent('callback_error', undefined, 'no_code_in_url');
        setState({
          phase: 'error',
          title: 'Link Not Found',
          detail:
            'The verification link appears to be incomplete or was already used. ' +
            'Request a new one from the sign-in screen.',
          action: 'signin',
        });
      }
    }

    async function handlePKCE(
      code: string,
      params: AuthUrlParams,
      isCancelled: () => boolean,
    ) {
      if (!isCancelled()) {
        setState({ phase: 'loading', message: 'Exchanging secure token…' });
      }

      let detectedEvent: string | null = null;
      const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
        if (!detectedEvent) detectedEvent = event;
      });

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        subscription.unsubscribe();

        if (isCancelled()) return;

        if (error || !data.session) {
          await deviceFingerprint.logEvent('callback_error', undefined,
            error?.message ?? 'exchange_failed');
          setState({
            phase: 'error',
            title: 'Link Expired',
            detail:
              'This link has expired or was already used. ' +
              'Please request a fresh link from the sign-in screen.',
            action: 'signin',
          });
          return;
        }

        const recovery = isRecovery(params) || detectedEvent === 'PASSWORD_RECOVERY';

        if (recovery) {
          await deviceFingerprint.logEvent('password_reset_complete',
            data.session.user.email);
          if (!isCancelled()) {
            setState({ phase: 'loading', message: 'Opening password reset…' });
            router.replace('/(auth)/reset-password');
          }
        } else {
          await deviceFingerprint.logEvent('email_verify',
            data.session.user.email);
          if (!isCancelled()) {
            setState({ phase: 'loading', message: 'Setting up your account…' });
            await navigateAfterAuth(data.session.user.id);
          }
        }
      } catch (err: any) {
        subscription.unsubscribe();
        if (!isCancelled()) {
          await deviceFingerprint.logEvent('callback_error', undefined,
            err?.message ?? 'pkce_exception');
          setState({
            phase: 'error',
            title: 'Something Went Wrong',
            detail: 'Could not process your link. Please try again.',
            action: 'retry',
          });
        }
      }
    }

    async function handleImplicit(
      params: AuthUrlParams,
      isCancelled: () => boolean,
    ) {
      if (!isCancelled()) {
        setState({ phase: 'loading', message: 'Restoring session…' });
      }

      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token!,
          refresh_token: params.refresh_token!,
        });

        if (isCancelled()) return;

        if (error || !data.session) {
          setState({
            phase: 'error',
            title: 'Session Invalid',
            detail: 'Your session token is invalid. Please sign in again.',
            action: 'signin',
          });
          return;
        }

        const recovery = isRecovery(params);

        if (recovery) {
          await deviceFingerprint.logEvent('password_reset_complete',
            data.session.user.email);
          router.replace('/(auth)/reset-password');
        } else {
          await deviceFingerprint.logEvent('email_verify',
            data.session.user.email);
          await navigateAfterAuth(data.session.user.id);
        }
      } catch (err: any) {
        if (!isCancelled()) {
          setState({
            phase: 'error',
            title: 'Something Went Wrong',
            detail: 'Could not restore your session. Please try again.',
            action: 'retry',
          });
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  if (state.phase === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FE4C11" />
        <Text style={styles.loadingText}>{state.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.errorIcon}>
        <Ionicons
          name={state.action === 'retry' ? 'warning-outline' : 'link-outline'}
          size={48}
          color="#FE4C11"
        />
      </View>
      <Text style={styles.errorTitle}>{state.title}</Text>
      <Text style={styles.errorDetail}>{state.detail}</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(auth)/email-verify')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>
          {state.action === 'retry' ? 'Try Again' : 'Back to Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 20,
    color: '#9CA3AF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(254,76,17,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    color: '#F9FAFB',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorDetail: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    backgroundColor: '#FE4C11',
    borderRadius: 30,
    height: 52,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
