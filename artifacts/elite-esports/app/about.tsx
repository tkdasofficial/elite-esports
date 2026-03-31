import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { AppColors } from '@/utils/colors';

const APP_VERSION = '1.0.0 Alpha';
const SUPPORT_EMAIL = 'help.eliteesports@outlook.com';

const FEATURES = [
  { icon: 'trophy-outline',          text: 'Competitive eSports tournaments' },
  { icon: 'pulse-outline',           text: 'Live match tracking & leaderboards' },
  { icon: 'wallet-outline',          text: 'Wallet & prize payouts in ₹ INR' },
  { icon: 'people-outline',          text: 'Team management & player profiles' },
  { icon: 'notifications-outline',   text: 'Real-time match & reward alerts' },
  { icon: 'shield-checkmark-outline',text: 'Secure accounts via Supabase Auth' },
];

const LINKS = [
  {
    icon: 'document-text-outline' as const,
    label: 'Terms & Conditions',
    onPress: (push: (r: any) => void) => push('/terms'),
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Privacy Policy',
    onPress: (push: (r: any) => void) => push('/privacy'),
  },
  {
    icon: 'warning-outline' as const,
    label: 'Disclaimer',
    onPress: (push: (r: any) => void) => push('/disclaimer'),
  },
  {
    icon: 'mail-outline' as const,
    label: 'Contact Support',
    onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const heroBannerGradient: [string, string] = isDark
    ? ['#280800', '#1A0500']
    : [colors.primary + 'CC', colors.primaryDark];

  return (
    <View style={styles.container}>
      <ScreenHeader title="About" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero banner ── */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={heroBannerGradient}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroLogoCircle}>
            <Ionicons name="flash" size={40} color={isDark ? colors.primary : '#fff'} />
          </View>
          <Text style={styles.heroName}>
            Elite <Text style={styles.heroAccent}>eSports</Text>
          </Text>
          <Text style={styles.heroTagline}>Compete. Win. Dominate.</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* ── About ── */}
        <Text style={styles.sectionLabel}>About Us</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Elite eSports is an Indian skill-based competitive gaming platform that empowers players
            to compete in real-money tournaments and win rewards based entirely on their skill and
            in-game performance.
          </Text>
          <Text style={[styles.description, { marginTop: 0 }]}>
            We are dedicated to building a fair, transparent, and professional eSports ecosystem for
            the Indian gaming community. Every match on our platform is governed by strict fair-play
            rules, and every rupee won is a result of pure player skill.
          </Text>
        </View>

        {/* ── Mission ── */}
        <Text style={styles.sectionLabel}>Our Mission</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Our mission is to provide a world-class competitive gaming experience to Indian eSports
            enthusiasts — from casual players to aspiring professionals. We believe talent deserves
            recognition and reward, regardless of background.
          </Text>
        </View>

        {/* ── Key Features ── */}
        <Text style={styles.sectionLabel}>What's Inside</Text>
        <View style={styles.card}>
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.icon}>
              {i > 0 && <View style={styles.featureDivider} />}
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={17} color={colors.primary} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Platform ── */}
        <Text style={styles.sectionLabel}>Platform</Text>
        <View style={styles.card}>
          <View style={styles.platformGrid}>
            {[
              { icon: 'logo-android', label: 'Android', status: 'Supported' },
              { icon: 'logo-apple',   label: 'iOS',     status: 'Coming Soon' },
              { icon: 'globe-outline',label: 'Web',     status: 'Preview' },
            ].map(p => (
              <View key={p.label} style={styles.platformItem}>
                <Ionicons name={p.icon as any} size={22} color={colors.text.secondary} />
                <Text style={styles.platformLabel}>{p.label}</Text>
                <Text style={[
                  styles.platformStatus,
                  p.status === 'Supported' && { color: colors.status.success },
                  p.status === 'Coming Soon' && { color: colors.text.muted },
                  p.status === 'Preview' && { color: colors.status.info },
                ]}>
                  {p.status}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Links ── */}
        <Text style={styles.sectionLabel}>Legal & Support</Text>
        <View style={styles.card}>
          {LINKS.map((l, i) => (
            <React.Fragment key={l.label}>
              {i > 0 && <View style={styles.featureDivider} />}
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => l.onPress(router.push)}
                activeOpacity={0.75}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name={l.icon} size={17} color={colors.primary} />
                </View>
                <Text style={styles.linkLabel}>{l.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.text.muted} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for Indian eSports</Text>
          <Text style={styles.footerCopy}>© {new Date().getFullYear()} Elite eSports. All rights reserved.</Text>
        </View>

      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 16 },

    heroBanner: {
      borderRadius: 20, overflow: 'hidden',
      alignItems: 'center', paddingVertical: 32,
      marginBottom: 24,
      borderWidth: 1, borderColor: colors.primary + '44',
    },
    heroLogoCircle: {
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 16,
    },
    heroName: {
      fontSize: 28, fontFamily: 'Inter_700Bold',
      color: '#fff', letterSpacing: -0.5,
      textAlign: 'center', marginBottom: 4,
    },
    heroAccent: { color: '#fff' },
    heroTagline: {
      fontSize: 13, fontFamily: 'Inter_400Regular',
      color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5,
      textAlign: 'center', marginBottom: 16,
    },
    versionBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    },
    versionBadgeText: {
      fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff',
    },

    sectionLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 8, marginLeft: 4,
    },

    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16, borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden', marginBottom: 20,
    },

    description: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, lineHeight: 22,
      padding: 16,
    },

    featureRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingHorizontal: 14, paddingVertical: 12,
    },
    featureDivider: {
      height: 1, backgroundColor: colors.border.subtle,
      marginLeft: 14 + 36 + 12,
    },
    featureIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    featureText: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.primary,
    },

    platformGrid: {
      flexDirection: 'row', padding: 16, gap: 8,
    },
    platformItem: {
      flex: 1, alignItems: 'center', gap: 6,
      backgroundColor: colors.background.elevated,
      borderRadius: 12, padding: 14,
    },
    platformLabel: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text.primary,
    },
    platformStatus: {
      fontSize: 11, fontFamily: 'Inter_500Medium',
    },

    linkRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingHorizontal: 14, paddingVertical: 14,
    },
    linkLabel: {
      flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text.primary,
    },

    footer: {
      alignItems: 'center', gap: 4, marginTop: 8,
    },
    footerText: {
      fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.muted,
    },
    footerCopy: {
      fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted,
    },
  });
}
