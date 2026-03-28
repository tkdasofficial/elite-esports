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

  /* ── Step 1: Check if email is already registered ── */
  const handleCheckEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setChecking(true);

    try {
      // Use signUp to probe — if identities is empty, email is already registered
      const tempPw = 'probe_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: tempPw,
      });

      // Always sign out the probe session
      await supabase.auth.signOut();

      const existing = data?.user?.identities?.length === 0;
      setIsExistingUser(existing);
      setStep('password');
    } catch {
      setError('Unable to check email. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  /* ── Step 2: Sign in or sign up with the entered password ── */
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
        if (signInError) {
          setError('Incorrect password. Please try again.');
          return;
        }
        router.replace('/(tabs)');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data?.user?.identities?.length === 0) {
          // Was already registered between our check and now
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#140400', '#0A0A0A', '#0A0A0A']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: topPad + 8 }]}
        onPress={() => step === 'password' ? setStep('email') : router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 64, paddingBottom: bottomPad + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {step === 'email' ? (
            <>
              <View style={styles.iconRow}>
                <View style={styles.stepIcon}>
                  <Ionicons name="mail-outline" size={28} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.title}>Enter your email</Text>
              <Text style={styles.subtitle}>We'll check if you have an account</Text>

              <View style={styles.fields}>
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
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.btn, checking && styles.btnDisabled]}
                onPress={handleCheckEmail}
                disabled={checking}
                activeOpacity={0.85}
              >
                {checking
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Continue</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconRow}>
                <View style={styles.stepIcon}>
                  <Ionicons
                    name={isExistingUser ? 'person-circle-outline' : 'shield-checkmark-outline'}
                    size={28}
                    color={Colors.primary}
                  />
                </View>
              </View>

              <Text style={styles.title}>
                {isExistingUser ? 'Welcome back!' : 'Create a password'}
              </Text>
              <Text style={styles.subtitle}>
                {isExistingUser
                  ? 'Enter your password to sign in'
                  : 'Choose a secure password for your new account'}
              </Text>

              {/* Locked email pill */}
              <View style={styles.emailPill}>
                <Ionicons name="mail-outline" size={14} color="#666666" style={{ marginRight: 8 }} />
                <Text style={styles.emailPillText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => { setStep('email'); setPassword(''); setError(''); }}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fields}>
                <AuthInput
                  label={isExistingUser ? 'Password' : 'Create password'}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  placeholder={isExistingUser ? 'Your password' : 'Min. 6 characters'}
                  iconName="lock-closed-outline"
                  secureTextEntry
                />
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>
                      {isExistingUser ? 'Sign In' : 'Create Account'}
                    </Text>}
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1C0A04',
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#666666',
    textAlign: 'center',
    marginBottom: 28,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  emailPillText: {
    flex: 1,
    color: '#AAAAAA',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  changeText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  fields: {
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 12,
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
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
});
