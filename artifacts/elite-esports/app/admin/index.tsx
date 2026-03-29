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

interface Stats {
  users: number;
  matches: number;
  revenue: number;
  pendingPayments: number;
  pendingWithdrawals: number;
}

const NAV_TILES = [
  { icon: 'people-outline' as const,          label: 'Users',        route: '/admin/users',        color: '#3B82F6' },
  { icon: 'trophy-outline' as const,           label: 'Matches',      route: '/admin/matches',      color: '#F59E0B' },
  { icon: 'game-controller-outline' as const,  label: 'Games',        route: '/admin/games',        color: '#8B5CF6' },
  { icon: 'card-outline' as const,             label: 'Payments',     route: '/admin/payments',     color: '#22C55E' },
  { icon: 'cash-outline' as const,             label: 'Withdrawals',  route: '/admin/withdrawals',  color: '#EF4444' },
  { icon: 'headset-outline' as const,          label: 'Support',      route: '/admin/support',      color: '#06B6D4' },
  { icon: 'flag-outline' as const,             label: 'Reports',      route: '/admin/reports',      color: '#F97316' },
  { icon: 'megaphone-outline' as const,        label: 'Broadcast',    route: '/admin/broadcast',    color: '#EC4899' },
  { icon: 'bar-chart-outline' as const,        label: 'Monetization', route: '/admin/monetization', color: '#84CC16' },
];

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const [usersRes, matchesRes, paymentsRes, withdrawRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, status'),
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
      <AdminHeader title="Dashboard" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeLeft}>
            <View style={styles.shieldBadge}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.welcomeTitle}>Admin Control Panel</Text>
              <Text style={styles.welcomeSub}>Full system access enabled</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadStats} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Overview</Text>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Total Users"   value={stats?.users ?? 0}               icon="people"      color="#3B82F6" />
            <StatCard label="Matches"       value={stats?.matches ?? 0}              icon="trophy"      color="#F59E0B" />
            <StatCard label="Revenue"       value={stats?.revenue ?? 0}              icon="trending-up" color="#22C55E" prefix="₹" />
            <StatCard label="Pending Pay"   value={stats?.pendingPayments ?? 0}      icon="card"        color="#EF4444" alert={!!stats?.pendingPayments} />
            <StatCard label="Pending W/D"   value={stats?.pendingWithdrawals ?? 0}   icon="cash"        color="#F97316" alert={!!stats?.pendingWithdrawals} />
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Quick Access</Text>
        <View style={styles.navGrid}>
          {NAV_TILES.map(tile => (
            <TouchableOpacity
              key={tile.label}
              style={styles.navTile}
              onPress={() => router.push(tile.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.navIcon, { backgroundColor: tile.color + '18' }]}>
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
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
        {alert && <View style={styles.alertDot} />}
      </View>
      <Text style={styles.statValue}>{prefix}{typeof value === 'number' && prefix === '₹' ? value.toFixed(0) : value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 16 },

  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(254,76,17,0.2)',
  },
  welcomeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(254,76,17,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254,76,17,0.25)',
  },
  welcomeTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  welcomeSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  loadingWrap: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: Colors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    gap: 6,
  },
  statCardAlert: { borderColor: 'rgba(239,68,68,0.3)' },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  alertDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.error,
  },
  statValue: { fontSize: 19, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },

  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navTile: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: Colors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    gap: 8,
  },
  navIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, textAlign: 'center' },
});
