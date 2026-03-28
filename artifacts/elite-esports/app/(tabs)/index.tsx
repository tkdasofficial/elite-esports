import React, { useState, useMemo } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { MatchCard } from '@/features/home/components/MatchCard';
import { useMatches } from '@/features/home/hooks/useMatches';

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
      m.status?.toLowerCase().includes(q)
    );
  }, [matches, query]);

  if (loading) {
    return (
      <View style={styles.container}>
        <GlobalHeader onSearch={setQuery} />
        <View style={[styles.centered, { paddingBottom: tabBarHeight }]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GlobalHeader onSearch={setQuery} />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={query ? 'search-outline' : 'game-controller-outline'}
              size={56}
              color={Colors.text.muted}
            />
            <Text style={styles.emptyTitle}>{query ? 'No results found' : 'No Matches Yet'}</Text>
            <Text style={styles.emptyText}>
              {query
                ? `Nothing matched "${query}". Try a different game or prize pool.`
                : 'Check back soon for upcoming tournaments'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 14 },
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
