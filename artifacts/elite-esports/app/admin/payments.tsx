import React, { useEffect, useState } from 'react';
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
  profiles?: { full_name: string | null; username: string | null } | null;
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('id, user_id, amount, utr, status, created_at, profiles(full_name, username)')
      .eq('type', 'credit')
      .order('created_at', { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  };

  const handleApprove = async (p: Payment) => {
    Alert.alert('Approve Payment', `Add ₹${p.amount} to user wallet?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          await supabase.from('transactions').update({ status: 'approved' }).eq('id', p.id);
          const { data: profile } = await supabase.from('profiles').select('balance').eq('id', p.user_id).single();
          const newBalance = (profile?.balance ?? 0) + p.amount;
          await supabase.from('profiles').update({ balance: newBalance }).eq('id', p.user_id);
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
          await supabase.from('transactions').update({ status: 'rejected' }).eq('id', p.id);
          load();
        },
      },
    ]);
  };

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const FILTERS: Filter[] = ['pending', 'approved', 'rejected', 'all'];

  return (
    <View style={styles.container}>
      <AdminHeader title="Payments" />
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
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
          ListEmptyComponent={<Text style={styles.empty}>No {filter} payments.</Text>}
          renderItem={({ item }) => {
            const user = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user?.full_name ?? 'Unknown'}</Text>
                    <Text style={styles.userUsername}>@{user?.username ?? '—'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.cardMid}>
                  <Text style={styles.amount}>₹{item.amount}</Text>
                  {item.utr && <Text style={styles.utr}>UTR: {item.utr}</Text>}
                  <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)} activeOpacity={0.8}>
                      <Ionicons name="checkmark" size={15} color="#fff" />
                      <Text style={styles.approveTxt}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)} activeOpacity={0.8}>
                      <Ionicons name="close" size={15} color="#fff" />
                      <Text style={styles.rejectTxt}>Reject</Text>
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

function statusColor(s: string) {
  if (s === 'approved') return Colors.status.success;
  if (s === 'rejected') return Colors.status.error;
  return Colors.status.warning;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.background.card,
    borderWidth: 1, borderColor: Colors.border.default,
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  filterTextActive: { color: '#fff' },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  userUsername: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  cardMid: { gap: 3, marginBottom: 12 },
  amount: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.status.success },
  utr: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  date: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: Colors.status.success,
    borderRadius: 10, paddingVertical: 9,
  },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: Colors.status.error,
    borderRadius: 10, paddingVertical: 9,
  },
  approveTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  rejectTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  empty: { color: Colors.text.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_400Regular' },
});
