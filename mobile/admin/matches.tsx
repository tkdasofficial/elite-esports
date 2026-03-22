import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchStore } from '@/src/store/matchStore';
import { Colors } from '@/src/theme/colors';

const STATUS_COLORS = {
  live: Colors.brandLive,
  upcoming: Colors.brandWarning,
  completed: Colors.textMuted,
};

export default function AdminMatches() {
  const insets = useSafeAreaInsets();
  const { matches, loading, fetchMatches, deleteMatch } = useMatchStore();
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');

  useEffect(() => { fetchMatches(); }, []);

  const displayed = filter === 'all' ? matches : matches.filter(m => m.status === filter);

  const handleDelete = (matchId: string, title: string) => {
    Alert.alert('Delete Match', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMatch(matchId); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Matches</Text>
        <TouchableOpacity onPress={() => router.push('/admin/match-form')}>
          <Ionicons name="add" size={24} color={Colors.brandPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'live', 'upcoming', 'completed'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.match_id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/admin/match-form?id=${item.match_id}`)}>
                    <Ionicons name="pencil" size={14} color={Colors.brandPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.match_id, item.title)}>
                    <Ionicons name="trash" size={14} color={Colors.brandLive} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.metaItem}>{item.game_name}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaItem}>{item.mode}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaItem}>{item.slots_filled}/{item.slots_total} joined</Text>
              </View>
              <View style={styles.cardFees}>
                <Text style={styles.feeItem}>Prize: {item.prize}</Text>
                <Text style={styles.feeItem}>Fee: {item.entry_fee}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No matches</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/admin/match-form')}>
                <Text style={styles.createBtnText}>Create First Match</Text>
              </TouchableOpacity>
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
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.appElevated, borderRadius: 20 },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 24 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: `${Colors.brandPrimary}20`, alignItems: 'center', justifyContent: 'center' },
  delBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: `${Colors.brandLive}15`, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flexDirection: 'row', gap: 4 },
  metaItem: { fontSize: 13, color: Colors.textMuted },
  metaDot: { fontSize: 13, color: Colors.textMuted },
  cardFees: { flexDirection: 'row', gap: 16 },
  feeItem: { fontSize: 13, color: Colors.textSecondary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  createBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.brandPrimary, borderRadius: 12 },
  createBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});
