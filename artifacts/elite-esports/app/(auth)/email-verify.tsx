import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';
import { AuthInput } from '@/features/auth/components/AuthInput';
import { navigateAfterAuth } from '@/utils/authHelpers';
import { deviceFingerprint } from '@/services/DeviceFingerprint';

type Step = 'email' | 'login';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep]         = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  const trimmedEmail = email.trim().toLowerCase();

  /* ── Validate email then send OTP (for new accounts) ── */
  const handleEmailContinue = () => {
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    /* Navigate to OTP page — it will send the code itself on mount */
    router.push({
      pathname: '/(auth)/otp-verify',
      params: { email: trimmedEmail, mode: 'auth' },
    });
  };

  /* ── Show password login step ── */
  const handleShowLogin = () => {
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter your email first.');
      return;
    }
    setError('');
    setStep('login');
  };

  /* ── Password sign-in ── */
  const handleSignIn = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!err && data.user) {
        await deviceFingerprint.logEvent('sign_in', data.user.email);
        await navigateAfterAuth(data.user.id);
        return;
      }

      const msg = (err?.message ?? '').toLowerCase();
      if (msg.includes('email not confirmed')) {
        /* Account exists but unconfirmed → send OTP to verify */
        router.push({
          pathname: '/(auth)/otp-verify',
          params: { email: trimmedEmail, mode: 'auth' },
        });
        return;
      }

      setError('Incorrect password. Please try again.');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot password → OTP in reset mode ── */
  const handleForgotPassword = () => {
    setError('');
    /* Navigate to OTP page — it will send the reset code itself on mount */
    router.push({
      pathname: '/(auth)/otp-verify',
      params: { email: trimmedEmail, mode: 'reset' },
    });
  };

  const goBack = () => {
    setError('');
    setStep('email');
    setPassword('');
  };

  const stepMeta: Record<Step, {
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
  };

  const { icon, title, subtitle } = stepMeta[step];

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
            { paddingBottom: insets.bottom + 48, paddingTop: step !== 'email' ? 56 : 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={30} color={colors.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

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

              {/* Primary: send OTP (new accounts / continue with code) */}
              <TouchableOpacity
                style={[styles.btn, !email.trim() && styles.btnDisabled]}
                onPress={handleEmailContinue}
                disabled={!email.trim()}
                activeOpacity={0.85}
              >
                <View style={styles.row}>
                  <Ionicons name="mail-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>Continue with Code</Text>
                </View>
              </TouchableOpacity>

              {/* Secondary: password login (existing accounts) */}
              <TouchableOpacity
                style={[styles.passwordBtn, !email.trim() && styles.btnDisabled]}
                onPress={handleShowLogin}
                disabled={!email.trim()}
                activeOpacity={0.85}
              >
                <View style={styles.row}>
                  <Ionicons name="lock-closed-outline" size={17} color={colors.text.primary} />
                  <Text style={styles.passwordBtnText}>Sign In with Password</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* ── Login step ── */}
          {step === 'login' && (
            <>
              {/* Email pill */}
              <TouchableOpacity
                style={styles.emailPill}
                onPress={goBack}
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

              {/* Let existing users also use OTP if they prefer */}
              <TouchableOpacity
                style={styles.otpLink}
                onPress={handleEmailContinue}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.otpLinkText}>Sign in with verification code instead</Text>
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

    /* Primary button (OTP / sign in) */
    btn: {
      backgroundColor: colors.primary, borderRadius: 30, height: 54,
      alignItems: 'center', justifyContent: 'center', marginTop: 6,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    /* Secondary button (password login) */
    passwordBtn: {
      backgroundColor: colors.background.elevated,
      borderRadius: 30, height: 54,
      alignItems: 'center', justifyContent: 'center',
      marginTop: 12, borderWidth: 1, borderColor: colors.border.default,
    },
    passwordBtnText: {
      color: colors.text.primary, fontSize: 15,
      fontFamily: 'Inter_600SemiBold', letterSpacing: 0.1,
    },

    forgotBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 2 },
    forgotText: { color: colors.primary, fontSize: 14, fontFamily: 'Inter_600SemiBold' },

    otpLink: { alignItems: 'center', paddingVertical: 8 },
    otpLinkText: { color: colors.text.muted, fontSize: 13, fontFamily: 'Inter_400Regular' },
  });
}
