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
import { AuthLogo } from '@/features/auth/components/AuthLogo';
import { AuthInput } from '@/features/auth/components/AuthInput';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login Failed', error.message);
    else router.replace('/(tabs)');
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
          <AuthLogo />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

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
                placeholder="Enter your password"
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
          </View>

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
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#202020',
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
    marginBottom: 28,
  },
  fields: {
    marginBottom: 8,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
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
