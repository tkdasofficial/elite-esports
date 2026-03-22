import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/theme/colors';

const FAQS = [
  { q: 'How do I join a tournament?', a: 'Go to Home or Live tab, find a tournament, tap "View Details" and then "Join Tournament". Make sure you have sufficient coins for the entry fee.' },
  { q: 'How do I add coins to my wallet?', a: 'Go to the Wallet tab and tap "Add Cash". Send the amount via UPI to the admin UPI ID, then enter the transaction UTR number to confirm your payment.' },
  { q: 'When are prizes credited?', a: 'Prizes are credited to your in-app wallet within 48 hours of match completion and result verification.' },
  { q: 'How do I withdraw my winnings?', a: 'Go to Wallet tab and tap "Withdraw". Enter the amount and your UPI ID or Google Play email. Withdrawals are processed within 24 hours.' },
  { q: 'What happens if I disconnect during a match?', a: 'Disconnections due to internet issues are unfortunately not compensated. Ensure you have a stable connection before joining.' },
  { q: 'How do I add my game profile?', a: 'Go to Profile tab, tap "Add" next to My Games, select your game, and enter your In-Game Name (IGN) and User ID (UID).' },
  { q: 'Can I change my username?', a: 'Yes, go to Profile > Edit Profile to update your username. Choose wisely as changes are visible to other players.' },
  { q: 'How do I report a cheater?', a: 'Contact our support team with video evidence. Verified cheaters are permanently banned and prizes are redistributed.' },
];

export default function Help() {
  const insets = useSafeAreaInsets();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.contactCard}>
          <Ionicons name="mail" size={24} color={Colors.brandPrimary} />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactValue}>support@eliteesports.in</Text>
          </View>
        </View>

        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

        <View style={styles.faqList}>
          {FAQS.map((faq, i) => (
            <View key={i} style={[styles.faqItem, i < FAQS.length - 1 && styles.faqDivider]}>
              <TouchableOpacity style={styles.faqQ} onPress={() => setOpenIdx(openIdx === i ? null : i)}>
                <Text style={styles.faqQText}>{faq.q}</Text>
                <Ionicons name={openIdx === i ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {openIdx === i && <Text style={styles.faqA}>{faq.a}</Text>}
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  contactCard: { backgroundColor: Colors.appCard, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 13, color: Colors.textMuted },
  contactValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  faqTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.3 },
  faqList: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  faqItem: { paddingHorizontal: 16, paddingVertical: 14 },
  faqDivider: { borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  faqQ: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  faqA: { fontSize: 14, color: Colors.textSecondary, marginTop: 10, lineHeight: 20 },
});
