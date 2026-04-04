import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { navigateAfterAuth } from '@/utils/authHelpers';

/**
 * The redirect URL sent to Supabase.
 * Supabase will redirect back to elite-esports:///auth/callback?code=XXXXX
 * Expo Router routes that directly to app/auth/callback.tsx — no race with index.tsx.
 */
function getRedirectUrl(): string {
  return Linking.createURL('/auth/callback');
}

type Step = 'email' | 'login' | 'verify' | 'reset-sent';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [checking, setChecking]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  /* Listen for auth state when waiting for email verification */
  useEffect(() => {
    if (step !== 'verify') return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await navigateAfterAuth(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [step]);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  /* ── Step 1: Check email and route to login or signup ── */
  const handleEmailContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setChecking(true);

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: trimmed,
        password: `__probe_${Math.random().toString(36).slice(2)}__`,
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (signUpErr) throw signUpErr;

      const identities = data?.user?.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        /* Email already registered → go to login */
        setStep('login');
      } else {
        /* New user — confirmation email already sent by probe signUp */
        startCooldown();
        setStep('verify');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  /* ── Step 2a (login): Sign in with password ── */
  const handleSignIn = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!err && data.user) {
        await navigateAfterAuth(data.user.id);
        return;
      }

      const msg = (err?.message ?? '').toLowerCase();
      if (msg.includes('email not confirmed')) {
        startCooldown();
        setStep('verify');
        return;
      }
      setError('Incorrect password. Please try again.');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot password ── */
  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: getRedirectUrl() },
      );
      if (resetErr) {
        setError(resetErr.message ?? 'Could not send reset email. Please try again.');
        return;
      }
      setStep('reset-sent');
    } catch (e: any) {
      setError(e?.message ?? 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Resend verification email ── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (resendErr) {
        setError(resendErr.message ?? 'Could not resend email. Please try again.');
        return;
      }
      startCooldown();
    } catch (e: any) {
      setError(e?.message ?? 'Could not resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'login') { setStep('email'); setPassword(''); }
    else if (step === 'verify') { setStep('email'); setPassword(''); }
    else if (step === 'reset-sent') { setStep('login'); }
  };

  /* ── Step meta ── */
  const meta: Record<Step, {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
  }> = {
    email: {
      icon: 'mail-outline',
      title: 'Get Started',
      subtitle: 'Enter your email to sign in or create an account',
    },
    login: {
      icon: 'lock-closed-outline',
      title: 'Welcome Back',
      subtitle: 'Enter your password to continue',
    },
    verify: {
      icon: 'mail-open-outline',
      title: 'Check Your Email',
      subtitle: `We've sent a verification link to`,
    },
    'reset-sent': {
      icon: 'checkmark-circle-outline',
      title: 'Reset Link Sent',
      subtitle: `We've emailed a password reset link to`,
    },
  };

  const { icon, title, subtitle } = meta[step];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      {step !== 'email' && (
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={goBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingBottom: insets.bottom + 48,
              paddingTop: step !== 'email' ? 56 : 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step icon ── */}
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={30} color={colors.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>

          {/* Subtitle: plain for email/login, shows email for verify/reset */}
          {(step === 'verify' || step === 'reset-sent') ? (
            <Text style={styles.subtitle}>
              {subtitle}{'\n'}
              <Text style={[styles.subtitle, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                {email.trim().toLowerCase()}
              </Text>
            </Text>
          ) : (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}

          {/* ── Email step ── */}
          {step === 'email' && (
            <>
              <View style={styles.fieldWrap}>
                <AuthInput
                  label="Email Address"
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  placeholder="you@example.com"
                  iconName="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onSubmitEditing={handleEmailContinue}
                  returnKeyType="go"
                />
              </View>

              {!!error && <ErrorRow text={error} colors={colors} styles={styles} />}

              <TouchableOpacity
                style={[styles.btn, (!email.trim() || checking) && styles.btnDisabled]}
                onPress={handleEmailContinue}
                disabled={!email.trim() || checking}
                activeOpacity={0.85}
              >
                {checking ? (
                  <View style={styles.row}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.btnText}>Checking…</Text>
                  </View>
                ) : (
                  <Text style={styles.btnText}>Continue</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── Login step ── */}
          {step === 'login' && (
            <>
              <TouchableOpacity
                style={styles.emailPill}
                onPress={() => { setStep('email'); setPassword(''); setError(''); }}
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={15} color={colors.text.muted} />
                <Text style={styles.emailPillText} numberOfLines={1}>{email}</Text>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>

              <View style={styles.fieldWrap}>
                <AuthInput
                  label="Password"
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  placeholder="Your password"
                  iconName="lock-closed-outline"
                  secureTextEntry
                  autoComplete="current-password"
                  onSubmitEditing={handleSignIn}
                  returnKeyType="go"
                />
              </View>

              {!!error && <ErrorRow text={error} colors={colors} styles={styles} />}

              <TouchableOpacity
                style={[styles.btn, (!password || loading) && styles.btnDisabled]}
                onPress={handleSignIn}
                disabled={!password || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Sign In</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={handleForgotPassword}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Verify step ── */}
          {step === 'verify' && (
            <>
              <View style={styles.verifyBox}>
                <Text style={styles.verifyHint}>
                  Tap the link in the email to verify your account.{'\n'}
                  This screen will update automatically once verified.
                </Text>
              </View>

              {!!error && <ErrorRow text={error} colors={colors} styles={styles} />}

              <TouchableOpacity
                style={[styles.btn, (resendCooldown > 0 || loading) && styles.btnDisabled]}
                onPress={handleResend}
                disabled={resendCooldown > 0 || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
                    </Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.altLink}
                onPress={() => { setStep('email'); setPassword(''); setError(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.altLinkText}>Use a different email</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Reset sent step ── */}
          {step === 'reset-sent' && (
            <>
              <View style={styles.verifyBox}>
                <Text style={styles.verifyHint}>
                  Follow the link in the email to set a new password,{'\n'}
                  then come back and sign in.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => { setStep('email'); setPassword(''); setError(''); }}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Back to Get Started</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ErrorRow({ text, colors, styles }: { text: string; colors: AppColors; styles: any }) {
  return (
    <View style={styles.errorWrap}>
      <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    backBtn: {
      position: 'absolute', left: 16, zIndex: 20,
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center',
    },
    scroll: {
      flexGrow: 1, justifyContent: 'center',
      paddingHorizontal: 24,
    },
    iconWrap: {
      alignSelf: 'center', width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5, borderColor: colors.primary + '35',
      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    title: {
      fontSize: 26, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, textAlign: 'center', marginBottom: 10,
    },
    subtitle: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, textAlign: 'center',
      marginBottom: 32, lineHeight: 22, paddingHorizontal: 8,
    },
    emailPill: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 26, borderWidth: 1, borderColor: colors.border.default,
      paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, gap: 8,
    },
    emailPillText: {
      flex: 1, color: colors.text.secondary,
      fontSize: 13, fontFamily: 'Inter_400Regular',
    },
    changeText: { color: colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    fieldWrap: { marginBottom: 10 },
    errorWrap: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 6, marginBottom: 14, paddingHorizontal: 4,
    },
    errorText: {
      color: colors.status.error, fontSize: 13,
      fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18,
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: 30, height: 54,
      alignItems: 'center', justifyContent: 'center', marginTop: 6,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    forgotBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 2 },
    forgotText: { color: colors.primary, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    verifyBox: {
      backgroundColor: colors.background.elevated,
      borderRadius: 16, paddingHorizontal: 20, paddingVertical: 20,
      borderWidth: 1, borderColor: colors.border.default,
      marginBottom: 24, alignItems: 'center',
    },
    verifyHint: {
      fontSize: 13, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, textAlign: 'center', lineHeight: 20,
    },
    altLink: { alignItems: 'center', marginTop: 12, paddingVertical: 6 },
    altLinkText: { color: colors.text.muted, fontSize: 13, fontFamily: 'Inter_400Regular' },
  });
}
