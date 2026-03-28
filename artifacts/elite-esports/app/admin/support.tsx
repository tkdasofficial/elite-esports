import React, { useEffect, useState } from 'react';
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

export default function AdminSupportScreen() {
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('support_tickets')
      .select('id, user_id, message, status, created_at')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(rows.map(r => r.user_id))];
    const { data: usersData } = await supabase
      .from('users')
      .select('id, name, username')
      .in('id', userIds);

    const userMap: Record<string, string | null> = {};
    for (const u of (usersData ?? [])) {
      userMap[u.id] = u.name ?? u.username ?? null;
    }

    setTickets(rows.map(r => ({ ...r, userName: userMap[r.user_id] ?? null })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    load();
  };

  const statusColor = (s: string) =>
    s === 'resolved' ? Colors.status.success : s === 'in_progress' ? Colors.status.warning : Colors.status.info;

  const parseSubject = (msg: string) => {
    const match = msg.match(/^\[([^\]]+)\] (.+?)(?:\n|$)/);
    if (match) return match[2];
    return msg.slice(0, 60);
  };

  const parseCategory = (msg: string) => {
    const match = msg.match(/^\[([^\]]+)\]/);
    return match ? match[1] : 'General';
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Support" />
      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={styles.empty}>No support tickets yet.</Text>}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id;
            const subject = parseSubject(item.message);
            const category = parseCategory(item.message);
            return (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => setExpandedId(expanded ? null : item.id)} activeOpacity={0.8}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subject} numberOfLines={expanded ? undefined : 1}>{subject}</Text>
                      <Text style={styles.user}>{item.userName ?? 'Unknown'} · {category}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20' }]}>
                      <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {expanded && (
                  <>
                    <Text style={styles.message}>{item.message}</Text>
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    <View style={styles.actions}>
                      {['open', 'in_progress', 'resolved'].map(s => item.status !== s && (
                        <TouchableOpacity
                          key={s} style={[styles.actionBtn, { borderColor: statusColor(s) }]}
                          onPress={() => updateStatus(item.id, s)} activeOpacity={0.8}
                        >
                          <Text style={[styles.actionTxt, { color: statusColor(s) }]}>
                            {s.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
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
  card: { backgroundColor: Colors.background.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.default },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  subject: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, marginBottom: 3 },
  user: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  message: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 12, lineHeight: 20 },
  date: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 6, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  actionTxt: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  empty: { color: Colors.text.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_400Regular' },
});
