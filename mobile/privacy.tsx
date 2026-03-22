import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/theme/colors';

const SECTIONS = [
  { title: 'Information We Collect', body: 'We collect information you provide when registering, such as your username, email address, and phone number. We also collect gameplay data including match history, rankings, and in-app purchases.' },
  { title: 'How We Use Your Information', body: 'We use your information to manage your account, process transactions, send tournament updates, and improve our platform. We may also use it to detect and prevent fraud.' },
  { title: 'Information Sharing', body: 'We do not sell your personal information. We may share data with service providers who assist in operating our platform. We may disclose information when required by law.' },
  { title: 'Data Security', body: 'We use industry-standard encryption to protect your data. Your account is secured with authentication protocols. However, no method of transmission over the Internet is 100% secure.' },
  { title: 'Your Rights', body: 'You can access, update, or delete your account information at any time through the app settings. You can opt out of marketing communications by updating your notification preferences.' },
  { title: 'Contact Us', body: 'If you have any questions about this Privacy Policy, please contact us at support@eliteesports.in. We will respond to your inquiry within 48 hours.' },
];

export default function Privacy() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
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
