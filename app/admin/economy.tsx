import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';

interface TxRequest {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  method?: string;
  details?: string;
  title?: string;
  created_at: string;
  profiles?: { username: string; email: string };
}

const FILTERS = ['All', 'Pending', 'Success', 'Failed'] as const;
type FilterType = typeof FILTERS[number];

export default function AdminEconomy() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<TxRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('Pending');

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, profiles(username, email)')
      .order('created_at', { ascending: false })
      .limit(200);
    setRequests(data || []);
    setLoading(false);
  };

  const displayed = requests.filter(r => {
    if (filter === 'All') return true;
    return r.status.toLowerCase() === filter.toLowerCase();
  });

  const handleApprove = async (req: TxRequest) => {
    Alert.alert('Approve', `Approve ${req.type} of ₹${Math.abs(req.amount)} for ${req.profiles?.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', onPress: async () => {
          const { error } = await supabase
            .from('transactions')
            .update({ status: 'success' })
            .eq('id', req.id);
          if (req.type === 'deposit') {
            await supabase.rpc('increment_coins', { user_id: req.user_id, amount: Math.abs(req.amount) });
          } else if (req.type === 'withdrawal') {
            await supabase.rpc('decrement_coins', { user_id: req.user_id, amount: Math.abs(req.amount) });
          }
          loadRequests();
        }
      },
    ]);
  };

  const handleReject = async (req: TxRequest) => {
    Alert.alert('Reject', `Reject this ${req.type} request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          await supabase.from('transactions').update({ status: 'failed' }).eq('id', req.id);
          loadRequests();
        }
      },
    ]);
  };

  const txColor = (type: string, status: string) => {
    if (status === 'success') return Colors.brandSuccess;
    if (status === 'failed') return Colors.brandLive;
    return Colors.brandWarning;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Economy</Text>
        <TouchableOpacity onPress={loadRequests}>
          <Ionicons name="refresh" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            {f === 'Pending' && <View style={styles.pendingDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const color = txColor(item.type, item.status);
            const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardUser}>@{item.profiles?.username || 'unknown'}</Text>
                    <Text style={styles.cardEmail}>{item.profiles?.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
                    <Text style={[styles.statusText, { color }]}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.cardType}>{item.type}: {item.title || ''}</Text>
                  <Text style={[styles.cardAmount, { color }]}>
                    {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount)}
                  </Text>
                </View>
                {item.method && <Text style={styles.cardMethod}>Method: {item.method}{item.details ? ` · ${item.details}` : ''}</Text>}
                <Text style={styles.cardDate}>{date}</Text>
                {isPending && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                      <Ionicons name="checkmark" size={14} color={Colors.white} />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                      <Ionicons name="close" size={14} color={Colors.brandLive} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No {filter.toLowerCase()} transactions</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.appElevated, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 14, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brandLive },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 24 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardUser: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  cardEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { fontSize: 14, color: Colors.textSecondary, textTransform: 'capitalize' },
  cardAmount: { fontSize: 18, fontWeight: '700' },
  cardMethod: { fontSize: 12, color: Colors.textMuted },
  cardDate: { fontSize: 12, color: Colors.textMuted },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: Colors.brandSuccess, borderRadius: 10 },
  approveBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: `${Colors.brandLive}15`, borderRadius: 10, borderWidth: 1, borderColor: `${Colors.brandLive}30` },
  rejectBtnText: { fontSize: 14, fontWeight: '500', color: Colors.brandLive },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textMuted },
});
