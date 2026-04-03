import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';
import { navigateAfterAuth } from '@/utils/authHelpers';

WebBrowser.maybeCompleteAuthSession();

export default function AuthOptionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const topPad = insets.top;
  const bottomPad = insets.bottom;

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  const handleGoogleAuth = async () => {
    setLoadingGoogle(true);
    try {
      const redirectUrl = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
          if (sessionError) throw sessionError;
          const userId = sessionData?.session?.user?.id;
          if (userId) {
            await navigateAfterAuth(userId);
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}>

        {/* ── Brand ── */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="flash" size={34} color={colors.primary} />
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

        {/* ── Google Button ── */}
        <View style={styles.btnList}>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: '#FFFFFF', borderColor: '#DDDDDD' }]}
            onPress={handleGoogleAuth}
            disabled={loadingGoogle}
            activeOpacity={0.85}
          >
            <View style={styles.btnIconSlot}>
              {loadingGoogle
                ? <ActivityIndicator size="small" color="#1A1A1A" />
                : <Ionicons name="logo-google" size={19} color="#1A1A1A" />
              }
            </View>
            <Text style={[styles.btnLabel, { color: '#1A1A1A' }]}>Continue with Google</Text>
          </TouchableOpacity>
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
            <Ionicons name="mail-outline" size={19} color={colors.primary} />
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },

    content: {
      flex: 1,
      paddingHorizontal: 25,
      justifyContent: 'center',
      gap: 0,
    },

    brand: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoCircle: {
      width: 68,
      height: 68,
      borderRadius: 20,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5,
      borderColor: colors.primary + '44',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    appName: {
      fontSize: 24,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
      letterSpacing: -0.4,
      textAlign: 'center',
      marginBottom: 4,
    },
    accent: { color: colors.primary },
    tagline: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
      letterSpacing: 0.5,
      textAlign: 'center',
    },

    headingBlock: {
      alignItems: 'center',
      marginBottom: 24,
    },
    heading: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 5,
    },
    sub: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.text.secondary,
      textAlign: 'center',
    },

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
      borderColor: colors.primary + '50',
      backgroundColor: colors.background.elevated,
      position: 'relative',
      marginBottom: 24,
    },
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
      color: colors.primary,
      textAlign: 'center',
    },

    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border.default,
    },
    dividerText: {
      color: colors.text.muted,
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
    },

    terms: {
      textAlign: 'center',
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
      lineHeight: 20,
    },
    termsLink: {
      color: colors.text.secondary,
      fontFamily: 'Inter_500Medium',
    },
  });
}
