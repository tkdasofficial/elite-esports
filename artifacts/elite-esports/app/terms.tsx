import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { AppColors } from '@/utils/colors';

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By downloading, registering, or using the Elite eSports application ("App" or "Platform"), you ("User") agree to be fully bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you must immediately cease use of the App. Your continued use of the App constitutes your ongoing acceptance of these Terms, including any revisions made from time to time.',
  },
  {
    heading: '2. Eligibility & Age Restriction',
    body: 'You must be at least 18 years of age to register, participate in paid matches, or conduct any financial transactions on the Platform. Users between the ages of 13 and 17 may use limited non-financial features only with verifiable parental or guardian consent. By creating an account, you represent and warrant that you are legally eligible to enter into a binding agreement under Indian law and that all information you provide is accurate and truthful.',
  },
  {
    heading: '3. Nature of the Platform — Skill-Based Gaming',
    body: 'Elite eSports is strictly a skill-based competitive gaming platform. All matches and tournaments hosted on the Platform are determined by the skill, knowledge, strategy, and performance of participating players. The Platform does not constitute gambling, wagering, or betting of any kind under applicable Indian law, including the Public Gambling Act, 1867. Outcomes are not based on chance; they are based entirely on individual player skill and in-game performance metrics.',
  },
  {
    heading: '4. Account Registration & Responsibility',
    body: 'You are permitted to create only one account on the Platform. Creating multiple or duplicate accounts to gain an unfair advantage is strictly prohibited and will result in immediate permanent suspension of all associated accounts and forfeiture of any balances. You are solely responsible for maintaining the confidentiality of your account credentials. Any activity conducted under your account — whether authorised by you or not — is your responsibility. If you suspect unauthorised access to your account, notify us immediately at help.eliteesports@outlook.com.',
  },
  {
    heading: '5. User Responsibilities & Prohibited Conduct',
    body: 'As a user of the Platform, you agree not to:\n\n(a) Cheat, hack, use unauthorised third-party software, bots, scripts, or any tool that provides an unfair advantage.\n(b) Exploit bugs, glitches, or system errors for personal gain. Any such exploitation must be reported immediately.\n(c) Create fake, duplicate, or impersonation accounts.\n(d) Engage in match-fixing, collusion, or coordinated manipulation of results.\n(e) Use abusive, harassing, threatening, or offensive language towards other users or staff.\n(f) Upload, share, or transmit any content that is defamatory, obscene, or illegal under Indian law.\n(g) Attempt to reverse-engineer, decompile, or tamper with any part of the App.\n(h) Use the Platform for money laundering, fraud, or any other illegal financial activity.',
  },
  {
    heading: '6. Account Suspension & Termination',
    body: 'Elite eSports reserves the absolute right to suspend, restrict, or permanently terminate any account found to be in violation of these Terms, with or without prior notice, at its sole discretion. Upon termination for a violation, any wallet balance may be forfeited. Elite eSports is not liable for any losses arising from account suspension or termination due to policy violations. You may also request account deletion at any time by contacting help.eliteesports@outlook.com.',
  },
  {
    heading: '7. Wallet & Transactions',
    body: 'All funds in your in-app wallet are denominated in Indian Rupees (₹ INR). Deposits to the wallet are processed through our authorised payment partners. Deposits are non-refundable except as expressly required by applicable Indian law. You may use your wallet balance to pay entry fees for eligible matches and to receive prize winnings. The Platform reserves the right to hold or freeze wallet funds pending investigation of any suspected fraudulent activity.',
  },
  {
    heading: '8. Entry Fees & Prize Rewards',
    body: 'Matches on the Platform may require an entry fee, which is deducted from your wallet balance upon joining. Rewards and prizes are distributed based solely on match performance (rank, kills, and points as applicable). Rewards are subject to verification and may be withheld pending review if there is reasonable suspicion of rule violation or fraudulent conduct. Elite eSports reserves the right to adjust, withhold, or reverse rewards found to have been earned through misconduct.',
  },
  {
    heading: '9. Withdrawals',
    body: 'Withdrawal requests are subject to identity verification in compliance with applicable Indian regulations, including KYC (Know Your Customer) requirements. Withdrawals may be delayed by 2–7 business days due to payment processing and security checks. Minimum and maximum withdrawal limits apply as specified within the App. Elite eSports is not liable for delays caused by third-party payment processors, banking institutions, or government directives.',
  },
  {
    heading: '10. Fair Play & Anti-Fraud Policy',
    body: 'Elite eSports is committed to maintaining a fair and competitive environment. We employ automated and manual monitoring systems to detect cheating, abuse, and fraudulent activity. Any user found to be in breach of fair play standards will face immediate disqualification, account suspension, and/or permanent ban. Decisions made by Elite eSports regarding fair play violations are final. Users may appeal such decisions by writing to help.eliteesports@outlook.com within 7 days of the action.',
  },
  {
    heading: '11. Limitation of Liability',
    body: 'To the fullest extent permitted by applicable law, Elite eSports, its directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of winnings, loss of data, loss of revenue, or loss of goodwill, arising from:\n\n(a) Your use of or inability to use the App.\n(b) Unauthorised access to your account.\n(c) Technical outages, server downtime, or maintenance periods.\n(d) Actions, conduct, or content of third parties or other users.\n(e) Unforeseen technical issues beyond our reasonable control.\n\nElite eSports will, however, take reasonable and commercially practical measures to ensure the security, availability, and fair operation of the Platform.',
  },
  {
    heading: '12. Intellectual Property',
    body: 'All content on the Platform — including but not limited to logos, branding, interface design, graphics, text, software, and data — is the exclusive property of Elite eSports or its licensors and is protected under applicable Indian intellectual property laws. You may not reproduce, copy, distribute, modify, publicly display, or create derivative works of any Platform content without prior written consent from Elite eSports.',
  },
  {
    heading: '13. Dispute Resolution',
    body: 'In the event of any dispute arising from these Terms or your use of the Platform, you agree to first attempt resolution by contacting us at help.eliteesports@outlook.com. If the dispute is not resolved within 30 days, it shall be subject to binding arbitration under the Arbitration and Conciliation Act, 1996 (India). The seat of arbitration shall be in India. These Terms are governed by and construed in accordance with the laws of India.',
  },
  {
    heading: '14. Modifications to Terms',
    body: 'Elite eSports reserves the right to update or revise these Terms at any time. Users will be notified of material changes via in-app notification or email to the address registered on their account. Your continued use of the App after such notification constitutes acceptance of the revised Terms. It is your responsibility to review the Terms periodically.',
  },
  {
    heading: '15. Contact',
    body: 'For any questions, concerns, or clarifications regarding these Terms & Conditions, please contact:\n\nElite eSports\nSupport: help.eliteesports@outlook.com\nSystem: no-reply.eliteesports@outlook.com',
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
