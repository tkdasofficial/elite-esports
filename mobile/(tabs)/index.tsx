import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchStore } from '@/src/store/matchStore';
import { useGameStore } from '@/src/store/gameStore';
import { useUserStore } from '@/src/store/userStore';
import { MatchCard } from '@/components/MatchCard';
import { Colors } from '@/src/theme/colors';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { liveMatches, upcomingMatches, completedMatches, searchQuery, setSearchQuery, loading } = useMatchStore();
  const allGames = useGameStore(s => s.games);
  const { user } = useUserStore();
  const activeGames = allGames.filter(g => g.status === 'active');
  const now = new Date();

  const GAMES = ['All', ...activeGames.map(g => g.name)];
  const [activeFilter, setActiveFilter] = useState('All');

  const filterMatches = (matches: any[]) =>
    matches.filter(m => {
      if (m.delete_at && new Date(m.delete_at) < now) return false;
      if (m.status === 'completed' && m.show_until && new Date(m.show_until) < now) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || m.game_name.toLowerCase().includes(q);
      }
      if (activeFilter !== 'All') return m.game_name === activeFilter;
      return true;
    });

  const live = filterMatches(liveMatches);
  const upcoming = filterMatches(upcomingMatches);
  const completed = filterMatches(completedMatches);

  const SectionHeader = ({ label, count, badgeLabel, badgePath }: { label: string; count?: number; badgeLabel?: string; badgePath?: string }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <Text style={styles.sectionTitle}>{label}</Text>
        {count !== undefined && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {badgeLabel && badgePath && (
        <TouchableOpacity onPress={() => router.push(badgePath as any)}>
          <Text style={styles.seeAll}>{badgeLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day,</Text>
          <Text style={styles.username}>{user?.username || 'Player'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.coinBadge}>
            <Ionicons name="flash" size={14} color={Colors.brandWarning} />
            <Text style={styles.coinText}>₹{user?.coins || 0}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search tournaments..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Game filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {GAMES.map(g => {
            const isActive = g === activeFilter;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => setActiveFilter(g)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && !live.length && !upcoming.length && (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.brandPrimary} size="large" />
          </View>
        )}

        {!loading && !live.length && !upcoming.length && !completed.length && (
          <View style={styles.empty}>
            <Ionicons name="game-controller-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Tournaments Yet</Text>
            <Text style={styles.emptyText}>Admin will add tournaments soon. Check back later!</Text>
          </View>
        )}

        {live.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Live Now" count={live.length} badgeLabel="See All" badgePath="/tournaments?filter=live" />
            {live.slice(0, 3).map(m => <MatchCard key={m.match_id} match={m} />)}
            {live.length > 3 && (
              <TouchableOpacity style={styles.viewMoreBtn} onPress={() => router.push('/tournaments?filter=live' as any)}>
                <Text style={styles.viewMoreText}>View all {live.length} live matches</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {upcoming.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Upcoming" badgeLabel="View All" badgePath="/tournaments?filter=upcoming" />
            {upcoming.slice(0, 3).map(m => <MatchCard key={m.match_id} match={m} />)}
            {upcoming.length > 3 && (
              <TouchableOpacity style={styles.viewMoreBtn} onPress={() => router.push('/tournaments?filter=upcoming' as any)}>
                <Text style={styles.viewMoreText}>View all {upcoming.length} upcoming</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {completed.length > 0 && (
          <View style={[styles.section, styles.completedSection]}>
            <SectionHeader label="Recently Finished" badgeLabel="History" badgePath="/tournaments?filter=completed" />
            {completed.slice(0, 2).map(m => <MatchCard key={m.match_id} match={m} />)}
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
  greeting: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  username: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.appElevated,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  coinText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  notifBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.appElevated,
    marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1, borderColor: Colors.appBorder,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },
  chips: { paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: Colors.appElevated, borderRadius: 20,
  },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  section: { gap: 12, marginTop: 8 },
  completedSection: { opacity: 0.7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.3 },
  countBadge: {
    backgroundColor: Colors.brandLive, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 1,
  },
  countText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  seeAll: { fontSize: 15, color: Colors.brandPrimary },
  viewMoreBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, backgroundColor: Colors.appElevated, borderRadius: 14,
  },
  viewMoreText: { fontSize: 14, fontWeight: '500', color: Colors.brandPrimary },
  centered: { paddingVertical: 60, alignItems: 'center' },
  empty: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
