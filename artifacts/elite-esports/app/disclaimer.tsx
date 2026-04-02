import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { AppColors } from '@/utils/colors';

const SECTIONS = [
  {
    heading: '1. General Disclaimer',
    body: 'The information, services, and features provided by Elite eSports ("Platform") are offered on an "as is" and "as available" basis. While we make every effort to ensure the accuracy, reliability, and continuous availability of the Platform, Elite eSports makes no warranties — express or implied — regarding the Platform\'s operation, content, or fitness for any particular purpose. Your use of the Platform is entirely at your own risk.',
  },
  {
    heading: '2. Skill-Based Platform — Not Gambling',
    body: 'Elite eSports is a skill-based competitive gaming platform. All matches and tournaments are determined by the individual skill, strategy, and performance of participating players. The Platform is not a gambling service, lottery, or game of chance and does not fall under the purview of gambling legislation in India, including the Public Gambling Act, 1867. Participation in paid matches constitutes an exercise of player skill and not a wager on chance.',
  },
  {
    heading: '3. No Guarantee of Winnings',
    body: 'Elite eSports does not guarantee any winnings, rewards, or prize money to any user. Rewards are distributed solely based on verified match performance (rank, kills, and points). The Platform is not responsible for any expectation of earnings or financial returns. Past performance in matches does not guarantee or indicate future results.',
  },
  {
    heading: '4. Payment & Rewards Disclaimer',
    body: 'All rewards and prize distributions are subject to verification before being credited to your wallet. Elite eSports reserves the right to:\n\n(a) Delay or withhold reward payouts pending investigation of suspected rule violations, cheating, or fraudulent activity.\n(b) Reverse or cancel rewards that were incorrectly distributed due to technical errors.\n(c) Adjust prize pools in the event of unforeseen circumstances, including but not limited to server failures, low participation, or force majeure events.\n\nWithdrawal of wallet funds may be delayed by 2–7 business days due to security verification and payment processing requirements.',
  },
  {
    heading: '5. Wallet & Transaction Disclaimer',
    body: 'Funds deposited into your Elite eSports wallet are for the exclusive purpose of participating in Platform matches and tournaments. Wallet balances:\n\n(a) Are non-transferable between accounts.\n(b) Cannot be exchanged for cash outside of the official withdrawal process.\n(c) May be held or frozen pending investigation if fraudulent activity is suspected.\n(d) Will be forfeited upon permanent account termination due to a policy violation.\n\nElite eSports is not a bank or financial institution. Wallet funds do not earn interest.',
  },
  {
    heading: '6. Technical & Service Disclaimer',
    body: 'Elite eSports does not guarantee uninterrupted, error-free, or completely secure access to the Platform at all times. The Platform may be temporarily unavailable due to:\n\n(a) Scheduled maintenance or updates.\n(b) Unforeseen technical failures, server outages, or third-party service disruptions.\n(c) Internet connectivity issues on the user\'s end.\n(d) Force majeure events such as natural disasters, government actions, or power outages.\n\nElite eSports will not be held liable for any losses — financial or otherwise — resulting from temporary service unavailability or technical errors beyond our reasonable control.',
  },
  {
    heading: '7. Limitation of Liability',
    body: 'To the maximum extent permitted by applicable Indian law, Elite eSports, its directors, officers, employees, partners, and agents shall not be liable for:\n\n(a) Any indirect, incidental, consequential, special, or punitive damages.\n(b) Loss of match winnings, wallet balance, data, or profits.\n(c) Losses arising from user misconduct, third-party actions, or events outside our control.\n(d) Any claims arising from reliance on information presented within the App.\n\nNotwithstanding the foregoing, Elite eSports is committed to taking reasonable and commercially practical steps to maintain the security, fairness, and integrity of the Platform.',
  },
  {
    heading: '8. User Conduct Disclaimer',
    body: 'Elite eSports is not responsible for the conduct, content, or actions of any user on the Platform. Users are solely responsible for their own actions, match conduct, and communications. Any disputes between users must be resolved independently or escalated to Elite eSports support at help.eliteesports@outlook.com for mediation. Elite eSports\' decision in user disputes is final and binding.',
  },
  {
    heading: '9. Third-Party Services',
    body: 'The Platform may integrate or link to third-party services including payment gateways, analytics providers, and advertising networks. Elite eSports is not responsible for the availability, accuracy, security, or practices of any third-party service. Your interactions with third-party services are governed by their own terms and privacy policies.',
  },
  {
    heading: '10. Regulatory Compliance',
    body: 'Users are solely responsible for ensuring that their participation in the Platform complies with the laws and regulations of their state or jurisdiction within India. Certain Indian states may have specific restrictions on online skill-gaming platforms. Elite eSports does not make any representation that the Platform is appropriate or legal for use in all jurisdictions. If you are unsure whether participation is permitted in your jurisdiction, please seek independent legal advice before using the Platform.',
  },
  {
    heading: '11. Changes to This Disclaimer',
    body: 'Elite eSports reserves the right to update or amend this Disclaimer at any time without prior notice. Updated versions will be published within the App. Your continued use of the Platform following any changes constitutes your acceptance of the revised Disclaimer.',
  },
  {
    heading: '12. Contact',
    body: 'For any questions or concerns regarding this Disclaimer, please contact:\n\nElite eSports\nSupport: help.eliteesports@outlook.com\nSystem: no-reply.eliteesports@outlook.com',
  },
];

export default function DisclaimerScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Disclaimer" />
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
