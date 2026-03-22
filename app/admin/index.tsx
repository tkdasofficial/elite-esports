import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/store/authStore';
import { useMatchStore } from '@/src/store/matchStore';
import { Colors } from '@/src/theme/colors';

interface Stats {
  totalUsers: number;
  totalMatches: number;
  liveMatches: number;
  totalCoins: number;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { logout } = useUserStore();
  const { signOut } = useAuthStore();
  const { liveMatches, matches } = useMatchStore();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalMatches: 0, liveMatches: 0, totalCoins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { data: coinData } = await supabase.from('profiles').select('coins');
    const totalCoins = (coinData || []).reduce((sum: number, p: any) => sum + (p.coins || 0), 0);
    setStats({
      totalUsers: userCount || 0,
      totalMatches: matches.length,
      liveMatches: liveMatches.length,
      totalCoins,
    });
    setLoading(false);
  };

  const STAT_CARDS = [
    { label: 'Users', value: stats.totalUsers.toString(), icon: 'people', color: Colors.brandPrimary },
    { label: 'Matches', value: stats.totalMatches.toString(), icon: 'trophy', color: Colors.brandWarning },
    { label: 'Live', value: stats.liveMatches.toString(), icon: 'radio', color: Colors.brandLive },
    { label: 'Total Coins', value: `₹${stats.totalCoins}`, icon: 'cash', color: Colors.brandSuccess },
  ];

  const SECTIONS = [
    { icon: 'trophy', label: 'Matches', sub: 'Create & manage tournaments', route: '/admin/matches', color: Colors.brandWarning },
    { icon: 'people', label: 'Users', sub: 'Manage player accounts', route: '/admin/users', color: Colors.brandPrimary },
    { icon: 'cash', label: 'Economy', sub: 'Deposits & withdrawals', route: '/admin/economy', color: Colors.brandSuccess },
    { icon: 'notifications', label: 'Notifications', sub: 'Send push notifications', route: '/admin/notifications', color: Colors.brandLive },
    { icon: 'game-controller', label: 'Games', sub: 'Manage game catalog', route: '/admin/games', color: Colors.brandPrimary },
    { icon: 'megaphone', label: 'Campaigns', sub: 'Manage ad campaigns', route: '/admin/campaign', color: Colors.brandWarning },
    { icon: 'pricetag', label: 'Ad Tags', sub: 'Manage ad tag codes', route: '/admin/tags', color: Colors.brandSuccess },
    { icon: 'headset', label: 'Support', sub: 'Handle support tickets', route: '/admin/support', color: Colors.brandLive },
    { icon: 'book', label: 'Rules', sub: 'Manage game rules', route: '/admin/rules', color: Colors.brandPrimary },
    { icon: 'share-social', label: 'Referrals', sub: 'View referral history', route: '/admin/referrals', color: Colors.brandSuccess },
    { icon: 'grid', label: 'Categories', sub: 'Manage game categories', route: '/admin/categories', color: Colors.brandWarning },
    { icon: 'settings', label: 'Settings', sub: 'Platform configuration', route: '/admin/settings', color: Colors.textSecondary },
  ];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { logout(); await signOut(); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Admin Panel</Text>
          <Text style={styles.headerTitle}>Elite Esports</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.userBtn} onPress={() => router.push('/(tabs)')}>
            <Ionicons name="person" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out" size={16} color={Colors.brandLive} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Stats */}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.brandPrimary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {STAT_CARDS.map(card => (
              <View key={card.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${card.color}25` }]}>
                  <Ionicons name={card.icon as any} size={20} color={card.color} />
                </View>
                <Text style={styles.statValue}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sections */}
        <Text style={styles.sectionLabel}>MANAGE</Text>
        <View style={styles.card}>
          {SECTIONS.map((s, i) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.row, i < SECTIONS.length - 1 && styles.divider]}
              onPress={() => router.push(s.route as any)}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${s.color}25` }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{s.label}</Text>
                <Text style={styles.rowSub}>{s.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
  },
  headerSub: { fontSize: 12, color: Colors.brandPrimary, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.4 },
  headerRight: { flexDirection: 'row', gap: 8 },
  userBtn: { width: 36, height: 36, backgroundColor: Colors.appElevated, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { width: 36, height: 36, backgroundColor: `${Colors.brandLive}15`, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  loadingRow: { height: 120, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: Colors.appCard, borderRadius: 16, padding: 14, gap: 8 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 13, color: Colors.textMuted },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  rowSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
