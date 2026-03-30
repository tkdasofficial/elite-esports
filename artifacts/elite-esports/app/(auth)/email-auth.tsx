import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { Colors } from '@/utils/colors';
import { AuthInput } from '@/features/auth/components/AuthInput';

type Step = 'email' | 'password';
type Mode = 'signin' | 'signup';

function navigateAfterAuth() {
  router.replace('/(tabs)');
}

export default function EmailAuthScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleEmailContinue = () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleSignIn = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
          setError("Password is incorrect. Don't have an account? Tap 'Create Account' below.");
        } else if (msg.includes('email not confirmed')) {
          setError('Please verify your email first. Check your inbox for the confirmation link.');
        } else {
          setError(signInError.message);
        }
      } else if (data.user) {
        navigateAfterAuth();
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data?.user?.identities?.length === 0) {
        setMode('signin');
        setError('This email is already registered. Enter your password to sign in.');
        return;
      }
      Alert.alert(
        'Account Created!',
        'Check your email and click the confirmation link, then come back to sign in.',
        [{ text: 'OK', onPress: () => { setMode('signin'); setPassword(''); setError(''); } }],
      );
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'password') {
      setStep('email');
      setPassword('');
      setError('');
      setMode('signin');
    } else {
      router.back();
    }
  };

  const switchMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setPassword('');
    setError('');
  };

  const isSignIn = mode === 'signin';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#150400', '#0A0A0A', '#0A0A0A']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TouchableOpacity
        style={[styles.backBtn, { top: topPad + 10 }]}
        onPress={goBack}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 72, paddingBottom: bottomPad + 48 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name={step === 'email' ? 'mail-outline' : isSignIn ? 'person-circle-outline' : 'shield-checkmark-outline'}
              size={30}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.title}>
            {step === 'email' ? 'Your email address' : isSignIn ? 'Welcome back!' : 'Create a password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? 'Enter your email to get started'
              : isSignIn
                ? 'Enter your password to sign in'
                : 'Choose a strong password (min. 6 characters)'}
          </Text>

          {step === 'password' && (
            <TouchableOpacity
              style={styles.emailPill}
              onPress={() => { setStep('email'); setPassword(''); setError(''); setMode('signin'); }}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={14} color="#666666" />
              <Text style={styles.emailPillText} numberOfLines={1}>{email}</Text>
              <Text style={styles.changeTxt}>Change</Text>
            </TouchableOpacity>
          )}

          <View style={styles.fieldWrap}>
            {step === 'email' ? (
              <AuthInput
                label="Email address"
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                placeholder="your@email.com"
                iconName="mail-outline"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
              />
            ) : (
              <AuthInput
                label={isSignIn ? 'Password' : 'Create password'}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder={isSignIn ? 'Your password' : 'Min. 6 characters'}
                iconName="lock-closed-outline"
                secureTextEntry
              />
            )}
          </View>

          {!!error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={step === 'email' ? handleEmailContinue : isSignIn ? handleSignIn : handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {step === 'email' ? 'Continue' : isSignIn ? 'Sign In' : 'Create Account'}
                </Text>}
          </TouchableOpacity>

          {step === 'password' && (
            <TouchableOpacity style={styles.switchMode} onPress={switchMode} activeOpacity={0.7}>
              <Text style={styles.switchModeText}>
                {isSignIn ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchModeLink}>{isSignIn ? 'Create one' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.altLink}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25 },
  iconWrap: {
    alignSelf: 'center', width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1C0A04', borderWidth: 1.5,
    borderColor: Colors.primary + '35',
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#606060', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  emailPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#141414', borderRadius: 22,
    borderWidth: 1, borderColor: '#252525',
    paddingHorizontal: 16, paddingVertical: 11, marginBottom: 20, gap: 8,
  },
  emailPillText: { flex: 1, color: '#999999', fontSize: 13, fontFamily: 'Inter_400Regular' },
  changeTxt: { color: Colors.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  fieldWrap: { marginBottom: 8 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 },
  errorText: { color: '#EF4444', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', flex: 1 },
  btn: { backgroundColor: Colors.primary, borderRadius: 25, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  switchMode: { alignItems: 'center', marginTop: 16, paddingVertical: 6 },
  switchModeText: { color: '#555555', fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  switchModeLink: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  altLink: { alignItems: 'center', marginTop: 16, paddingVertical: 6 },
  altLinkText: { color: '#404040', fontSize: 13, fontFamily: 'Inter_400Regular' },
});
