import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/components/MatchCard';
import { Colors } from '@/src/theme/colors';

const FILTERS = ['All', 'Live', 'Upcoming', 'Completed'] as const;
type FilterType = typeof FILTERS[number];

export default function Tournaments() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { liveMatches, upcomingMatches, completedMatches } = useMatchStore();
  const [filter, setFilter] = useState<FilterType>((params.filter as FilterType) || 'All');

  const allMatches = [...liveMatches, ...upcomingMatches, ...completedMatches];
  const displayed = filter === 'All' ? allMatches
    : filter === 'Live' ? liveMatches
    : filter === 'Upcoming' ? upcomingMatches
    : completedMatches;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>All Tournaments</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {displayed.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="game-controller-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No {filter} Tournaments</Text>
          </View>
        ) : (
          displayed.map(m => <MatchCard key={m.match_id} match={m} />)
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.appElevated, borderRadius: 20 },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  scroll: { paddingHorizontal: 16, gap: 12 },
  empty: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, color: Colors.textSecondary },
});
