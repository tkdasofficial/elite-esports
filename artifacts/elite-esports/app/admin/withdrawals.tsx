import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  upi_id?: string | null;
  bank_name?: string | null;
  status: string;
  created_at: string;
  userName?: string | null;
  userUsername?: string | null;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminWithdrawalsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, upi_id, bank_name, status, created_at')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setData([]); setLoading(false); return; }

    const userIds = [...new Set(rows.map(r => r.user_id))];
    const { data: usersData } = await supabase
      .from('users').select('id, name, username').in('id', userIds);

    const userMap: Record<string, { name: string | null; username: string | null }> = {};
    for (const u of (usersData ?? [])) userMap[u.id] = { name: u.name ?? null, username: u.username ?? null };

    setData(rows.map(r => ({
      ...r,
      userName: userMap[r.user_id]?.name ?? null,
      userUsername: userMap[r.user_id]?.username ?? null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handle = async (item: Withdrawal, action: 'approved' | 'rejected') => {
    const label = action === 'approved' ? 'Approve' : 'Reject';
    const desc = action === 'approved'
      ? `Confirm payout of ₹${item.amount} to ${item.userName ?? 'user'}?`
      : `Reject withdrawal and refund ₹${item.amount} to wallet?`;

    Alert.alert(`${label} Withdrawal`, desc, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, style: action === 'rejected' ? 'destructive' : 'default',
        onPress: async () => {
          setActioning(item.id);
          await supabase.from('withdrawals').update({ status: action }).eq('id', item.id);
          if (action === 'rejected') {
            const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', item.user_id).maybeSingle();
            const restored = (wallet?.balance ?? 0) + item.amount;
            await supabase.from('wallets').upsert({ user_id: item.user_id, balance: restored, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          }
          setActioning(null);
          load();
        },
      },
    ]);
  };

  const FILTERS: Filter[] = ['pending', 'approved', 'rejected', 'all'];
  const filtered = filter === 'all' ? data : data.filter(d => d.status === filter);
  const counts: Record<Filter, number> = {
    pending: data.filter(d => d.status === 'pending').length,
    approved: data.filter(d => d.status === 'approved').length,
    rejected: data.filter(d => d.status === 'rejected').length,
    all: data.length,
  };
  const totalPending = data.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Withdrawals"
        rightElement={
          <TouchableOpacity onPress={load} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        }
      />

      {counts.pending > 0 && (
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={18} color={Colors.status.error} />
          <Text style={styles.summaryText}>
            <Text style={{ color: Colors.status.error, fontFamily: 'Inter_700Bold' }}>{counts.pending}</Text>
            {' '}pending payouts · ₹{totalPending.toLocaleString('en-IN')} total
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
              <Ionicons name="cash-outline" size={52} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No {filter} withdrawals</Text>
              <Text style={styles.emptyHint}>Nothing to process here</Text>
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
                  <View style={[styles.statusBadge, { backgroundColor: statusBg(item.status) }]}>
                    <Text style={[styles.statusText, { color: statusClr(item.status) }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.amount}>-₹{item.amount.toLocaleString('en-IN')}</Text>
                {(item.upi_id || item.bank_name) && (
                  <View style={styles.payoutRow}>
                    <Ionicons name="card-outline" size={12} color={Colors.text.muted} />
                    <Text style={styles.payoutText}>{item.upi_id ?? item.bank_name}</Text>
                  </View>
                )}
                <Text style={styles.dateText}>{fmtDate(item.created_at)}</Text>

                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnApprove, isActioning && { opacity: 0.6 }]}
                      onPress={() => handle(item, 'approved')} activeOpacity={0.8} disabled={isActioning}
                    >
                      {isActioning ? <ActivityIndicator size="small" color="#fff" /> : <>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.btnText}>Approve Payout</Text>
                      </>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnReject, isActioning && { opacity: 0.6 }]}
                      onPress={() => handle(item, 'rejected')} activeOpacity={0.8} disabled={isActioning}
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

const statusClr = (s: string) => s === 'approved' ? Colors.status.success : s === 'rejected' ? Colors.status.error : Colors.status.warning;
const statusBg = (s: string) => statusClr(s) + '20';

const C = { card: '#111111', border: '#2A2A2A', elevated: '#1A1A1A' };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
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
  amount: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.status.error, marginBottom: 6 },
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  payoutText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10 },
  btnApprove: { backgroundColor: Colors.status.success },
  btnReject: { backgroundColor: Colors.status.error },
  btnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
