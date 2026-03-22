import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/components/MatchCard';
import { Colors } from '@/src/theme/colors';

const FILTERS = ['Live', 'Upcoming', 'Completed'] as const;
type FilterType = typeof FILTERS[number];

export default function Live() {
  const insets = useSafeAreaInsets();
  const { liveMatches, upcomingMatches, completedMatches, loading } = useMatchStore();
  const [filter, setFilter] = useState<FilterType>('Live');

  const matches = filter === 'Live' ? liveMatches : filter === 'Upcoming' ? upcomingMatches : completedMatches;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tournaments</Text>
        <View style={styles.liveDot}>
          <View style={styles.liveDotInner} />
          <Text style={styles.liveLabel}>LIVE</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            {f === 'Live' && liveMatches.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{liveMatches.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading && !matches.length ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} size="large" />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="game-controller-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No {filter} Matches</Text>
          <Text style={styles.emptyText}>Check back soon for new tournaments</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {matches.map(m => <MatchCard key={m.match_id} match={m} />)}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  liveDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandLive },
  liveLabel: { fontSize: 12, fontWeight: '700', color: Colors.brandLive, letterSpacing: 0.5 },
  filterRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
  filterTab: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.appElevated,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  filterTabActive: { backgroundColor: Colors.brandPrimary },
  filterText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  filterBadge: {
    backgroundColor: Colors.brandLive, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1,
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  scroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
