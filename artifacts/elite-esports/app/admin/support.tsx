import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

interface Ticket {
  id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  userName?: string | null;
}

type Filter = 'open' | 'in_progress' | 'resolved' | 'all';

function statusColor(s: string) {
  if (s === 'resolved') return Colors.status.success;
  if (s === 'in_progress') return Colors.status.warning;
  return Colors.status.info;
}
function statusLabel(s: string) {
  return s.replace('_', ' ');
}

function parseSubject(msg: string) {
  const match = msg.match(/^\[([^\]]+)\] (.+?)(?:\n|$)/);
  return match ? match[2] : msg.slice(0, 80);
}
function parseCategory(msg: string) {
  const match = msg.match(/^\[([^\]]+)\]/);
  return match ? match[1] : 'General';
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminSupportScreen() {
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('open');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('support_tickets')
      .select('id, user_id, message, status, created_at')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setTickets([]); setLoading(false); return; }

    const userIds = [...new Set(rows.map(r => r.user_id))];
    const { data: usersData } = await supabase
      .from('users').select('id, name, username').in('id', userIds);

    const userMap: Record<string, string> = {};
    for (const u of (usersData ?? [])) userMap[u.id] = u.name ?? u.username ?? 'Unknown';

    setTickets(rows.map(r => ({ ...r, status: r.status ?? 'open', userName: userMap[r.user_id] ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setActioning(id);
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    setActioning(null);
    load();
  };

  const FILTERS: Filter[] = ['open', 'in_progress', 'resolved', 'all'];
  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const counts: Record<Filter, number> = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    all: tickets.length,
  };

  const filterLabels: Record<Filter, string> = {
    open: 'Open', in_progress: 'Active', resolved: 'Done', all: 'All',
  };

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Support"
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
              {filterLabels[f]}
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
              <Ionicons name="headset-outline" size={52} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No {filterLabels[filter].toLowerCase()} tickets</Text>
              <Text style={styles.emptyHint}>All support tickets appear here</Text>
            </View>
          }
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const subject = parseSubject(item.message);
            const category = parseCategory(item.message);
            const clr = statusColor(item.status);
            const isActioning = actioning === item.id;

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={() => setExpandedId(expanded ? null : item.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.userRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(item.userName ?? '?')[0].toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subject} numberOfLines={expanded ? undefined : 1}>{subject}</Text>
                        <Text style={styles.meta}>{item.userName ?? 'Unknown'} · {category} · {fmtDate(item.created_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.right}>
                      <View style={[styles.statusChip, { backgroundColor: clr + '20' }]}>
                        <Text style={[styles.statusText, { color: clr }]}>{statusLabel(item.status)}</Text>
                      </View>
                      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.text.muted} />
                    </View>
                  </View>
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.expandedBody}>
                    <View style={styles.divider} />
                    <Text style={styles.fullMessage}>{item.message}</Text>
                    {isActioning ? (
                      <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
                    ) : (
                      <View style={styles.actions}>
                        {item.status !== 'in_progress' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: Colors.status.warning + '60', backgroundColor: 'rgba(245,158,11,0.08)' }]}
                            onPress={() => updateStatus(item.id, 'in_progress')} activeOpacity={0.8}
                          >
                            <Ionicons name="time-outline" size={14} color={Colors.status.warning} />
                            <Text style={[styles.actionBtnText, { color: Colors.status.warning }]}>In Progress</Text>
                          </TouchableOpacity>
                        )}
                        {item.status !== 'resolved' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: Colors.status.success + '60', backgroundColor: 'rgba(34,197,94,0.08)' }]}
                            onPress={() => updateStatus(item.id, 'resolved')} activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle-outline" size={14} color={Colors.status.success} />
                            <Text style={[styles.actionBtnText, { color: Colors.status.success }]}>Resolve</Text>
                          </TouchableOpacity>
                        )}
                        {item.status !== 'open' && (
                          <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: Colors.status.info + '60', backgroundColor: 'rgba(59,130,246,0.08)' }]}
                            onPress={() => updateStatus(item.id, 'open')} activeOpacity={0.8}
                          >
                            <Ionicons name="refresh-outline" size={14} color={Colors.status.info} />
                            <Text style={[styles.actionBtnText, { color: Colors.status.info }]}>Reopen</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
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
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  userRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, marginTop: 1 },
  avatarText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
  subject: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 3, flex: 1 },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  right: { alignItems: 'flex-end', gap: 6 },
  statusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  expandedBody: { marginTop: 12 },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 12 },
  fullMessage: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
});
