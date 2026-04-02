import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { AppColors } from '@/utils/colors';

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: 'Elite eSports ("we", "us", or "our") is committed to protecting the personal information of our users. This Privacy Policy explains what data we collect, how we use it, how we protect it, and your rights as a user. By using the Elite eSports application ("App"), you consent to the practices described in this Policy.',
  },
  {
    heading: '2. Information We Collect',
    body: 'We collect the following categories of information:\n\n(a) Account Information: Your name, username, email address, and password when you register.\n(b) Profile Information: Avatar, in-game usernames, and any other profile details you voluntarily provide.\n(c) Financial Information: Transaction amounts, UTR numbers, and payment status records. Payment card or UPI details are processed exclusively by our authorised payment partners and are never stored on our servers.\n(d) Device Information: Device model, operating system, unique device identifiers, and app version.\n(e) Usage Data: Pages visited, features used, match history, session duration, and interaction logs.\n(f) Communications: Messages you send to our support team.',
  },
  {
    heading: '3. How We Use Your Information',
    body: 'We use your information for the following purposes:\n\n(a) To create and manage your account and provide Platform services.\n(b) To process match entry fees, prize distributions, deposits, and withdrawals.\n(c) To verify your identity and comply with KYC/AML regulations where applicable.\n(d) To detect, prevent, and investigate fraud, cheating, and abuse.\n(e) To send transactional emails (via no-reply.eliteesports@outlook.com) such as account confirmations, payment receipts, and security alerts.\n(f) To send support replies and service communications (via help.eliteesports@outlook.com).\n(g) To analyse usage patterns and improve the App.\n(h) To comply with applicable Indian laws and legal obligations.',
  },
  {
    heading: '4. Communication Policy',
    body: 'By creating an account, you agree to receive the following communications:\n\n(a) System notifications sent from no-reply.eliteesports@outlook.com — these include account verifications, OTPs, payment confirmations, match results, and security alerts. These are essential service communications and cannot be opted out of while your account is active.\n(b) Support responses sent from help.eliteesports@outlook.com in reply to your queries.\n\nYou may contact our support team at help.eliteesports@outlook.com for any communication preferences or concerns.',
  },
  {
    heading: '5. Sharing of Information',
    body: 'We do not sell, rent, or trade your personal information to any third parties for marketing purposes. We may share your information only in the following circumstances:\n\n(a) With trusted service providers (e.g., payment gateways, cloud infrastructure) who assist in Platform operations, subject to strict confidentiality obligations.\n(b) With law enforcement or regulatory authorities when required by law, court order, or government directive under Indian law.\n(c) In connection with a merger, acquisition, or sale of assets, where the acquiring entity agrees to honour this Privacy Policy.',
  },
  {
    heading: '6. Data Retention',
    body: 'We retain your personal data for as long as your account remains active or as necessary to provide Platform services and comply with legal obligations. Upon account deletion, we will remove or anonymise your personal data within 30 days, except where retention is required by law (e.g., financial transaction records). You may request deletion of your account and data by writing to help.eliteesports@outlook.com.',
  },
  {
    heading: '7. Data Security',
    body: 'We implement industry-standard security measures to protect your personal data, including:\n\n(a) TLS/HTTPS encryption for all data transmitted between your device and our servers.\n(b) Secure password hashing (bcrypt or equivalent).\n(c) Role-based access control to limit internal data access.\n(d) Regular security reviews and monitoring.\n\nHowever, no method of transmission over the internet or method of electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. In the event of a data breach that affects your rights, we will notify you as required by applicable law.',
  },
  {
    heading: '8. Children\'s Privacy',
    body: 'The paid features of the Platform (match entry, financial transactions) are strictly restricted to users aged 18 and above. The Platform\'s general features require users to be at least 13 years old. We do not knowingly collect personal information from children under 13. If we become aware that a user under 13 has provided us with personal information without verifiable parental consent, we will delete that information promptly. Parents or guardians who believe their child has registered without consent should contact us at help.eliteesports@outlook.com.',
  },
  {
    heading: '9. Cookies & Tracking Technologies',
    body: 'Our App may use cookies, local storage, and similar tracking technologies to maintain your session, remember preferences, and analyse usage. On mobile, we may use device identifiers for analytics and fraud prevention. You can clear app data or local storage through your device settings, though this may affect App functionality.',
  },
  {
    heading: '10. Your Rights Under Indian Law',
    body: 'In accordance with applicable Indian data protection regulations, you have the right to:\n\n(a) Access the personal information we hold about you.\n(b) Correct inaccurate or incomplete personal information.\n(c) Request deletion of your personal data (subject to legal retention requirements).\n(d) Withdraw consent for non-essential data processing.\n\nTo exercise any of these rights, please contact us at help.eliteesports@outlook.com. We will respond to your request within 30 days.',
  },
  {
    heading: '11. Third-Party Links & Services',
    body: 'The App may contain links to third-party websites or integrate third-party services (e.g., payment gateways). These third parties have their own privacy policies, and we are not responsible for their practices. We encourage you to review the privacy policies of any third-party services you use.',
  },
  {
    heading: '12. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes via in-app notification or an email to your registered address from no-reply.eliteesports@outlook.com. Your continued use of the App after such notification constitutes acceptance of the updated Policy.',
  },
  {
    heading: '13. Contact Us',
    body: 'If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:\n\nElite eSports\nSupport: help.eliteesports@outlook.com\nSystem: no-reply.eliteesports@outlook.com\nCountry: India',
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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
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
