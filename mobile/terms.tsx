import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/theme/colors';

const SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By accessing and using Elite Esports, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.' },
  { title: '2. Eligibility', body: 'Users must be at least 16 years old to participate in tournaments. Users between 16-18 require parental consent. You must provide accurate information during registration.' },
  { title: '3. Fair Play', body: 'Cheating, hacking, or exploiting bugs is strictly prohibited. Unsportsmanlike conduct will result in disqualification. All match results are final unless contested within 24 hours.' },
  { title: '4. Prize Distribution', body: 'Prizes are credited within 48 hours of match completion. Withdrawals are processed within 24 hours. Elite Esports reserves the right to withhold prizes for rule violations.' },
  { title: '5. Account Suspension', body: 'We reserve the right to suspend accounts for any violation of these terms. Decisions made by our moderation team are final. Banned accounts forfeit all pending prizes.' },
  { title: '6. Privacy', body: 'We collect and use your data in accordance with our Privacy Policy. We do not sell your personal information to third parties. We use cookies and analytics to improve your experience.' },
];

export default function Terms() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms & Conditions</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.lastUpdated}>Last updated: March 2026</Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  lastUpdated: { fontSize: 13, color: Colors.textMuted },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  sectionBody: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
});
