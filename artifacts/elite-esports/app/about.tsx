import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppConfig } from '@/hooks/useAppConfig';
import type { AppColors } from '@/utils/colors';

const APP_VERSION = '2.5.0';

const FEATURES = [
  { icon: 'trophy-outline',           text: 'Daily & weekly competitive tournaments' },
  { icon: 'pulse-outline',            text: 'Live match tracking & real-time leaderboards' },
  { icon: 'wallet-outline',           text: 'Instant wallet & prize payouts in ₹ INR' },
  { icon: 'people-outline',           text: 'Team management & player profiles' },
  { icon: 'notifications-outline',    text: 'Real-time match, prize & reward alerts' },
  { icon: 'game-controller-outline',  text: 'BGMI, Free Fire & more games supported' },
  { icon: 'podium-outline',           text: 'Skill-based ranking & points system' },
  { icon: 'shield-checkmark-outline', text: 'Secure & verified accounts' },
];

const LEGAL_LINKS = [
  { icon: 'document-text-outline' as const, label: 'Terms & Conditions', route: '/terms' },
  { icon: 'shield-checkmark-outline' as const, label: 'Privacy Policy',   route: '/privacy' },
  { icon: 'warning-outline' as const,          label: 'Disclaimer',        route: '/disclaimer' },
];

/* ── Social platform config ── */
const SOCIAL_PLATFORMS = [
  { key: 'youtube_url',   icon: 'logo-youtube',   label: 'YouTube',   bg: '#FF0000', fg: '#fff' },
  { key: 'facebook_url',  icon: 'logo-facebook',  label: 'Facebook',  bg: '#1877F2', fg: '#fff' },
  { key: 'instagram_url', icon: 'logo-instagram', label: 'Instagram', bg: '#E1306C', fg: '#fff' },
  { key: 'twitch_url',    icon: 'logo-twitch',    label: 'Twitch',    bg: '#9146FF', fg: '#fff' },
  { key: 'twitter_url',   icon: 'logo-twitter',   label: 'X',         bg: '#000000', fg: '#fff' },
  { key: 'snapchat_url',  icon: 'logo-snapchat',  label: 'Snapchat',  bg: '#FFFC00', fg: '#000' },
  { key: 'linkedin_url',  icon: 'logo-linkedin',  label: 'LinkedIn',  bg: '#0A66C2', fg: '#fff' },
] as const;

/* ── Contact email config ── */
const EMAIL_TYPES = [
  { key: 'support_email',  icon: 'headset-outline' as const,  label: 'Support',  sub: 'Technical help & account issues' },
  { key: 'queries_email',  icon: 'chatbox-outline' as const,  label: 'Queries',  sub: 'General questions & feedback' },
  { key: 'legal_email',    icon: 'briefcase-outline' as const, label: 'Legal',   sub: 'Legal, compliance & GDPR' },
] as const;

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { config, loading } = useAppConfig();

  const heroBannerGradient: [string, string] = isDark
    ? ['#280800', '#1A0500']
    : [colors.primary + 'CC', colors.primaryDark];

  const activeSocials = SOCIAL_PLATFORMS.filter(p => !!(config as any)[p.key]);
  const activeEmails  = EMAIL_TYPES.filter(e => !!(config as any)[e.key]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="About" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero banner ── */}
        <View style={styles.heroBanner}>
          <LinearGradient colors={heroBannerGradient} style={StyleSheet.absoluteFill} />
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
            Elite eSports is India's premier skill-based competitive gaming platform — built for
            players who compete to win. Join thousands of gamers in daily and weekly tournaments
            across BGMI, Free Fire, and more, with real cash prizes paid directly to your wallet.
          </Text>
          <Text style={[styles.description, { marginTop: 0 }]}>
            Every match on Elite eSports is 100% skill-based, governed by strict fair-play rules,
            and powered by a transparent points and ranking system. We're here to give every player
            a legitimate stage to prove their skill and earn from it.
          </Text>
        </View>

        {/* ── Mission ── */}
        <Text style={styles.sectionLabel}>Our Mission</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Our mission is to build India's most trusted competitive gaming ecosystem — where skill
            is rewarded, every rupee won is earned fairly, and every player has an equal opportunity
            to rise. From first-time competitors to seasoned pros, Elite eSports is your arena.
          </Text>
        </View>

        {/* ── What's Inside ── */}
        <Text style={styles.sectionLabel}>What's Inside</Text>
        <View style={styles.card}>
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.icon}>
              {i > 0 && <View style={styles.rowDivider} />}
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={17} color={colors.primary} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Contact Us ── */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : activeEmails.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Contact Us</Text>
            <View style={styles.card}>
              {activeEmails.map((e, i) => {
                const email = (config as any)[e.key] as string;
                return (
                  <React.Fragment key={e.key}>
                    {i > 0 && <View style={styles.rowDivider} />}
                    <TouchableOpacity
                      style={styles.emailRow}
                      onPress={() => Linking.openURL(`mailto:${email}`)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.emailIcon}>
                        <Ionicons name={e.icon} size={17} color={colors.primary} />
                      </View>
                      <View style={styles.emailTextWrap}>
                        <Text style={styles.emailLabel}>{e.label}</Text>
                        <Text style={styles.emailSub}>{e.sub}</Text>
                        <Text style={styles.emailAddress}>{email}</Text>
                      </View>
                      <Ionicons name="open-outline" size={15} color={colors.text.muted} />
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </>
        ) : null}

        {/* ── Follow Us (Social) ── */}
        {!loading && activeSocials.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Follow Us</Text>
            <View style={styles.socialGrid}>
              {activeSocials.map(p => {
                const url = (config as any)[p.key] as string;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.socialBtn, { backgroundColor: p.bg }]}
                    onPress={() => Linking.openURL(url)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={p.icon as any} size={24} color={p.fg} />
                    <Text style={[styles.socialLabel, { color: p.fg }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── Legal & Support ── */}
        <Text style={styles.sectionLabel}>Legal & Support</Text>
        <View style={styles.card}>
          {LEGAL_LINKS.map((l, i) => (
            <React.Fragment key={l.label}>
              {i > 0 && <View style={styles.rowDivider} />}
              <TouchableOpacity
                style={styles.featureRow}
                onPress={() => router.push(l.route as any)}
                activeOpacity={0.75}
              >
                <View style={styles.featureIcon}>
                  <Ionicons name={l.icon} size={17} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { fontFamily: 'Inter_500Medium' }]}>{l.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.text.muted} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* ── Platform ── */}
        <Text style={styles.sectionLabel}>Platform</Text>
        <View style={styles.card}>
          <View style={styles.platformGrid}>
            {[
              { icon: 'logo-android', label: 'Android', status: 'Supported',   statusColor: '#22C55E' },
              { icon: 'logo-apple',   label: 'iOS',     status: 'Coming Soon', statusColor: '#666' },
              { icon: 'globe-outline',label: 'Web',     status: 'Preview',     statusColor: '#3B82F6' },
            ].map(p => (
              <View key={p.label} style={styles.platformItem}>
                <Ionicons name={p.icon as any} size={22} color={colors.text.secondary} />
                <Text style={styles.platformLabel}>{p.label}</Text>
                <Text style={[styles.platformStatus, { color: p.statusColor }]}>{p.status}</Text>
              </View>
            ))}
          </View>
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

    rowDivider: {
      height: 1, backgroundColor: colors.border.subtle,
      marginLeft: 62,
    },
    featureRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingHorizontal: 14, paddingVertical: 13,
    },
    featureIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    featureText: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.primary,
    },

    /* Email rows */
    emailRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingHorizontal: 14, paddingVertical: 14,
    },
    emailIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary + '18',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    emailTextWrap: { flex: 1 },
    emailLabel: {
      fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary, marginBottom: 1,
    },
    emailSub: {
      fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginBottom: 3,
    },
    emailAddress: {
      fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.primary,
    },

    /* Social grid */
    socialGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
    },
    socialBtn: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center', justifyContent: 'center',
      gap: 7,
      minWidth: '20%',
      flex: 1,
    },
    socialLabel: {
      fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.2,
    },

    /* Platform */
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

    /* Footer */
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
