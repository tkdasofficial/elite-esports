import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

interface Report {
  id: string;
  user_id: string;
  description: string;
  related_match_id: string | null;
  status: string;
  created_at: string;
  userName?: string | null;
}

type Filter = 'open' | 'resolved' | 'all';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('reports')
      .select('id, user_id, description, related_match_id, status, created_at')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setReports([]); setLoading(false); return; }

    const userIds = [...new Set(rows.map(r => r.user_id))];
    const { data: usersData } = await supabase
      .from('users').select('id, name, username').in('id', userIds);

    const userMap: Record<string, string> = {};
    for (const u of (usersData ?? [])) userMap[u.id] = u.name ?? u.username ?? 'Unknown';

    setReports(rows.map(r => ({ ...r, status: r.status ?? 'open', userName: userMap[r.user_id] ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async (id: string) => {
    Alert.alert('Mark Resolved', 'Mark this report as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve', onPress: async () => {
          setResolving(id);
          await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
          setResolving(null);
          load();
        },
      },
    ]);
  };

  const reopen = async (id: string) => {
    await supabase.from('reports').update({ status: 'open' }).eq('id', id);
    load();
  };

  const deleteReport = (id: string) => {
    Alert.alert('Delete Report', 'Remove this report permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('reports').delete().eq('id', id); load(); } },
    ]);
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const counts = {
    open: reports.filter(r => r.status === 'open').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    all: reports.length,
  };
  const FILTERS: Filter[] = ['open', 'resolved', 'all'];

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Reports"
        rightElement={
          <TouchableOpacity onPress={load} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
        }
      />

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
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="flag-outline" size={52} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No {filter === 'all' ? '' : filter} reports</Text>
              <Text style={styles.emptyHint}>All clear here</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isOpen = item.status === 'open';
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.authorRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{(item.userName ?? '?')[0].toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.authorName}>{item.userName ?? 'Unknown'}</Text>
                      <Text style={styles.dateText}>{fmtDate(item.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: isOpen ? Colors.status.warning + '20' : Colors.status.success + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: isOpen ? Colors.status.warning : Colors.status.success }]} />
                    <Text style={[styles.statusText, { color: isOpen ? Colors.status.warning : Colors.status.success }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.description}>{item.description}</Text>

                {item.related_match_id && (
                  <View style={styles.matchPill}>
                    <Ionicons name="trophy-outline" size={11} color={Colors.text.muted} />
                    <Text style={styles.matchPillText}>Match: {item.related_match_id.slice(0, 8)}…</Text>
                  </View>
                )}

                <View style={styles.actions}>
                  {isOpen ? (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnSuccess]}
                      onPress={() => resolve(item.id)} activeOpacity={0.8}
                      disabled={resolving === item.id}
                    >
                      {resolving === item.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                          <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                          <Text style={styles.btnText}>Mark Resolved</Text>
                        </>
                      }
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnNeutral]}
                      onPress={() => reopen(item.id)} activeOpacity={0.8}
                    >
                      <Ionicons name="refresh-outline" size={15} color={Colors.text.secondary} />
                      <Text style={[styles.btnText, { color: Colors.text.secondary }]}>Reopen</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.btn, styles.btnDanger]}
                    onPress={() => deleteReport(item.id)} activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={15} color={Colors.status.error} />
                  </TouchableOpacity>
                </View>
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
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary },
  authorName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20, marginBottom: 10 },
  matchPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.elevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  matchPillText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  btnSuccess: { flex: 1, backgroundColor: Colors.status.success },
  btnDanger: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', paddingHorizontal: 12 },
  btnNeutral: { flex: 1, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border },
  btnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
