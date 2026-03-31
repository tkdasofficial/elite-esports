import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { AppColors } from '@/utils/colors';

const SECTIONS = [
  {
    heading: '1. Information We Collect',
    body: 'We collect information you provide directly to us when you create an account, participate in tournaments, or contact support. This includes your name, email address, mobile number, and payment information. We also automatically collect device information, IP address, and usage data.',
  },
  {
    heading: '2. How We Use Your Information',
    body: 'We use your information to: (a) provide, maintain, and improve the App; (b) process transactions and send related information; (c) send promotional communications (with your consent); (d) monitor and analyse usage patterns; and (e) comply with legal obligations.',
  },
  {
    heading: '3. Sharing of Information',
    body: 'We do not sell your personal information. We may share your information with trusted third-party service providers who assist us in operating the App (e.g., payment processors, cloud hosting). All third parties are obligated to maintain the confidentiality of your information.',
  },
  {
    heading: '4. Payment Data',
    body: 'Payment card details and UPI information are processed by our payment gateway partners and are never stored on our servers. We store only transaction metadata (amount, timestamp, status) for record-keeping purposes.',
  },
  {
    heading: '5. Data Retention',
    body: 'We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting support@eliteesports.gg.',
  },
  {
    heading: '6. Security',
    body: 'We implement industry-standard security measures including TLS encryption, secure password hashing, and regular security audits to protect your personal information. However, no method of transmission over the internet is 100% secure.',
  },
  {
    heading: '7. Cookies & Tracking',
    body: 'Our App may use cookies and similar tracking technologies to enhance your experience. You can instruct your browser or device to refuse all cookies, though some features of the App may not function properly as a result.',
  },
  {
    heading: '8. Children\'s Privacy',
    body: 'The App is not directed at children under 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided personal information, we will delete it promptly.',
  },
  {
    heading: '9. Your Rights',
    body: 'Under applicable Indian data protection law, you have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at privacy@eliteesports.gg. We will respond within 30 days.',
  },
  {
    heading: '10. Changes to This Policy',
    body: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or in-app notification. Continued use of the App after changes constitutes acceptance of the revised policy.',
  },
  {
    heading: '11. Contact Us',
    body: 'If you have any questions about this Privacy Policy, please contact us at:\n\nElite eSports Pvt. Ltd.\nprivacy@eliteesports.gg\nBengaluru, Karnataka, India',
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Privacy Policy" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>
        {SECTIONS.map(s => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 20 },
    lastUpdated: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
      marginBottom: 24,
    },
    section: { marginBottom: 24 },
    heading: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    body: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: colors.text.secondary,
      lineHeight: 22,
    },
  });
}
