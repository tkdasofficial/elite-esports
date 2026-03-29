import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  utr: string | null;
  status: string;
  created_at: string;
  userName?: string | null;
  userUsername?: string | null;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

function statusColor(s: string) {
  if (s === 'approved') return Colors.status.success;
  if (s === 'rejected') return Colors.status.error;
  return Colors.status.warning;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('payments')
      .select('id, user_id, amount, utr, status, created_at')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setPayments([]); setLoading(false); return; }

    const userIds = [...new Set(rows.map(r => r.user_id))];
    const { data: usersData } = await supabase
      .from('users').select('id, name, username').in('id', userIds);

    const userMap: Record<string, { name: string | null; username: string | null }> = {};
    for (const u of (usersData ?? [])) userMap[u.id] = { name: u.name ?? null, username: u.username ?? null };

    setPayments(rows.map(r => ({
      ...r,
      userName: userMap[r.user_id]?.name ?? null,
      userUsername: userMap[r.user_id]?.username ?? null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (p: Payment) => {
    Alert.alert('Approve Payment', `Add ₹${p.amount} to ${p.userName ?? 'user'}'s wallet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          setActioning(p.id);
          await supabase.from('payments').update({ status: 'approved' }).eq('id', p.id);
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', p.user_id).maybeSingle();
          const newBalance = (wallet?.balance ?? 0) + p.amount;
          await supabase.from('wallets').upsert({ user_id: p.user_id, balance: newBalance, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          setActioning(null);
          load();
        },
      },
    ]);
  };

  const handleReject = async (p: Payment) => {
    Alert.alert('Reject Payment', 'Reject this deposit request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          setActioning(p.id);
          await supabase.from('payments').update({ status: 'rejected' }).eq('id', p.id);
          setActioning(null);
          load();
        },
      },
    ]);
  };

  const FILTERS: Filter[] = ['pending', 'approved', 'rejected', 'all'];
  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);
  const counts: Record<Filter, number> = {
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    all: payments.length,
  };
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Payments"
        rightElement={
          <TouchableOpacity onPress={load} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        }
      />

      {counts.pending > 0 && (
        <View style={styles.summaryCard}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.status.warning} />
          <Text style={styles.summaryText}>
            <Text style={{ color: Colors.status.warning, fontFamily: 'Inter_700Bold' }}>{counts.pending}</Text>
            {' '}pending requests · ₹{totalPending.toLocaleString('en-IN')} total
          </Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)} activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            {counts[f] > 0 && (
              <View style={[styles.badge, filter === f && styles.badgeActive]}>
                <Text style={[styles.badgeText, filter === f && styles.badgeTextActive]}>{counts[f]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="card-outline" size={52} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No {filter} payments</Text>
              <Text style={styles.emptyHint}>Nothing to show here</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isActioning = actioning === item.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.userRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(item.userName ?? item.userUsername ?? '?')[0].toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{item.userName ?? 'Unknown'}</Text>
                      <Text style={styles.userUsername}>@{item.userUsername ?? '—'}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amount}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  {item.utr && (
                    <View style={styles.utrPill}>
                      <Text style={styles.utrText}>UTR {item.utr}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dateText}>{fmtDate(item.created_at)}</Text>

                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnApprove, isActioning && { opacity: 0.6 }]}
                      onPress={() => handleApprove(item)} activeOpacity={0.8} disabled={isActioning}
                    >
                      {isActioning ? <ActivityIndicator size="small" color="#fff" /> : <>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.btnText}>Approve</Text>
                      </>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnReject, isActioning && { opacity: 0.6 }]}
                      onPress={() => handleReject(item)} activeOpacity={0.8} disabled={isActioning}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                      <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const C = { card: '#111111', border: '#2A2A2A', elevated: '#1A1A1A' };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  summaryText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 10 },
  filterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: 'rgba(254,76,17,0.12)', borderColor: Colors.primary + '60' },
  filterText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  filterTextActive: { color: Colors.primary },
  badge: { backgroundColor: C.elevated, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  badgeActive: { backgroundColor: 'rgba(254,76,17,0.15)' },
  badgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.text.muted },
  badgeTextActive: { color: Colors.primary },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  emptyHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  userUsername: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  amount: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.status.success },
  utrPill: { backgroundColor: C.elevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  utrText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10 },
  btnApprove: { backgroundColor: Colors.status.success },
  btnReject: { backgroundColor: Colors.status.error },
  btnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
