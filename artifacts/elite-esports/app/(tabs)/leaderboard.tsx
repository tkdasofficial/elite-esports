import React, { useState } from 'react';
import { Dimensions, View, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { LeaderboardTab } from '@/utils/types';
import { GlobalHeader } from '@/components/GlobalHeader';
import { LeaderRow } from '@/features/leaderboard/components/LeaderRow';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { SkeletonBar } from '@/components/SkeletonBar';

const TABS: LeaderboardTab[] = ['Solo', 'Squad'];
const SKELETON_COUNT = 8;
const SCREEN_W = Dimensions.get('window').width;

function SkeletonLeaderRow({ rank }: { rank: number }) {
  return (
    <View style={skStyles.row}>
      <SkeletonBar width={28} height={14} radius={5} style={{ marginRight: 8 }} />
      <SkeletonBar width={36} height={36} radius={18} style={{ marginRight: 10 }} />
      <View style={{ flex: 1, gap: 5 }}>
        <SkeletonBar width="55%" height={13} radius={5} />
        <SkeletonBar width="35%" height={10} radius={4} />
      </View>
      <SkeletonBar width={56} height={13} radius={5} />
    </View>
  );
}

const skStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Solo');
  const { data, loading, refreshing, refresh } = useLeaderboard(activeTab);
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && data.length === 0 ? (
        <FlatList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-lb-${i}`}
          renderItem={({ index }) => <SkeletonLeaderRow rank={index + 1} />}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <SkeletonBar width={12} height={10} radius={4} style={{ marginRight: 36 }} />
              <SkeletonBar width={60} height={10} radius={4} />
              <View style={{ flex: 1 }} />
              <SkeletonBar width={80} height={10} radius={4} />
            </View>
          }
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <LeaderRow item={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.colRankWrapper}>
                <Text style={styles.colLabel}>#</Text>
              </View>
              <View style={styles.colPlayerWrapper}>
                <Text style={styles.colLabel}>Player</Text>
              </View>
              <Text style={styles.colLabel}>Kills / Points</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={56} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No Data Yet</Text>
              <Text style={styles.emptyText}>Leaderboard populates after matches</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  tabBar: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: Colors.background.elevated,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 6 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  colRankWrapper: { width: 36, alignItems: 'center' },
  colPlayerWrapper: { flex: 1, marginLeft: 46 },
  colLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
