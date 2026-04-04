import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import { navigateAfterAuth } from '@/utils/authHelpers';
import { deviceFingerprint } from '@/services/DeviceFingerprint';
import type { AppColors } from '@/utils/colors';

const OTP_LENGTH = 6;

/**
 * Universal OTP Verification Screen.
 * Route params:
 *   email  — the email address the OTP was sent to
 *   mode   — 'signup' | 'reset'
 *             signup → after verify, route to KYC / tabs
 *             reset  → after verify, route to reset-password
 */
export default function OtpVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const params = useLocalSearchParams<{ email?: string; mode?: string }>();
  const email = (params.email ?? '').trim().toLowerCase();
  const mode  = (params.mode ?? 'signup') as 'signup' | 'reset';

  const [digits, setDigits]           = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [success, setSuccess]         = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  /* ── Start resend cooldown ── */
  const startCooldown = useCallback(() => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCooldown();
    /* Auto-focus first box */
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  /* ── Verify OTP ── */
  const verify = useCallback(async (code: string) => {
    if (code.length < OTP_LENGTH) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (verifyErr || !data.session) {
        const msg = verifyErr?.message ?? '';
        if (msg.toLowerCase().includes('expired')) {
          setError('This code has expired. Please request a new one.');
        } else if (msg.toLowerCase().includes('invalid')) {
          setError('Incorrect code. Please check and try again.');
        } else {
          setError('Verification failed. Please try again.');
        }
        setDigits(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }

      await deviceFingerprint.logEvent(
        mode === 'reset' ? 'otp_verify_reset' : 'otp_verify_signup',
        data.session.user.email,
      );

      setSuccess(true);

      if (mode === 'reset') {
        setTimeout(() => router.replace('/(auth)/reset-password'), 500);
      } else {
        setTimeout(() => navigateAfterAuth(data.session!.user.id), 500);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, mode]);

  /* ── Handle digit input ── */
  const handleChange = useCallback((text: string, index: number) => {
    const char = text.replace(/[^0-9]/g, '').slice(-1);

    /* Handle paste: if user pastes a full code into any box */
    const pasted = text.replace(/[^0-9]/g, '');
    if (pasted.length >= OTP_LENGTH) {
      const newDigits = pasted.slice(0, OTP_LENGTH).split('');
      setDigits(newDigits);
      setError('');
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      verify(newDigits.join(''));
      return;
    }

    if (!char && text.length === 0) {
      /* Backspace handled in onKeyPress */
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError('');

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const full = newDigits.join('');
    if (full.length === OTP_LENGTH && !newDigits.includes('')) {
      verify(full);
    }
  }, [digits, verify]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      const { error: resendErr } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (resendErr) {
        setError(resendErr.message ?? 'Could not resend code. Please try again.');
        return;
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      startCooldown();
    } catch (e: any) {
      setError(e?.message ?? 'Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  const modeTitle = mode === 'reset' ? 'Reset Password' : 'Verify Email';
  const modeSubtitle = mode === 'reset'
    ? 'Enter the 6-digit code we sent to reset your password'
    : 'Enter the 6-digit code we sent to verify your email';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={goBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48, paddingTop: 56 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            {success
              ? <Ionicons name="checkmark-circle" size={34} color={colors.status.success} />
              : <Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} />
            }
          </View>

          <Text style={styles.title}>{success ? 'Verified!' : modeTitle}</Text>

          <Text style={styles.subtitle}>
            {success
              ? `Your identity has been confirmed.`
              : modeSubtitle + '\n'
            }
            {!success && (
              <Text style={[styles.subtitle, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                {email}
              </Text>
            )}
          </Text>

          {/* OTP Boxes */}
          {!success && (
            <>
              <View style={styles.otpRow}>
                {digits.map((digit, i) => (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : {},
                      error ? styles.otpBoxError : {},
                    ]}
                  >
                    <TextInput
                      ref={ref => { inputRefs.current[i] = ref; }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={text => handleChange(text, i)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                      keyboardType="number-pad"
                      maxLength={OTP_LENGTH}
                      selectTextOnFocus
                      caretHidden
                      textContentType="oneTimeCode"
                      editable={!loading && !success}
                    />
                  </View>
                ))}
              </View>

              {/* Error */}
              {!!error && (
                <View style={styles.errorWrap}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Verify button */}
              <TouchableOpacity
                style={[
                  styles.btn,
                  (digits.includes('') || loading) && styles.btnDisabled,
                ]}
                onPress={() => verify(digits.join(''))}
                disabled={digits.includes('') || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <View style={styles.btnInner}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.btnText}>Verify Code</Text>
                    </View>
                  )
                }
              </TouchableOpacity>

              {/* Resend */}
              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn't receive a code?</Text>
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[
                    styles.resendBtn,
                    (resendCooldown > 0 || loading) && styles.resendBtnDisabled,
                  ]}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Hint */}
              <View style={styles.hintBox}>
                <Ionicons name="information-circle-outline" size={15} color={colors.text.muted} />
                <Text style={styles.hintText}>
                  Check your spam folder if you don't see the email. The code expires in 10 minutes.
                </Text>
              </View>
            </>
          )}

          {/* Success loading */}
          {success && (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 32 }} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
      marginBottom: 36, lineHeight: 22, paddingHorizontal: 8,
    },

    /* OTP boxes */
    otpRow: {
      flexDirection: 'row', justifyContent: 'center',
      gap: 10, marginBottom: 24,
    },
    otpBox: {
      width: 48, height: 58, borderRadius: 14,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5, borderColor: colors.border.default,
      alignItems: 'center', justifyContent: 'center',
    },
    otpBoxFilled: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '12',
    },
    otpBoxError: {
      borderColor: colors.status.error,
      backgroundColor: colors.status.error + '10',
    },
    otpInput: {
      width: '100%', height: '100%',
      textAlign: 'center',
      fontSize: 22, fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
    },

    errorWrap: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 6, marginBottom: 16, paddingHorizontal: 4,
    },
    errorText: {
      color: colors.status.error, fontSize: 13,
      fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18,
    },

    btn: {
      backgroundColor: colors.primary, borderRadius: 30, height: 54,
      alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    btnDisabled: { opacity: 0.4 },
    btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

    resendRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, marginTop: 20,
    },
    resendLabel: {
      fontSize: 13, fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
    },
    resendBtn: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold',
      color: colors.primary,
    },
    resendBtnDisabled: { opacity: 0.45 },

    hintBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      marginTop: 24, padding: 16,
      backgroundColor: colors.background.elevated,
      borderRadius: 14, borderWidth: 1, borderColor: colors.border.default,
    },
    hintText: {
      flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, lineHeight: 18,
    },
  });
}
