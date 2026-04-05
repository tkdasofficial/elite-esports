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

const OTP_LENGTH = 8;

/**
 * Universal OTP Verification Screen.
 * THIS screen is responsible for sending AND verifying OTPs.
 * Callers just navigate here — they never send emails themselves.
 *
 * Route params:
 *   email — the email address to send OTP to
 *   mode  — 'signup' → signUp()           → verifyOtp type:'signup'  → KYC
 *            'auth'  → signInWithOtp()     → verifyOtp type:'email'   → tabs
 *            'reset' → resetPasswordForEmail() → verifyOtp type:'recovery' → reset-password
 *
 * Template mapping:
 *   signup → "Confirm Sign Up" template
 *   auth   → "Magic Link" template
 *   reset  → "Reset Password" template
 */

type OtpMode = 'signup' | 'auth' | 'reset';

export default function OtpVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const params = useLocalSearchParams<{ email?: string; mode?: string }>();
  const email = (params.email ?? '').trim().toLowerCase();
  const mode  = (params.mode ?? 'signup') as OtpMode;

  const [digits, setDigits]               = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [sending, setSending]             = useState(true);
  const [sendError, setSendError]         = useState('');
  const [verifying, setVerifying]         = useState(false);
  const [verifyError, setVerifyError]     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess]             = useState(false);

  const inputRefs   = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted     = useRef(true);
  const hasSent     = useRef(false); // track if initial signUp was done (for resend)

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  /* ── Countdown timer ── */
  const startCooldown = useCallback(() => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /* ── Send OTP ──
   * mode='signup': signUp() → "Confirm Sign Up" template; resend uses resend({ type:'signup' })
   * mode='auth':   signInWithOtp() → "Magic Link" template
   * mode='reset':  resetPasswordForEmail() → "Reset Password" template
   */
  const sendOtp = useCallback(async (isResend = false) => {
    if (!mounted.current) return;
    if (isResend) setSendError('');
    setSending(true);

    try {
      let err: any = null;

      if (mode === 'signup') {
        if (isResend || hasSent.current) {
          /* Resend "Confirm Sign Up" email (user already created) */
          const { error } = await supabase.auth.resend({ type: 'signup', email });
          err = error;
        } else {
          /* First send: create account + send "Confirm Sign Up" email */
          const tempPwd = `_T${Math.random().toString(36).slice(2)}${Date.now()}_`;
          const { error } = await supabase.auth.signUp({ email, password: tempPwd });
          if (error && error.message?.toLowerCase().includes('already registered')) {
            /* Account already exists from a previous attempt — just resend */
            const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email });
            err = resendErr;
          } else {
            err = error;
          }
          hasSent.current = true;
        }
      } else if (mode === 'reset') {
        /* "Reset Password" template */
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        err = error;
      } else {
        /* mode='auth' — "Magic Link" template */
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        err = error;
      }

      if (!mounted.current) return;

      if (err) {
        setSendError(
          err.message?.toLowerCase().includes('rate')
            ? 'Please wait a moment before requesting a new code.'
            : `Could not send verification code: ${err.message ?? 'Please try again.'}`
        );
      } else {
        setSendError('');
        startCooldown();
        if (isResend) {
          setDigits(Array(OTP_LENGTH).fill(''));
          setVerifyError('');
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
      }
    } catch (e: any) {
      if (mounted.current) setSendError(e?.message ?? 'Something went wrong.');
    } finally {
      if (mounted.current) setSending(false);
    }
  }, [email, mode, startCooldown]);

  /* ── On mount: send OTP immediately ── */
  useEffect(() => {
    mounted.current = true;
    sendOtp(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 800);
    return () => {
      mounted.current = false;
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  /* ── Verify OTP ── */
  const verify = useCallback(async (code: string) => {
    if (code.length < OTP_LENGTH || verifying) return;
    setVerifyError('');
    setVerifying(true);
    try {
      const otpType =
        mode === 'signup' ? 'signup' :
        mode === 'reset'  ? 'recovery' :
                            'email';

      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: otpType,
      });

      if (!mounted.current) return;

      if (verifyErr || !data.session) {
        const msg = (verifyErr?.message ?? '').toLowerCase();
        if (msg.includes('expired')) {
          setVerifyError('This code has expired. Tap "Resend Code" to get a new one.');
        } else {
          setVerifyError('Incorrect code. Please check and try again.');
        }
        setDigits(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }

      await deviceFingerprint.logEvent(
        `otp_verify_${mode}`,
        data.session.user.email,
      );

      setSuccess(true);

      if (mode === 'reset') {
        setTimeout(() => router.replace('/(auth)/reset-password'), 500);
      } else {
        setTimeout(() => navigateAfterAuth(data.session!.user.id), 500);
      }
    } catch (e: any) {
      if (mounted.current) {
        setVerifyError(e?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      if (mounted.current) setVerifying(false);
    }
  }, [email, mode, verifying]);

  /* ── Digit input ── */
  const handleChange = useCallback((text: string, index: number) => {
    const pasted = text.replace(/[^0-9]/g, '');
    if (pasted.length >= OTP_LENGTH) {
      const filled = pasted.slice(0, OTP_LENGTH).split('');
      setDigits(filled);
      setVerifyError('');
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      verify(filled.join(''));
      return;
    }
    const char = pasted.slice(-1);
    if (!char) return;
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setVerifyError('');
    if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (!next.includes('')) verify(next.join(''));
  }, [digits, verify]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  /* ── Mode labels ── */
  const modeConfig = {
    signup: {
      icon:     'person-add-outline' as const,
      title:    'Verify Email',
      subtitle: 'Enter the 8-digit code from your\n"Confirm Sign Up" email',
    },
    auth: {
      icon:     'key-outline' as const,
      title:    'Sign In',
      subtitle: 'Enter the 8-digit code from your\nlogin email',
    },
    reset: {
      icon:     'lock-open-outline' as const,
      title:    'Reset Password',
      subtitle: 'Enter the 8-digit code from your\n"Reset Password" email',
    },
  };
  const { icon, title, subtitle } = modeConfig[mode];

  const isInputBlocked = sending || success;
  const filled         = digits.filter(Boolean).length === OTP_LENGTH;

  /* ══ SUCCESS ══ */
  if (success) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.centeredWrap}>
          <View style={[styles.iconWrap, { borderColor: '#22C55E55' }]}>
            <Ionicons name="checkmark-circle" size={36} color="#22C55E" />
          </View>
          <Text style={styles.title}>Verified!</Text>
          <Text style={styles.subtitle}>Identity confirmed.{'\n'}Taking you there…</Text>
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  /* ══ INITIAL SENDING ══ */
  if (sending && !sendError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <BackBtn insets={insets} colors={colors} styles={styles} />
        <View style={styles.centeredWrap}>
          <View style={styles.iconWrap}>
            <Ionicons name="mail-outline" size={30} color={colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 16 }} />
          <Text style={[styles.subtitle, { marginTop: 16 }]}>
            Sending code to{'\n'}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>{email}</Text>
          </Text>
        </View>
      </View>
    );
  }

  /* ══ SEND ERROR ══ */
  if (sendError && !sending) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <BackBtn insets={insets} colors={colors} styles={styles} />
        <View style={styles.centeredWrap}>
          <View style={[styles.iconWrap, { borderColor: colors.status.error + '55' }]}>
            <Ionicons name="mail-unread-outline" size={30} color={colors.status.error} />
          </View>
          <Text style={styles.title}>Could Not Send Code</Text>
          <Text style={[styles.subtitle, { color: colors.status.error }]}>{sendError}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => sendOtp(false)} activeOpacity={0.85}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ══ MAIN OTP ENTRY ══ */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <BackBtn insets={insets} colors={colors} styles={styles} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48, paddingTop: 56 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={30} color={colors.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {subtitle}{'\n'}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>{email}</Text>
          </Text>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : {},
                  verifyError ? styles.otpBoxError : {},
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
                  editable={!isInputBlocked && !verifying}
                />
              </View>
            ))}
          </View>

          {!!verifyError && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
              <Text style={styles.errorText}>{verifyError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (!filled || verifying || isInputBlocked) && styles.btnDisabled]}
            onPress={() => verify(digits.join(''))}
            disabled={!filled || verifying || isInputBlocked}
            activeOpacity={0.85}
          >
            {verifying
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
              onPress={() => sendOtp(true)}
              disabled={resendCooldown > 0 || verifying || sending}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[
                styles.resendBtn,
                (resendCooldown > 0 || verifying || sending) && styles.resendBtnDisabled,
              ]}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info hint */}
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={15} color={colors.text.muted} />
            <Text style={styles.hintText}>
              Check your spam folder if you don't see the email. The code expires in 15 minutes.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function BackBtn({ insets, colors, styles }: { insets: any; colors: AppColors; styles: any }) {
  return (
    <TouchableOpacity
      style={[styles.backBtn, { top: insets.top + 10 }]}
      onPress={() => router.back()}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
    </TouchableOpacity>
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
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
    centeredWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
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
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 24 },
    otpBox: {
      width: 36, height: 50, borderRadius: 12,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5, borderColor: colors.border.default,
      alignItems: 'center', justifyContent: 'center',
    },
    otpBoxFilled:  { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
    otpBoxError:   { borderColor: colors.status.error, backgroundColor: colors.status.error + '10' },
    otpInput: {
      width: '100%', height: '100%', textAlign: 'center',
      fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary,
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
    btnInner:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnText:     { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
    backLink:    { alignItems: 'center', marginTop: 16, paddingVertical: 6 },
    backLinkText:{ color: colors.text.muted, fontSize: 13, fontFamily: 'Inter_400Regular' },
    resendRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, marginTop: 20,
    },
    resendLabel:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    resendBtn:        { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    resendBtnDisabled:{ opacity: 0.45 },
    hintBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 24,
      padding: 16, backgroundColor: colors.background.elevated,
      borderRadius: 14, borderWidth: 1, borderColor: colors.border.default,
    },
    hintText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, lineHeight: 18 },
  });
}
