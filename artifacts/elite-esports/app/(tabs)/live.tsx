import React from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { LiveMatchCard } from '@/features/live/components/LiveMatchCard';
import { useLiveMatches } from '@/features/live/hooks/useLiveMatches';

export default function LiveScreen() {
  const { matches, loading, refreshing, refresh } = useLiveMatches();
  const tabBarHeight = useBottomTabBarHeight();

  if (loading) {
    return (
      <View style={styles.container}>
        <GlobalHeader />
        <View style={[styles.centered, { paddingBottom: tabBarHeight }]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <FlatList
        data={matches}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <LiveMatchCard match={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
        ListHeaderComponent={null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="radio-outline" size={56} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No Live Matches</Text>
            <Text style={styles.emptyText}>Check the Home tab for upcoming tournaments</Text>
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
  sectionHeader: { marginBottom: 10 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.ongoing },
  liveLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.status.ongoing,
    letterSpacing: 1.5,
  },
  sectionTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary, letterSpacing: -0.5 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
