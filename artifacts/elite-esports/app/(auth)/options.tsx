import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { Colors } from '@/utils/colors';

WebBrowser.maybeCompleteAuthSession();

type Provider = 'google' | 'github' | 'facebook';

const SOCIAL = [
  {
    id: 'google' as Provider,
    label: 'Continue with Google',
    icon: 'logo-google' as const,
    bg: '#FFFFFF',
    text: '#1A1A1A',
    border: '#E0E0E0',
  },
  {
    id: 'github' as Provider,
    label: 'Continue with GitHub',
    icon: 'logo-github' as const,
    bg: '#24292E',
    text: '#FFFFFF',
    border: '#3A3F44',
  },
  {
    id: 'facebook' as Provider,
    label: 'Continue with Facebook',
    icon: 'logo-facebook' as const,
    bg: '#1877F2',
    text: '#FFFFFF',
    border: '#1877F2',
  },
];

export default function AuthOptionsScreen() {
  const insets = useSafeAreaInsets();
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const handleSocialAuth = async (provider: Provider) => {
    setLoadingProvider(provider);
    try {
      const redirectUrl = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
          if (sessionError) throw sessionError;
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#140400', '#0A0A0A', '#0A0A0A']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: topPad + 32, paddingBottom: bottomPad + 24 }]}>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="flash" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>
            Elite <Text style={styles.accent}>eSports</Text>
          </Text>
          <Text style={styles.tagline}>Compete. Win. Dominate.</Text>
        </View>

        {/* Heading */}
        <View style={styles.headingArea}>
          <Text style={styles.heading}>Get started</Text>
          <Text style={styles.sub}>Choose how you want to sign in</Text>
        </View>

        {/* Social buttons */}
        <View style={styles.socialList}>
          {SOCIAL.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.socialBtn, { backgroundColor: s.bg, borderColor: s.border }]}
              onPress={() => handleSocialAuth(s.id)}
              disabled={loadingProvider !== null}
              activeOpacity={0.85}
            >
              {loadingProvider === s.id ? (
                <ActivityIndicator color={s.text} size="small" />
              ) : (
                <Ionicons name={s.icon} size={20} color={s.text} style={styles.socialIcon} />
              )}
              <Text style={[styles.socialLabel, { color: s.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email button */}
        <TouchableOpacity
          style={styles.emailBtn}
          onPress={() => router.push('/(auth)/email-auth')}
          activeOpacity={0.85}
        >
          <Ionicons name="mail-outline" size={20} color={Colors.primary} style={styles.socialIcon} />
          <Text style={styles.emailLabel}>Continue with Email</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#1A0500',
    borderWidth: 1.5,
    borderColor: '#4A1800',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  accent: { color: Colors.primary },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#555555',
    letterSpacing: 0.4,
  },
  headingArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heading: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666666',
  },
  socialList: {
    gap: 12,
    marginBottom: 20,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222222',
  },
  dividerText: {
    color: '#555555',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: Colors.primary + '55',
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  emailLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#444444',
    lineHeight: 18,
  },
  termsLink: {
    color: '#666666',
    fontFamily: 'Inter_500Medium',
  },
});
