import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { navigateAfterAuth } from '@/utils/authHelpers';

type Step = 'email' | 'password' | 'verify' | 'reset-sent';
type Mode = 'signin' | 'signup' | 'unknown';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailAuthScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState<Step>('email');
  const [mode, setMode] = useState<Mode>('unknown');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  useEffect(() => {
    if (step !== 'verify') return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await navigateAfterAuth(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [step]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEmailContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setChecking(true);

    try {
      const { data } = await supabase.auth.signUp({
        email: trimmed,
        password: `__probe_${Math.random().toString(36).slice(2)}__`,
      });

      const identities = data?.user?.identities;

      if (Array.isArray(identities) && identities.length === 0) {
        setMode('signin');
      } else {
        setMode('signup');
        startCooldown();
      }
    } catch {
      setMode('unknown');
    } finally {
      setChecking(false);
      setStep('password');
    }
  };

  const handlePasswordContinue = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    try {
      if (mode === 'signin' || mode === 'unknown') {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (!signInError && signInData.user) {
          await navigateAfterAuth(signInData.user.id);
          return;
        }

        const msg = (signInError?.message ?? '').toLowerCase();

        if (msg.includes('email not confirmed')) {
          startCooldown();
          setStep('verify');
          return;
        }

        if (mode === 'signin') {
          setError('Incorrect password. Please try again.');
          return;
        }
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if ((signUpData.user?.identities?.length ?? 0) === 0) {
        setMode('signin');
        setError('An account already exists for this email. Please enter your correct password.');
        return;
      }

      startCooldown();
      setStep('verify');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    } catch {
    } finally {
      setLoading(false);
      setStep('reset-sent');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
      startCooldown();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'password') { setStep('email'); setPassword(''); setMode('unknown'); }
    else if (step === 'verify') { setStep('password'); }
    else if (step === 'reset-sent') { setStep('password'); }
    else router.back();
  };

  const stepIcon: Record<Step, keyof typeof Ionicons.glyphMap> = {
    email: 'person-outline',
    password: mode === 'signin' ? 'lock-closed-outline' : 'lock-open-outline',
    verify: 'mail-open-outline',
    'reset-sent': 'mail-outline',
  };

  const stepTitle: Record<Step, string> = {
    email: 'Get Started',
    password: mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Enter Password',
    verify: 'Verify Your Email',
    'reset-sent': 'Check Your Inbox',
  };

  const stepSub: Record<Step, string> = {
    email: 'Enter your email to continue',
    password: mode === 'signin'
      ? 'Enter your password to log in'
      : mode === 'signup'
        ? 'Choose a password for your new account'
        : 'Enter your password to continue',
    verify: 'We sent a verification link to your email. Click it and come back here.',
    'reset-sent': `A password reset link has been sent to\n${email}`,
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={[styles.backBtn, { top: topPad + 10 }]} onPress={goBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={stepIcon[step]} size={30} color={colors.primary} />
          </View>

          <Text style={styles.title}>{stepTitle[step]}</Text>
          <Text style={styles.subtitle}>{stepSub[step]}</Text>

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
                  <View style={styles.checkingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.btnText}>Checking…</Text>
                  </View>
                ) : (
                  <Text style={styles.btnText}>Continue</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 'password' && (
            <>
              <TouchableOpacity
                style={styles.emailPill}
                onPress={() => { setStep('email'); setMode('unknown'); }}
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
                  placeholder="Min. 6 characters"
                  iconName="lock-closed-outline"
                  secureTextEntry
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  onSubmitEditing={handlePasswordContinue}
                  returnKeyType="go"
                />
              </View>

              {!!error && <ErrorRow text={error} colors={colors} styles={styles} />}

              <TouchableOpacity
                style={[styles.btn, (!password || loading) && styles.btnDisabled]}
                onPress={handlePasswordContinue}
                disabled={!password || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>
                      {mode === 'signin' ? 'Log In' : mode === 'signup' ? 'Sign Up' : 'Continue'}
                    </Text>
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

          {step === 'verify' && (
            <>
              <View style={styles.verifyBox}>
                <Ionicons name="checkmark-circle-outline" size={52} color={colors.primary} style={{ marginBottom: 14 }} />
                <Text style={styles.verifyTitle}>Check your inbox</Text>
                <Text style={styles.verifyBody}>
                  We sent a verification link to{'\n'}
                  <Text style={styles.verifyEmail}>{email}</Text>
                </Text>
                <Text style={styles.verifyHint}>
                  Once you click the link, this screen will automatically move forward.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.resendBtn, (resendCooldown > 0 || loading) && styles.btnDisabled]}
                onPress={handleResend}
                disabled={resendCooldown > 0 || loading}
                activeOpacity={0.7}
              >
                {loading
                  ? <ActivityIndicator color={colors.primary} size="small" />
                  : <Text style={styles.resendText}>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
                    </Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.altLink}
                onPress={() => { setStep('email'); setMode('unknown'); setPassword(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.altLinkText}>Use a different email</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'reset-sent' && (
            <>
              <View style={styles.verifyBox}>
                <Ionicons name="mail-outline" size={52} color={colors.primary} style={{ marginBottom: 14 }} />
                <Text style={styles.verifyTitle}>Reset link sent</Text>
                <Text style={styles.verifyBody}>
                  Check your inbox at{'\n'}
                  <Text style={styles.verifyEmail}>{email}</Text>
                </Text>
                <Text style={styles.verifyHint}>
                  Follow the link in the email to set a new password. You can then come back and log in.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => { setStep('email'); setMode('unknown'); setPassword(''); }}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.altLink, { marginTop: 20 }]}
            onPress={() => router.replace('/(auth)/options')}
            activeOpacity={0.7}
          >
            <Text style={styles.altLinkText}>Other sign-in options</Text>
          </TouchableOpacity>
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
      paddingHorizontal: 24, paddingTop: 60,
    },
    iconWrap: {
      alignSelf: 'center', width: 72, height: 72, borderRadius: 36,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5, borderColor: colors.primary + '35',
      alignItems: 'center', justifyContent: 'center', marginBottom: 22,
    },
    title: {
      fontSize: 24, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, textAlign: 'center', marginBottom: 8,
    },
    subtitle: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, textAlign: 'center',
      marginBottom: 32, lineHeight: 20, paddingHorizontal: 8,
    },
    emailPill: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 22, borderWidth: 1, borderColor: colors.border.default,
      paddingHorizontal: 16, paddingVertical: 11, marginBottom: 14, gap: 8,
    },
    emailPillText: {
      flex: 1, color: colors.text.secondary,
      fontSize: 13, fontFamily: 'Inter_400Regular',
    },
    changeText: { color: colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    fieldWrap: { marginBottom: 8 },
    errorWrap: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 6, marginBottom: 14, paddingHorizontal: 4,
    },
    errorText: {
      color: colors.status.error, fontSize: 13,
      fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18,
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: 25, height: 50,
      alignItems: 'center', justifyContent: 'center', marginTop: 8,
    },
    btnDisabled: { opacity: 0.45 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
    checkingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    forgotBtn: {
      alignItems: 'center', paddingVertical: 14, marginTop: 4,
    },
    forgotText: {
      color: colors.primary, fontSize: 14, fontFamily: 'Inter_600SemiBold',
    },
    verifyBox: {
      backgroundColor: colors.background.elevated,
      borderRadius: 18, padding: 24, alignItems: 'center',
      borderWidth: 1, borderColor: colors.border.default, marginBottom: 20,
    },
    verifyTitle: {
      fontSize: 18, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, marginBottom: 8, textAlign: 'center',
    },
    verifyBody: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, textAlign: 'center', marginBottom: 12, lineHeight: 22,
    },
    verifyEmail: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
    verifyHint: {
      fontSize: 12, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, textAlign: 'center', lineHeight: 18,
    },
    resendBtn: {
      borderRadius: 25, height: 46, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: colors.primary, marginBottom: 12,
    },
    resendText: { color: colors.primary, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
    altLink: { alignItems: 'center', marginTop: 8, paddingVertical: 6 },
    altLinkText: { color: colors.text.muted, fontSize: 13, fontFamily: 'Inter_400Regular' },
  });
}
