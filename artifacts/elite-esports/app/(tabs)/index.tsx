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
import { AdvancedFiltersSheet, AdvancedFilters } from '@/features/home/components/AdvancedFiltersSheet';
import { useMatches } from '@/features/home/hooks/useMatches';
import { useMatchOptions } from '@/features/home/hooks/useMatchOptions';
import { Match } from '@/utils/types';

const SKELETON_COUNT = 4;

type StatusFilter = 'all' | 'upcoming' | 'ongoing' | 'completed';

const STATUS_CHIPS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'all',       label: 'All',      color: '#8B5CF6' },
  { key: 'ongoing',   label: 'Live',     color: '#22C55E' },
  { key: 'upcoming',  label: 'Upcoming', color: '#3B82F6' },
  { key: 'completed', label: 'Ended',    color: '#666666' },
];

const DEFAULT_ADV_FILTERS: AdvancedFilters = {
  sortBy: 'time',
  entryFilter: 'all',
  selectedGame: null,
  selectedMode: null,
  selectedSquad: null,
};

function StatusChip({
  label, selected, color, onPress,
}: {
  label: string; selected: boolean; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        chipStyles.chip,
        selected
          ? { backgroundColor: color + '20', borderColor: color }
          : { backgroundColor: 'transparent', borderColor: 'transparent' },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {selected && label === 'Live' && <View style={[chipStyles.liveDot, { backgroundColor: color }]} />}
      <Text style={[
        chipStyles.chipText,
        { color: selected ? color : '#888888' },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});

export default function HomeScreen() {
  const { colors } = useTheme();
  const { matches, loading, refreshing, error, refresh, retry } = useMatches();
  const { modes: adminModes, squads: adminSquads } = useMatchOptions();
  const tabBarHeight = useBottomTabBarHeight();
  const [query, setQuery]               = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advFilters, setAdvFilters]     = useState<AdvancedFilters>(DEFAULT_ADV_FILTERS);

  const advActiveCount = useMemo(() => [
    advFilters.sortBy !== 'time',
    advFilters.entryFilter !== 'all',
    !!advFilters.selectedGame,
    !!advFilters.selectedMode,
    !!advFilters.selectedSquad,
  ].filter(Boolean).length, [advFilters]);

  const hasActiveFilters = statusFilter !== 'all' || advActiveCount > 0;

  const resetAll = useCallback(() => {
    setStatusFilter('all');
    setAdvFilters(DEFAULT_ADV_FILTERS);
  }, []);

  /* Derive unique option lists from loaded matches */
  const availableGames = useMemo(() => {
    const s = new Set(matches.map(m => m.game).filter(Boolean));
    return Array.from(s).sort();
  }, [matches]);

  const availableModes = useMemo(() => {
    const s = new Set(matches.map(m => m.game_mode).filter((v): v is string => !!v));
    return Array.from(s).sort();
  }, [matches]);

  const availableSquads = useMemo(() => {
    const s = new Set(matches.map(m => m.squad_type).filter((v): v is string => !!v));
    return Array.from(s).sort();
  }, [matches]);

  const filtered = useMemo(() => {
    let result = [...matches];

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

    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    if (advFilters.entryFilter === 'free') {
      result = result.filter(m => !m.entry_fee || m.entry_fee === 0);
    } else if (advFilters.entryFilter === 'paid') {
      result = result.filter(m => m.entry_fee > 0);
    }

    if (advFilters.selectedGame) {
      result = result.filter(m => m.game === advFilters.selectedGame);
    }

    if (advFilters.selectedMode) {
      result = result.filter(m => m.game_mode === advFilters.selectedMode);
    }

    if (advFilters.selectedSquad) {
      result = result.filter(m => m.squad_type === advFilters.selectedSquad);
    }

    result.sort((a, b) => {
      if (advFilters.sortBy === 'prize') return (b.prize_pool ?? 0) - (a.prize_pool ?? 0);
      if (advFilters.sortBy === 'entry') return (a.entry_fee ?? 0) - (b.entry_fee ?? 0);
      return new Date(b.starts_at ?? 0).getTime() - new Date(a.starts_at ?? 0).getTime();
    });

    return result;
  }, [matches, query, statusFilter, advFilters]);

  const showSkeleton = loading && matches.length === 0;

  /* ── Filter Bar ── */
  const FilterBar = (
    <View style={[filterStyles.bar, { backgroundColor: colors.background.dark }]}>
      <View style={filterStyles.row}>
        {/* Status chips — scrollable left side */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={filterStyles.chipsContainer}
          style={filterStyles.chipsScroll}
        >
          {STATUS_CHIPS.map(chip => (
            <StatusChip
              key={chip.key}
              label={chip.label}
              selected={statusFilter === chip.key}
              color={chip.color}
              onPress={() => setStatusFilter(chip.key)}
            />
          ))}
        </ScrollView>

        {/* Right side — Filters button (fixed) */}
        <View style={filterStyles.rightSection}>
          {hasActiveFilters && (
            <TouchableOpacity
              style={[filterStyles.resetBtn, { borderColor: colors.status.error + '50' }]}
              onPress={resetAll}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={12} color={colors.status.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              filterStyles.filtersBtn,
              {
                backgroundColor: advActiveCount > 0 ? colors.primary : colors.background.elevated,
                borderColor: advActiveCount > 0 ? colors.primary : colors.border.default,
              },
            ]}
            onPress={() => setShowAdvanced(true)}
            activeOpacity={0.8}
          >
            <Feather
              name="sliders"
              size={14}
              color={advActiveCount > 0 ? '#fff' : colors.text.secondary}
            />
            <Text style={[
              filterStyles.filtersBtnText,
              { color: advActiveCount > 0 ? '#fff' : colors.text.secondary },
            ]}>
              Filters
            </Text>
            {advActiveCount > 0 && (
              <View style={filterStyles.badge}>
                <Text style={filterStyles.badgeText}>{advActiveCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
                  onPress={resetAll}
                >
                  <Ionicons name="close-circle-outline" size={16} color={colors.text.secondary} />
                  <Text style={[styles.retryText, { color: colors.text.secondary }]}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <AdvancedFiltersSheet
        visible={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        filters={advFilters}
        onApply={setAdvFilters}
        availableGames={availableGames}
        availableModes={adminModes.length > 0 ? adminModes : availableModes}
        availableSquads={adminSquads.length > 0 ? adminSquads : availableSquads}
      />
    </View>
  );
}

const filterStyles = StyleSheet.create({
  bar: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1E1E1E22' },
  row: { flexDirection: 'row', alignItems: 'center' },
  chipsScroll: { flex: 1 },
  chipsContainer: { paddingLeft: 14, paddingRight: 6, gap: 6, alignItems: 'center', flexDirection: 'row' },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 14, paddingLeft: 4 },
  filtersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  filtersBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#EE3D2D' },
  resetBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
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
    alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center',
  },
  emptyText: {
    fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20,
  },
});
