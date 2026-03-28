import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

interface Report {
  id: string;
  description: string;
  match_id: string | null;
  status: string;
  created_at: string;
  profiles?: { full_name: string | null; username: string | null } | null;
}

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('id, description, match_id, status, created_at, profiles(full_name, username)')
      .order('created_at', { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  };

  const resolve = async (id: string) => {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
    load();
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Reports" />
      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={styles.empty}>No reports yet.</Text>}
          renderItem={({ item }) => {
            const user = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <Text style={styles.name}>{user?.full_name ?? 'Unknown'}</Text>
                  <View style={[styles.badge, { backgroundColor: item.status === 'resolved' ? Colors.status.success + '22' : Colors.status.warning + '22' }]}>
                    <Text style={[styles.badgeText, { color: item.status === 'resolved' ? Colors.status.success : Colors.status.warning }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.desc}>{item.description}</Text>
                {item.match_id && <Text style={styles.matchId}>Match ID: {item.match_id}</Text>}
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                {item.status !== 'resolved' && (
                  <TouchableOpacity style={styles.resolveBtn} onPress={() => resolve(item.id)} activeOpacity={0.8}>
                    <Text style={styles.resolveTxt}>Mark Resolved</Text>
                  </TouchableOpacity>
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
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20, marginBottom: 8 },
  matchId: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 4 },
  date: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 12 },
  resolveBtn: { backgroundColor: Colors.status.success, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  resolveTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  empty: { color: Colors.text.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_400Regular' },
});
