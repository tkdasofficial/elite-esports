import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/store/ThemeContext';
import { GlobalHeader } from '@/components/GlobalHeader';
import { MatchCard } from '@/features/home/components/MatchCard';
import { SkeletonCard } from '@/features/home/components/SkeletonCard';
import { useMatches } from '@/features/home/hooks/useMatches';
import { Match } from '@/utils/types';

const SKELETON_COUNT = 4;

type StatusFilter = 'all' | 'upcoming' | 'ongoing' | 'completed';
type SortOption = 'time' | 'prize' | 'entry';
type EntryFilter = 'all' | 'free' | 'paid';

const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'ongoing',   label: 'Live' },
  { key: 'completed', label: 'Ended' },
];

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: 'time',  label: 'Time',  icon: 'clock' },
  { key: 'prize', label: 'Prize', icon: 'award' },
  { key: 'entry', label: 'Entry', icon: 'tag' },
];

const ENTRY_CHIPS: { key: EntryFilter; label: string }[] = [
  { key: 'all',  label: 'All Entries' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
];

function FilterChip({
  label, selected, onPress, colors,
}: {
  label: string; selected: boolean; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        chipStyles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.background.elevated,
          borderColor: selected ? colors.primary : colors.border.default,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[
        chipStyles.chipText,
        { color: selected ? '#fff' : colors.text.secondary },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const { matches, loading, refreshing, error, refresh, retry } = useMatches();
  const tabBarHeight = useBottomTabBarHeight();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [entryFilter, setEntryFilter] = useState<EntryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [showSort, setShowSort] = useState(false);

  const hasActiveFilters = statusFilter !== 'all' || entryFilter !== 'all' || sortBy !== 'time';

  const resetFilters = useCallback(() => {
    setStatusFilter('all');
    setEntryFilter('all');
    setSortBy('time');
    setShowSort(false);
  }, []);

  const filtered = useMemo(() => {
    let result = [...matches];

    // Search query
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(m =>
        m.game?.toLowerCase().includes(q) ||
        m.title?.toLowerCase().includes(q) ||
        String(m.prize_pool).includes(q) ||
        String(m.entry_fee).includes(q) ||
        m.status?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    // Entry fee filter
    if (entryFilter === 'free') {
      result = result.filter(m => !m.entry_fee || m.entry_fee === 0);
    } else if (entryFilter === 'paid') {
      result = result.filter(m => m.entry_fee > 0);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'prize') return (b.prize_pool ?? 0) - (a.prize_pool ?? 0);
      if (sortBy === 'entry') return (a.entry_fee ?? 0) - (b.entry_fee ?? 0);
      return new Date(b.starts_at ?? 0).getTime() - new Date(a.starts_at ?? 0).getTime();
    });

    return result;
  }, [matches, query, statusFilter, entryFilter, sortBy]);

  const showSkeleton = loading && matches.length === 0;

  const FilterBar = useMemo(() => (
    <View style={[filterStyles.bar, { backgroundColor: colors.background.dark }]}>
      {/* Status chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.row}
      >
        {STATUS_CHIPS.map(chip => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            selected={statusFilter === chip.key}
            onPress={() => setStatusFilter(chip.key)}
            colors={colors}
          />
        ))}
        <View style={filterStyles.divider} />
        {ENTRY_CHIPS.map(chip => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            selected={entryFilter === chip.key}
            onPress={() => setEntryFilter(chip.key)}
            colors={colors}
          />
        ))}
        <View style={filterStyles.divider} />
        {/* Sort button */}
        <TouchableOpacity
          style={[
            filterStyles.sortBtn,
            {
              backgroundColor: sortBy !== 'time' ? colors.primary : colors.background.elevated,
              borderColor: sortBy !== 'time' ? colors.primary : colors.border.default,
            },
          ]}
          onPress={() => setShowSort(v => !v)}
          activeOpacity={0.8}
        >
          <Feather
            name="sliders" size={12}
            color={sortBy !== 'time' ? '#fff' : colors.text.secondary}
          />
          <Text style={[
            filterStyles.sortBtnText,
            { color: sortBy !== 'time' ? '#fff' : colors.text.secondary },
          ]}>
            Sort
          </Text>
        </TouchableOpacity>
        {hasActiveFilters && (
          <TouchableOpacity
            style={[filterStyles.resetBtn, { borderColor: colors.status.error + '60' }]}
            onPress={resetFilters}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={12} color={colors.status.error} />
            <Text style={[filterStyles.resetText, { color: colors.status.error }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Sort dropdown */}
      {showSort && (
        <View style={[filterStyles.sortDropdown, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[filterStyles.sortOption, sortBy === opt.key && { backgroundColor: colors.primary + '18' }]}
              onPress={() => { setSortBy(opt.key); setShowSort(false); }}
            >
              <Feather name={opt.icon as any} size={14} color={sortBy === opt.key ? colors.primary : colors.text.secondary} />
              <Text style={[filterStyles.sortOptionText, { color: sortBy === opt.key ? colors.primary : colors.text.secondary }]}>
                Sort by {opt.label}
              </Text>
              {sortBy === opt.key && <Ionicons name="checkmark" size={14} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  ), [statusFilter, entryFilter, sortBy, showSort, hasActiveFilters, colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.dark }}>
      <GlobalHeader onSearch={setQuery} />
      {FilterBar}

      {error && matches.length === 0 ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.text.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>Could not load matches</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={retry}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : showSkeleton ? (
        <FlashList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-${i}`}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlashList
          data={filtered as Match[]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={query || hasActiveFilters ? 'search-outline' : 'game-controller-outline'}
                size={56}
                color={colors.text.muted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
                {query || hasActiveFilters ? 'No results found' : 'No Matches Yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.muted }]}>
                {query
                  ? `Nothing matched "${query}". Try a different search.`
                  : hasActiveFilters
                  ? 'Try changing the filters above.'
                  : 'Check back soon for upcoming tournaments.'}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={[styles.retryBtn, { backgroundColor: colors.background.elevated, marginTop: 4 }]}
                  onPress={resetFilters}
                >
                  <Ionicons name="close-circle-outline" size={16} color={colors.text.secondary} />
                  <Text style={[styles.retryText, { color: colors.text.secondary }]}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const filterStyles = StyleSheet.create({
  bar: { paddingTop: 6, paddingBottom: 6, position: 'relative', zIndex: 10 },
  row: { paddingHorizontal: 16, gap: 8, alignItems: 'center', flexDirection: 'row' },
  divider: { width: 1, height: 20, backgroundColor: '#33333355', marginHorizontal: 2 },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  sortBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  resetText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sortDropdown: {
    position: 'absolute',
    top: 44, right: 16,
    borderWidth: 1, borderRadius: 14,
    overflow: 'hidden', zIndex: 100,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 8, minWidth: 180,
  },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  sortOptionText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
});

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  retryText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
