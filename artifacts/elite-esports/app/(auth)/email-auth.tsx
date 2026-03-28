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

export default function EmailAuthScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleCheckEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setChecking(true);
    try {
      const tempPw = 'probe_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const { data } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: tempPw,
      });
      await supabase.auth.signOut();
      setIsExistingUser(data?.user?.identities?.length === 0);
      setStep('password');
    } catch {
      setError('Unable to check email. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isExistingUser) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) { setError('Incorrect password. Please try again.'); return; }
        router.replace('/(tabs)');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signUpError) { setError(signUpError.message); return; }
        if (data?.user?.identities?.length === 0) {
          setIsExistingUser(true);
          setError('This email is already registered. Enter your password to sign in.');
          return;
        }
        Alert.alert(
          'Account Created',
          'Check your email to verify your account, then sign in.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/options') }],
        );
      }
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => step === 'password' ? (setStep('email'), setPassword(''), setError('')) : router.back();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#150400', '#0A0A0A', '#0A0A0A']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back */}
      <TouchableOpacity
        style={[styles.backBtn, { top: topPad + 10 }]}
        onPress={goBack}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 72, paddingBottom: bottomPad + 48 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Step icon */}
          <View style={styles.iconWrap}>
            <Ionicons
              name={
                step === 'email' ? 'mail-outline'
                  : isExistingUser ? 'person-circle-outline'
                  : 'shield-checkmark-outline'
              }
              size={30}
              color={Colors.primary}
            />
          </View>

          {/* Heading */}
          <Text style={styles.title}>
            {step === 'email'
              ? 'Your email address'
              : isExistingUser ? 'Welcome back!'
              : 'Create a password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email'
              ? "We'll check if you have an account"
              : isExistingUser
                ? 'Enter your password to sign in'
                : 'Choose a strong password for your account'}
          </Text>

          {/* Email pill (step 2 only) */}
          {step === 'password' && (
            <TouchableOpacity
              style={styles.emailPill}
              onPress={() => { setStep('email'); setPassword(''); setError(''); }}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={14} color="#666666" />
              <Text style={styles.emailPillText} numberOfLines={1}>{email}</Text>
              <Text style={styles.changeTxt}>Change</Text>
            </TouchableOpacity>
          )}

          {/* Field */}
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
                label={isExistingUser ? 'Password' : 'Create password'}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder={isExistingUser ? 'Your password' : 'Min. 6 characters'}
                iconName="lock-closed-outline"
                secureTextEntry
              />
            )}
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, (checking || loading) && styles.btnDisabled]}
            onPress={step === 'email' ? handleCheckEmail : handleSubmit}
            disabled={checking || loading}
            activeOpacity={0.85}
          >
            {(checking || loading)
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {step === 'email' ? 'Continue' : isExistingUser ? 'Sign In' : 'Create Account'}
                </Text>}
          </TouchableOpacity>

          {/* Back to options */}
          <TouchableOpacity style={styles.altLink} onPress={() => router.replace('/(auth)/options')} activeOpacity={0.7}>
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
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1C0A04',
    borderWidth: 1.5,
    borderColor: Colors.primary + '35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#606060',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },

  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#252525',
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 20,
    gap: 8,
  },
  emailPillText: {
    flex: 1,
    color: '#999999',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  changeTxt: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },

  fieldWrap: {
    marginBottom: 8,
  },

  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },

  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },

  altLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 6,
  },
  altLinkText: {
    color: '#555555',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
