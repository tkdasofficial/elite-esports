import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import type { AppColors } from '@/utils/colors';

const INPUT_H = 52;
const ICON_W  = 44;

export default function SetPasswordScreen() {
  const insets             = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user }           = useAuth();
  const styles             = useMemo(() => createStyles(colors), [colors]);

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [done,            setDone]            = useState(false);

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  const passwordsMatch = password === confirmPassword;
  const isReady        = password.length >= 6 && confirmPassword.length >= 6 && passwordsMatch;

  const handleSetPassword = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!passwordsMatch)      { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.successWrap}>
          <View style={[styles.iconWrap, { borderColor: colors.status.success + '40' }]}>
            <Ionicons name="checkmark-circle-outline" size={36} color={colors.status.success} />
          </View>
          <Text style={styles.title}>Password Updated!</Text>
          <Text style={styles.subtitle}>Your password has been set successfully.</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Go to App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={30} color={colors.primary} />
          </View>

          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>Create a new password for your account</Text>

          {/* Email locked */}
          {!!user?.email && (
            <View style={styles.emailPill}>
              <Ionicons name="mail-outline" size={15} color={colors.text.muted} />
              <Text style={styles.emailPillText} numberOfLines={1}>{user.email}</Text>
              <Ionicons name="lock-closed" size={12} color={colors.text.muted} />
            </View>
          )}

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <View style={[styles.pill, password.length > 0 && styles.pillFocused]}>
              <View style={styles.iconSlot}>
                <Ionicons
                  name="lock-closed-outline" size={17}
                  color={password.length > 0 ? colors.primary : colors.text.muted}
                />
              </View>
              <TextInput
                style={styles.pillInput}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.text.muted}
                secureTextEntry={!showPass}
                autoComplete="new-password"
              />
              <TouchableOpacity
                onPress={() => setShowPass(v => !v)}
                style={styles.eyeSlot}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.6}
              >
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={17} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={[
              styles.pill,
              confirmPassword.length > 0 && styles.pillFocused,
              confirmPassword.length > 0 && !passwordsMatch && styles.pillError,
            ]}>
              <View style={styles.iconSlot}>
                <Ionicons
                  name={
                    confirmPassword.length === 0 ? 'lock-closed-outline' :
                    passwordsMatch ? 'checkmark-circle-outline' : 'alert-circle-outline'
                  }
                  size={17}
                  color={
                    confirmPassword.length === 0 ? colors.text.muted :
                    passwordsMatch ? colors.status.success : colors.status.error
                  }
                />
              </View>
              <TextInput
                style={styles.pillInput}
                value={confirmPassword}
                onChangeText={v => { setConfirmPassword(v); setError(''); }}
                placeholder="Re-enter password"
                placeholderTextColor={colors.text.muted}
                secureTextEntry={!showConfirm}
                autoComplete="new-password"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(v => !v)}
                style={styles.eyeSlot}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.6}
              >
                <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={17} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.mismatchHint}>Passwords do not match</Text>
            )}
          </View>

          {!!error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (!isReady || loading) && styles.btnDisabled]}
            onPress={handleSetPassword}
            disabled={!isReady || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Set Password</Text>
            }
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
    successWrap: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
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
      marginBottom: 28, lineHeight: 22, paddingHorizontal: 8,
    },
    emailPill: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 26, borderWidth: 1, borderColor: colors.border.default,
      paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, gap: 8,
      opacity: 0.75,
    },
    emailPillText: {
      flex: 1, color: colors.text.secondary,
      fontSize: 13, fontFamily: 'Inter_400Regular',
    },
    fieldWrap: { marginBottom: 14 },
    inputLabel: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, marginBottom: 6,
      letterSpacing: 0.7,
    },
    pill: {
      flexDirection: 'row', alignItems: 'center',
      height: INPUT_H, borderRadius: INPUT_H / 2,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5, borderColor: colors.border.default,
      overflow: 'hidden',
    },
    pillFocused: { borderColor: colors.primary, backgroundColor: colors.background.card },
    pillError:   { borderColor: colors.status.error },
    iconSlot: { width: ICON_W, alignItems: 'center', justifyContent: 'center' },
    eyeSlot:  { width: ICON_W, alignItems: 'center', justifyContent: 'center' },
    pillInput: {
      flex: 1, color: colors.text.primary,
      fontSize: 14, fontFamily: 'Inter_400Regular',
      paddingVertical: 0, backgroundColor: 'transparent',
    },
    mismatchHint: {
      color: colors.status.error, fontSize: 12,
      fontFamily: 'Inter_400Regular', marginTop: 6, marginLeft: 16,
    },
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
  });
}
