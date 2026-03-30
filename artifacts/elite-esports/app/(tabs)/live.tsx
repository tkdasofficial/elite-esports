import React, { useState, useMemo } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { LiveMatchCard } from '@/features/live/components/LiveMatchCard';
import { SkeletonLiveCard } from '@/features/live/components/SkeletonLiveCard';
import { useLiveMatches } from '@/features/live/hooks/useLiveMatches';

const SKELETON_COUNT = 3;

export default function LiveScreen() {
  const { matches, loading, refreshing, refresh } = useLiveMatches();
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
      m.status?.toLowerCase().includes(q)
    );
  }, [matches, query]);

  if (loading && matches.length === 0) {
    return (
      <View style={styles.container}>
        <GlobalHeader onSearch={setQuery} />
        <FlatList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-${i}`}
          renderItem={() => <SkeletonLiveCard />}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GlobalHeader onSearch={setQuery} />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <LiveMatchCard match={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={query ? 'search-outline' : 'radio-outline'}
              size={56}
              color={Colors.text.muted}
            />
            <Text style={styles.emptyTitle}>{query ? 'No results found' : 'No Live Matches'}</Text>
            <Text style={styles.emptyText}>
              {query
                ? `Nothing matched "${query}". Try a different game or prize pool.`
                : 'Check the Home tab for upcoming tournaments'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
