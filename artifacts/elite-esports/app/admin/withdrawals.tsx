import React, { useEffect, useState } from 'react';
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
  status: string;
  created_at: string;
  profiles?: { full_name: string | null; username: string | null } | null;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminWithdrawalsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, status, created_at, profiles(full_name, username)')
      .order('created_at', { ascending: false });
    setData(rows ?? []);
    setLoading(false);
  };

  const handle = async (item: Withdrawal, action: 'approved' | 'rejected') => {
    const label = action === 'approved' ? 'Approve' : 'Reject';
    Alert.alert(`${label} Withdrawal`, `₹${item.amount} — are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, style: action === 'rejected' ? 'destructive' : 'default',
        onPress: async () => {
          await supabase.from('withdrawals').update({ status: action }).eq('id', item.id);
          if (action === 'rejected') {
            const { data: profile } = await supabase.from('profiles').select('balance').eq('id', item.user_id).single();
            const restored = (profile?.balance ?? 0) + item.amount;
            await supabase.from('profiles').update({ balance: restored }).eq('id', item.user_id);
          }
          load();
        },
      },
    ]);
  };

  const filtered = filter === 'all' ? data : data.filter(d => d.status === filter);
  const FILTERS: Filter[] = ['pending', 'approved', 'rejected', 'all'];

  const statusColor = (s: string) =>
    s === 'approved' ? Colors.status.success : s === 'rejected' ? Colors.status.error : Colors.status.warning;

  return (
    <View style={styles.container}>
      <AdminHeader title="Withdrawals" />
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)} activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
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
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={styles.empty}>No {filter} withdrawals.</Text>}
          renderItem={({ item }) => {
            const user = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{user?.full_name ?? 'Unknown'}</Text>
                    <Text style={styles.username}>@{user?.username ?? '—'}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '22' }]}>
                    <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.amount}>₹{item.amount}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handle(item, 'approved')} activeOpacity={0.8}>
                      <Ionicons name="checkmark" size={15} color="#fff" />
                      <Text style={styles.btnTxt}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handle(item, 'rejected')} activeOpacity={0.8}>
                      <Ionicons name="close" size={15} color="#fff" />
                      <Text style={styles.btnTxt}>Reject</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default, alignItems: 'center' },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.background.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.default },
  top: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  username: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  amount: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.status.error, marginBottom: 4 },
  date: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: Colors.status.success, borderRadius: 10, paddingVertical: 9 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: Colors.status.error, borderRadius: 10, paddingVertical: 9 },
  btnTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  empty: { color: Colors.text.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_400Regular' },
});
