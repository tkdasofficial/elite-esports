import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { Colors } from '@/utils/colors';
import { WEB_TOP_INSET, WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { AuthLogo } from '@/features/auth/components/AuthLogo';
import { AuthInput } from '@/features/auth/components/AuthInput';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? WEB_BOTTOM_INSET : 0);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
        Alert.alert('Login Failed', 'Incorrect email or password. Please check your details and try again.');
      } else if (msg.includes('email not confirmed')) {
        Alert.alert('Email Not Verified', 'Please verify your email before signing in. Check your inbox for the confirmation link.');
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#140400', '#0A0A0A', '#0A0A0A']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 24, paddingBottom: bottomPad + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthLogo showName={false} />

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.fields}>
            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              iconName="mail-outline"
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              iconName="lock-closed-outline"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
              <Text style={styles.footerLink}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  fields: {
    gap: 16,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
