import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/store/ThemeContext';
import { GlobalHeader } from '@/components/GlobalHeader';
import { MatchCard } from '@/features/home/components/MatchCard';
import { SkeletonCard } from '@/features/home/components/SkeletonCard';
import { useMatches } from '@/features/home/hooks/useMatches';
import { Match } from '@/utils/types';

const SKELETON_COUNT = 4;

export default function HomeScreen() {
  const { colors } = useTheme();
  const { matches, loading, refreshing, refresh } = useMatches();
  const tabBarHeight = useBottomTabBarHeight();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return matches;
    const q = query.toLowerCase().trim();
    return matches.filter(m =>
      m.game?.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q) ||
      String(m.prize_pool).includes(q) ||
      String(m.entry_fee).includes(q) ||
      m.status?.toLowerCase().includes(q),
    );
  }, [matches, query]);

  const showSkeleton = (loading && matches.length === 0) || refreshing;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.dark }}>
      <GlobalHeader onSearch={setQuery} />

      {showSkeleton ? (
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
              refreshing={false}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={query ? 'search-outline' : 'game-controller-outline'}
                size={56}
                color={colors.text.muted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
                {query ? 'No results found' : 'No Matches Yet'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.muted }]}>
                {query
                  ? `Nothing matched "${query}". Try a different game or prize.`
                  : 'Check back soon for upcoming tournaments.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
