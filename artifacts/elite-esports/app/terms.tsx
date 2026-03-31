import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { AppColors } from '@/utils/colors';

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By downloading, registering, or using the Elite eSports application ("App"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the App.',
  },
  {
    heading: '2. Eligibility',
    body: 'You must be at least 18 years of age to participate in paid tournaments or conduct any financial transactions within the App. By using the App, you represent and warrant that you meet this eligibility requirement.',
  },
  {
    heading: '3. Account Responsibility',
    body: 'You are solely responsible for maintaining the confidentiality of your account credentials. Any activity that occurs under your account is your responsibility. Notify us immediately at support@eliteesports.gg if you suspect unauthorized use.',
  },
  {
    heading: '4. Tournaments & Fair Play',
    body: 'All users must play fairly and ethically. Cheating, exploitation of bugs, collusion, or any form of unsportsmanlike conduct is strictly prohibited and may result in permanent account suspension and forfeiture of winnings.',
  },
  {
    heading: '5. Wallet & Transactions',
    body: 'Funds deposited to your in-app wallet are denominated in Indian Rupees (₹). Deposits are non-refundable except as required by law. Withdrawals are subject to identity verification and processing times of 2–5 business days.',
  },
  {
    heading: '6. Prohibited Activities',
    body: 'You agree not to: (a) use the App for any unlawful purpose; (b) attempt to gain unauthorized access to any part of the App; (c) create multiple accounts to gain an unfair advantage; or (d) engage in money laundering or fraud.',
  },
  {
    heading: '7. Intellectual Property',
    body: 'All content within the App, including logos, designs, text, graphics, and software, is the property of Elite eSports or its licensors. You may not reproduce, distribute, or create derivative works without prior written consent.',
  },
  {
    heading: '8. Limitation of Liability',
    body: 'To the fullest extent permitted by law, Elite eSports shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, including loss of winnings or data.',
  },
  {
    heading: '9. Modifications',
    body: 'We reserve the right to update these Terms at any time. Continued use of the App following notification of changes constitutes your acceptance of the revised Terms.',
  },
  {
    heading: '10. Governing Law',
    body: 'These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka.',
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Terms & Conditions" />
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
