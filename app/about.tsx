import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/theme/colors';

const FEATURES = [
  { icon: 'trophy', label: 'Competitive Tournaments', color: Colors.brandWarning },
  { icon: 'cash', label: 'Real Cash Prizes', color: Colors.brandSuccess },
  { icon: 'shield-checkmark', label: 'Anti-Cheat Protection', color: Colors.brandPrimaryLight },
  { icon: 'trending-up', label: 'Skill-Based Matchmaking', color: Colors.brandLive },
  { icon: 'people', label: 'Active Community', color: Colors.brandPrimary },
  { icon: 'flash', label: 'Instant Payouts', color: Colors.brandWarning },
];

export default function About() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>About Elite Esports</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Ionicons name="flash" size={44} color={Colors.white} />
          </View>
          <Text style={styles.brand}>Elite Esports</Text>
          <Text style={styles.tagline}>Where Champions Are Made</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0.0 · Build 2026.03</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.cardBody}>
            Elite Esports is India's premier competitive mobile gaming platform. We connect players across skill levels and games, offering real money tournaments, leaderboards, and a thriving community — all in one place.
          </Text>
        </View>

        {/* Features */}
        <Text style={styles.featuresTitle}>Why Elite Esports?</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map(f => (
            <View key={f.label} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${f.color}20` }]}>
                <Ionicons name={f.icon as any} size={22} color={f.color} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <Text style={styles.cardBody}>support@eliteesports.in{'\n'}Available Monday–Friday, 10am–7pm IST</Text>
        </View>

        <Text style={styles.footer}>© 2026 Elite Esports. All rights reserved.</Text>
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
  hero: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  logoBox: { width: 80, height: 80, backgroundColor: Colors.brandPrimary, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.brandPrimary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  brand: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: Colors.textSecondary },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.appElevated, borderRadius: 20 },
  versionText: { fontSize: 12, color: Colors.textMuted },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  cardBody: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  featuresTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.3 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: { width: '47%', backgroundColor: Colors.appCard, borderRadius: 14, padding: 14, alignItems: 'center', gap: 10 },
  featureIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 13, color: Colors.textPrimary, textAlign: 'center', fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, opacity: 0.5 },
});
