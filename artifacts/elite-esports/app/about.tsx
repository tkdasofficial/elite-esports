import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';

const APP_VERSION = '1.0.0 Alpha';
const SUPPORT_EMAIL = 'support@eliteesports.in';

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
    icon: 'mail-outline' as const,
    label: 'Contact Support',
    onPress: () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`),
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

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
            colors={['#280800', '#1A0500']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroLogoCircle}>
            <Ionicons name="flash" size={40} color={Colors.primary} />
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
        <Text style={styles.sectionLabel}>About the App</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Elite eSports is a professional competitive gaming platform designed for Indian eSports
            players. Join tournaments, track live matches, climb leaderboards, and earn real prize
            money directly to your wallet — all in one place.
          </Text>
          <Text style={[styles.description, { marginTop: 12 }]}>
            Built for mobile-first with a focus on speed, reliability, and a premium experience.
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
                  <Ionicons name={f.icon as any} size={17} color={Colors.primary} />
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
                <Ionicons name={p.icon as any} size={22} color={Colors.text.secondary} />
                <Text style={styles.platformLabel}>{p.label}</Text>
                <Text style={[
                  styles.platformStatus,
                  p.status === 'Supported' && { color: Colors.status.success },
                  p.status === 'Coming Soon' && { color: Colors.text.muted },
                  p.status === 'Preview' && { color: '#3B82F6' },
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
                  <Ionicons name={l.icon} size={17} color={Colors.primary} />
                </View>
                <Text style={styles.linkLabel}>{l.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={Colors.text.muted} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 16 },

  /* Hero */
  heroBanner: {
    borderRadius: 20, overflow: 'hidden',
    alignItems: 'center', paddingVertical: 32,
    marginBottom: 24,
    borderWidth: 1, borderColor: '#3A1200',
  },
  heroLogoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#1C0500',
    borderWidth: 2, borderColor: '#4A1800',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroName: {
    fontSize: 28, fontFamily: 'Inter_700Bold',
    color: '#FFFFFF', letterSpacing: -0.5,
    textAlign: 'center', marginBottom: 4,
  },
  heroAccent: { color: Colors.primary },
  heroTagline: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    color: '#666666', letterSpacing: 0.5,
    textAlign: 'center', marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: 'rgba(254,76,17,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(254,76,17,0.3)',
  },
  versionBadgeText: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary,
  },

  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },

  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden', marginBottom: 20,
  },

  description: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary, lineHeight: 22,
    padding: 16,
  },

  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  featureDivider: {
    height: 1, backgroundColor: Colors.border.subtle,
    marginLeft: 14 + 36 + 12,
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureText: {
    flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.primary,
  },

  /* Platform grid */
  platformGrid: {
    flexDirection: 'row', padding: 16, gap: 8,
  },
  platformItem: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: Colors.background.elevated,
    borderRadius: 12, padding: 14,
  },
  platformLabel: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary,
  },
  platformStatus: {
    fontSize: 11, fontFamily: 'Inter_500Medium',
  },

  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  linkLabel: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text.primary,
  },

  footer: {
    alignItems: 'center', gap: 4, marginTop: 8,
  },
  footerText: {
    fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.muted,
  },
  footerCopy: {
    fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted,
  },
});
