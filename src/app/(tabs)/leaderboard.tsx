import React, { useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { LeaderboardTab } from '@/utils/types';
import { GlobalHeader } from '@/components/GlobalHeader';
import { LeaderRow } from '@/features/leaderboard/components/LeaderRow';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';

const TABS: LeaderboardTab[] = ['Solo', 'Squad'];

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Solo');
  const { data, loading, refreshing, refresh } = useLeaderboard(activeTab);
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <LeaderRow item={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.colRank}>#</Text>
              <Text style={styles.colPlayer}>Player</Text>
              <Text style={styles.colStats}>Kills / Points</Text>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', margin: 16, backgroundColor: Colors.background.elevated, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, gap: 6 },
  listHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 4 },
  colRank: { width: 36, fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  colPlayer: { flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted, marginLeft: 40 },
  colStats: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
