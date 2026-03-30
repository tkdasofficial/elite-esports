import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { MatchCard } from '@/features/home/components/MatchCard';
import { SkeletonCard } from '@/features/home/components/SkeletonCard';
import { useMatches } from '@/features/home/hooks/useMatches';
import { Match } from '@/utils/types';

const SKELETON_COUNT = 4;

export default function HomeScreen() {
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

  return (
    <View style={styles.container}>
      <GlobalHeader onSearch={setQuery} />

      {loading && matches.length === 0 ? (
        // Full skeleton screen
        <FlashList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-${i}`}
          estimatedItemSize={340}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlashList
          data={filtered as Match[]}
          keyExtractor={item => item.id}
          estimatedItemSize={340}
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
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={query ? 'search-outline' : 'game-controller-outline'}
                size={56}
                color={Colors.text.muted}
              />
              <Text style={styles.emptyTitle}>
                {query ? 'No results found' : 'No Matches Yet'}
              </Text>
              <Text style={styles.emptyText}>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
