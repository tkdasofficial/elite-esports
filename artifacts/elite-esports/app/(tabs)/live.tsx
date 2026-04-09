import React, { useState, useMemo } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/store/ThemeContext';
import { GlobalHeader } from '@/components/GlobalHeader';
import { LiveMatchCard } from '@/features/live/components/LiveMatchCard';
import { SkeletonLiveCard } from '@/features/live/components/SkeletonLiveCard';
import { useLiveMatches } from '@/features/live/hooks/useLiveMatches';

const SKELETON_COUNT = 3;

export default function LiveScreen() {
  const { colors } = useTheme();
  const { matches, loading, refreshing, error, refresh, retry } = useLiveMatches();
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

  const showSkeleton = loading && matches.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.dark }}>
      <GlobalHeader onSearch={setQuery} />

      {error && matches.length === 0 ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.text.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>Could not load matches</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={retry}>
            <Ionicons name="refresh" size={21} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : showSkeleton ? (
        <FlatList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-${i}`}
          renderItem={() => <SkeletonLiveCard />}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <LiveMatchCard match={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={query ? 'search-outline' : 'radio-outline'}
                size={56}
                color={colors.text.muted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
                {query ? 'No results found' : 'No Live Matches'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.text.muted }]}>
                {query
                  ? `Nothing matched "${query}". Try a different game or prize pool.`
                  : 'Check the Home tab for upcoming tournaments'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  retryText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptyText: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    textAlign: 'center', paddingHorizontal: 32, lineHeight: 20,
  },
});
