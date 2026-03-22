import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/components/MatchCard';
import { Colors } from '@/src/theme/colors';

type FilterType = 'all' | 'live' | 'upcoming' | 'completed';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'live',      label: 'Live' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

export default function Tournaments() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { liveMatches, upcomingMatches, completedMatches } = useMatchStore();
  const [filter, setFilter] = useState<FilterType>((params.filter as FilterType) || 'all');

  const now = new Date();
  const filterValid = (matches: typeof liveMatches) =>
    matches.filter(m => {
      if ((m as any).delete_at && new Date((m as any).delete_at) < now) return false;
      if (m.status === 'completed' && (m as any).show_until && new Date((m as any).show_until) < now) return false;
      return true;
    });

  const live      = filterValid(liveMatches);
  const upcoming  = filterValid(upcomingMatches);
  const completed = filterValid(completedMatches);

  const counts: Record<FilterType, number> = {
    all: live.length + upcoming.length + completed.length,
    live: live.length,
    upcoming: upcoming.length,
    completed: completed.length,
  };

  const displayed = filter === 'all' ? [...live, ...upcoming, ...completed]
    : filter === 'live' ? live
    : filter === 'upcoming' ? upcoming
    : completed;

  const emptyMsg: Record<FilterType, string> = {
    all: 'No tournaments available',
    live: 'No live matches right now',
    upcoming: 'No upcoming matches',
    completed: 'No completed matches',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tournaments</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{displayed.length}</Text>
        </View>
      </View>

      {/* Filter row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            <View style={[styles.chipBadge, filter === f.key && styles.chipBadgeActive]}>
              <Text style={[styles.chipBadgeText, filter === f.key && styles.chipBadgeTextActive]}>
                {counts[f.key]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {displayed.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="radio-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Tournaments</Text>
          <Text style={styles.emptyText}>{emptyMsg[filter]}</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.match_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={item.status === 'completed' ? styles.completedOpacity : undefined}>
              <MatchCard match={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  countPill: { backgroundColor: `${Colors.brandPrimary}20`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  countText: { fontSize: 13, fontWeight: '500', color: Colors.brandPrimary },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.appElevated, borderRadius: 20 },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  chipBadge: { backgroundColor: Colors.appBorder, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  chipBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  chipBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  chipBadgeTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32, gap: 12 },
  completedOpacity: { opacity: 0.75 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { width: 88, height: 88, backgroundColor: Colors.appCard, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
