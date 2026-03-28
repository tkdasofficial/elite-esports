import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

interface Stats {
  users: number;
  matches: number;
  revenue: number;
  pendingPayments: number;
  pendingWithdrawals: number;
}

const NAV_TILES = [
  { icon: 'people-outline' as const, label: 'Users', route: '/admin/users', color: '#3B82F6' },
  { icon: 'trophy-outline' as const, label: 'Matches', route: '/admin/matches', color: '#F59E0B' },
  { icon: 'game-controller-outline' as const, label: 'Games', route: '/admin/games', color: '#8B5CF6' },
  { icon: 'card-outline' as const, label: 'Payments', route: '/admin/payments', color: '#22C55E' },
  { icon: 'cash-outline' as const, label: 'Withdrawals', route: '/admin/withdrawals', color: '#EF4444' },
  { icon: 'headset-outline' as const, label: 'Support', route: '/admin/support', color: '#06B6D4' },
  { icon: 'flag-outline' as const, label: 'Reports', route: '/admin/reports', color: '#F97316' },
  { icon: 'notifications-outline' as const, label: 'Broadcast', route: '/admin/broadcast', color: '#EC4899' },
  { icon: 'bar-chart-outline' as const, label: 'Monetization', route: '/admin/monetization', color: '#84CC16' },
];

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const [usersRes, matchesRes, paymentsRes, withdrawRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('amount, status').eq('type', 'credit'),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    const payments = paymentsRes.data ?? [];
    const revenue = payments.filter(p => p.status === 'approved').reduce((s, p) => s + (p.amount ?? 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    setStats({
      users: usersRes.count ?? 0,
      matches: matchesRes.count ?? 0,
      revenue,
      pendingPayments,
      pendingWithdrawals: withdrawRes.count ?? 0,
    });
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Admin Dashboard"
        showBack={false}
        rightElement={
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={Colors.status.error} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
          <Text style={styles.adminBadgeText}>Admin Control Panel</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Total Users" value={stats?.users ?? 0} icon="people" color="#3B82F6" />
            <StatCard label="Total Matches" value={stats?.matches ?? 0} icon="trophy" color="#F59E0B" />
            <StatCard label="Revenue ₹" value={stats?.revenue ?? 0} icon="trending-up" color="#22C55E" prefix="₹" />
            <StatCard label="Pending Pay" value={stats?.pendingPayments ?? 0} icon="card" color="#EF4444" alert={!!stats?.pendingPayments} />
            <StatCard label="Pending W/D" value={stats?.pendingWithdrawals ?? 0} icon="cash" color="#F97316" alert={!!stats?.pendingWithdrawals} />
          </View>
        )}

        <Text style={styles.sectionLabel}>Manage</Text>
        <View style={styles.navGrid}>
          {NAV_TILES.map(tile => (
            <TouchableOpacity
              key={tile.label}
              style={styles.navTile}
              onPress={() => router.push(tile.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIcon, { backgroundColor: tile.color + '22' }]}>
                <Ionicons name={tile.icon} size={22} color={tile.color} />
              </View>
              <Text style={styles.navLabel}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, prefix = '', alert = false }: {
  label: string; value: number; icon: string; color: string; prefix?: string; alert?: boolean;
}) {
  return (
    <View style={[styles.statCard, alert && styles.statCardAlert]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
        {alert && <View style={styles.alertDot} />}
      </View>
      <Text style={styles.statValue}>{prefix}{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 16 },
  logoutBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(254,76,17,0.2)',
    alignSelf: 'flex-start', marginBottom: 16,
  },
  adminBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: Colors.background.card,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border.default,
    alignItems: 'center', gap: 6,
  },
  statCardAlert: { borderColor: 'rgba(239,68,68,0.3)' },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  alertDot: {
    position: 'absolute', top: 2, right: 2,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.error,
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navTile: {
    width: '30%', flexGrow: 1,
    backgroundColor: Colors.background.card,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border.default,
    alignItems: 'center', gap: 8,
  },
  navIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, textAlign: 'center' },
});
