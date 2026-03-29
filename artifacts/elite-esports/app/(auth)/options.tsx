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
    border: '#DDDDDD',
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
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
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
        colors={['#150400', '#0A0A0A', '#0A0A0A']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}>

        {/* ── Brand ── */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="flash" size={34} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>
            Elite <Text style={styles.accent}>eSports</Text>
          </Text>
          <Text style={styles.tagline}>Compete. Win. Dominate.</Text>
        </View>

        {/* ── Heading ── */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Get started</Text>
          <Text style={styles.sub}>Sign in or create your account</Text>
        </View>

        {/* ── Social buttons ── */}
        <View style={styles.btnList}>
          {SOCIAL.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.socialBtn, { backgroundColor: s.bg, borderColor: s.border }]}
              onPress={() => handleSocialAuth(s.id)}
              disabled={loadingProvider !== null}
              activeOpacity={0.85}
            >
              {/* Icon pinned left — text stays centered */}
              <View style={styles.btnIconSlot}>
                {loadingProvider === s.id
                  ? <ActivityIndicator color={s.text} size="small" />
                  : <Ionicons name={s.icon} size={19} color={s.text} />}
              </View>
              <Text style={[styles.btnLabel, { color: s.text }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Email button ── */}
        <TouchableOpacity
          style={styles.emailBtn}
          onPress={() => router.push('/(auth)/email-auth')}
          activeOpacity={0.85}
        >
          <View style={styles.btnIconSlot}>
            <Ionicons name="mail-outline" size={19} color={Colors.primary} />
          </View>
          <Text style={styles.emailBtnLabel}>Continue with Email</Text>
        </TouchableOpacity>

        {/* ── Terms ── */}
        <Text style={styles.terms}>
          By continuing, you agree to our{'\n'}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {'  ·  '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

      </View>
    </View>
  );
}

const BTN_HEIGHT = 54;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: 'center',
    gap: 0,
  },

  /* Brand */
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#1A0500',
    borderWidth: 1.5,
    borderColor: '#4A1800',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 4,
  },
  accent: { color: Colors.primary },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#555555',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  /* Heading */
  headingBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#606060',
    textAlign: 'center',
  },

  /* Buttons */
  btnList: {
    gap: 11,
    marginBottom: 20,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: BTN_HEIGHT,
    borderRadius: BTN_HEIGHT / 2,
    borderWidth: 1,
    position: 'relative',
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: BTN_HEIGHT,
    borderRadius: BTN_HEIGHT / 2,
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
    position: 'relative',
    marginBottom: 24,
  },
  /* Fixed-width slot pinned to the left — keeps label centered */
  btnIconSlot: {
    position: 'absolute',
    left: 20,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  emailBtnLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    textAlign: 'center',
  },

  /* Divider */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#202020',
  },
  dividerText: {
    color: '#484848',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },

  /* Terms */
  terms: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#3A3A3A',
    lineHeight: 20,
  },
  termsLink: {
    color: '#585858',
    fontFamily: 'Inter_500Medium',
  },
});
