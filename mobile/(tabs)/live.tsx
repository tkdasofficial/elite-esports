import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
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

  const matches = filter === 'Live' ? liveMatches
    : filter === 'Upcoming' ? upcomingMatches
    : completedMatches;

  const counts: Record<FilterType, number> = {
    Live: liveMatches.length,
    Upcoming: upcomingMatches.length,
    Completed: completedMatches.length,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tournaments</Text>
        {liveMatches.length > 0 && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero stream card */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.heroCard}
          onPress={() => Linking.openURL('https://youtube.com').catch(() => {})}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80' }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View style={[StyleSheet.absoluteFill, styles.heroOverlay]} />

          {/* Play button */}
          <View style={styles.playBtn}>
            <Ionicons name="play" size={26} color={Colors.white} />
          </View>

          {/* Live badge */}
          <View style={styles.heroBadge}>
            <View style={styles.heroDot} />
            <Text style={styles.heroBadgeText}>LIVE</Text>
          </View>

          {/* Bottom text */}
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>Watch Live Streams</Text>
            <Text style={styles.heroSub}>Experience the action in real-time</Text>
          </View>
        </TouchableOpacity>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              {counts[f] > 0 && (
                <View style={[styles.filterBadge, filter === f ? styles.filterBadgeActive : null]}>
                  <Text style={[styles.filterBadgeText, filter === f ? styles.filterBadgeTextActive : null]}>
                    {counts[f]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Section header */}
        <View style={styles.sectionRow}>
          {filter === 'Live' && (
            <Ionicons name="radio" size={16} color={Colors.brandLive} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.sectionTitle}>
            {filter === 'Live' ? 'Active Tournaments' : filter === 'Upcoming' ? 'Upcoming Tournaments' : 'Completed Tournaments'}
          </Text>
          {filter === 'Live' && liveMatches.length > 0 && (
            <View style={styles.livePill}>
              <Text style={styles.livePillText}>{liveMatches.length} live</Text>
            </View>
          )}
        </View>

        {loading && !matches.length ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.brandPrimary} size="large" />
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="radio-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'Live' ? 'No Live Matches' : filter === 'Upcoming' ? 'No Upcoming Matches' : 'No Completed Matches'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'Live' ? 'Check back during tournament hours' : 'New tournaments will appear here soon'}
            </Text>
          </View>
        ) : (
          <View style={styles.matchList}>
            {matches.map(m => <MatchCard key={m.match_id} match={m} />)}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: `${Colors.brandLive}15`, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brandLive },
  liveLabel: { fontSize: 12, fontWeight: '700', color: Colors.brandLive, letterSpacing: 0.5 },
  scroll: { paddingHorizontal: 16, gap: 0 },
  heroCard: {
    height: 192, borderRadius: 20, overflow: 'hidden',
    marginBottom: 20, backgroundColor: Colors.appCard,
    alignItems: 'center', justifyContent: 'center',
  },
  heroOverlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    paddingLeft: 4,
  },
  heroBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.brandLive, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  heroBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16,
  },
  heroTitle: { fontSize: 17, fontWeight: '600', color: Colors.white },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterTab: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.appElevated,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 5,
  },
  filterTabActive: { backgroundColor: Colors.brandPrimary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  filterBadge: { backgroundColor: Colors.appBorder, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  filterBadgeTextActive: { color: Colors.white },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.3 },
  livePill: { marginLeft: 'auto', backgroundColor: `${Colors.brandLive}15`, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  livePillText: { fontSize: 13, fontWeight: '500', color: Colors.brandLive },
  matchList: { gap: 12 },
  centered: { paddingVertical: 60, alignItems: 'center' },
  empty: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  emptyIcon: {
    width: 88, height: 88, backgroundColor: Colors.appCard,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
});
