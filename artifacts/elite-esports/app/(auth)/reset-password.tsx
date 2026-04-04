import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { AuthInput } from '@/features/auth/components/AuthInput';
import type { AppColors } from '@/utils/colors';

const MIN_LENGTH = 8;

function strengthLabel(pwd: string): { label: string; color: string; width: string } {
  if (pwd.length === 0) return { label: '', color: 'transparent', width: '0%' };
  const hasUpper  = /[A-Z]/.test(pwd);
  const hasLower  = /[a-z]/.test(pwd);
  const hasDigit  = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  const score = [pwd.length >= MIN_LENGTH, hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
  if (score <= 2) return { label: 'Weak',   color: '#EF4444', width: '33%' };
  if (score <= 3) return { label: 'Fair',   color: '#F59E0B', width: '60%' };
  if (score === 4) return { label: 'Good',  color: '#3B82F6', width: '80%' };
  return               { label: 'Strong', color: '#22C55E', width: '100%' };
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={ok ? '#22C55E' : '#666'}
      />
      <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: ok ? '#22C55E' : '#888' }}>
        {text}
      </Text>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const insets             = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles             = useMemo(() => createStyles(colors), [colors]);

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState(false);
  const [sessionReady,    setSessionReady]    = useState(false);

  const confirmRef = useRef<any>(null);

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        router.replace('/(auth)/email-verify');
      }
    });
  }, []);

  const strength  = strengthLabel(password);
  const rulesOk   = password.length >= MIN_LENGTH;
  const matchOk   = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = rulesOk && matchOk && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message ?? 'Could not update password. Please try again.');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.replace('/(tabs)'), 2200);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) return null;

  if (success) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>Password Updated!</Text>
          <Text style={styles.successSub}>Your new password is set.{'\n'}Taking you to the app…</Text>
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 48, paddingTop: 48 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={30} color={colors.primary} />
          </View>

          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Choose a strong password to secure your account.
          </Text>

          {/* New Password */}
          <View style={styles.fieldWrap}>
            <AuthInput
              label="New Password"
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              placeholder="At least 8 characters"
              iconName="lock-closed-outline"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus?.()}
            />
          </View>

          {/* Strength bar */}
          {password.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthTrack}>
                <View style={[styles.strengthFill, { width: strength.width as any, backgroundColor: strength.color }]} />
              </View>
              {strength.label ? (
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              ) : null}
            </View>
          )}

          {/* Rules */}
          {password.length > 0 && (
            <View style={styles.rulesWrap}>
              <Rule ok={rulesOk} text="At least 8 characters" />
            </View>
          )}

          {/* Confirm Password */}
          <View style={[styles.fieldWrap, { marginTop: 8 }]}>
            <AuthInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); setError(''); }}
              placeholder="Re-enter your password"
              iconName="shield-checkmark-outline"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {/* Match indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchRow}>
              <Ionicons
                name={matchOk ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={matchOk ? '#22C55E' : '#EF4444'}
              />
              <Text style={[styles.matchText, { color: matchOk ? '#22C55E' : '#EF4444' }]}>
                {matchOk ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}

          {/* Error */}
          {!!error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, !canSubmit && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={styles.btnInner}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.btnText}>Set Password</Text>
                </View>
              )
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace('/(auth)/email-verify')}
            activeOpacity={0.7}
          >
            <Text style={styles.backLinkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
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

    fieldWrap: { marginBottom: 10 },

    strengthWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginTop: 8, marginBottom: 4, paddingHorizontal: 2,
    },
    strengthTrack: {
      flex: 1, height: 4, borderRadius: 2,
      backgroundColor: colors.border.default, overflow: 'hidden',
    },
    strengthFill: { height: '100%', borderRadius: 2 },
    strengthLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', minWidth: 46, textAlign: 'right' },

    rulesWrap: { paddingHorizontal: 4, marginBottom: 4 },

    matchRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 4, marginTop: 6, marginBottom: 4,
    },
    matchText: { fontSize: 12, fontFamily: 'Inter_400Regular' },

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
      alignItems: 'center', justifyContent: 'center', marginTop: 8,
    },
    btnDisabled: { opacity: 0.4 },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

    backLink: { alignItems: 'center', marginTop: 16, paddingVertical: 6 },
    backLinkText: { color: colors.text.muted, fontSize: 13, fontFamily: 'Inter_400Regular' },

    successWrap: {
      flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
    },
    successIcon: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: 'rgba(34,197,94,0.12)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      borderWidth: 1.5, borderColor: 'rgba(34,197,94,0.3)',
    },
    successTitle: {
      fontSize: 26, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, textAlign: 'center', marginBottom: 10,
    },
    successSub: {
      fontSize: 15, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, textAlign: 'center', lineHeight: 24,
    },
  });
}
