import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { supabase } from '@/services/supabase';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

interface LeaderEntry {
  id: string;
  username: string;
  kills: number;
  points: number;
  rank: number;
  avatar_url?: string;
}

const TABS = ['Solo', 'Squad'] as const;
type Tab = typeof TABS[number];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = ['trophy', 'medal', 'ribbon'];

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Solo');
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  const fetchData = async () => {
    const { data: rows } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('type', activeTab.toLowerCase())
      .order('points', { ascending: false })
      .limit(50);
    if (rows) setData(rows.map((r, i) => ({ ...r, rank: i + 1 })));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { setLoading(true); fetchData(); }, [activeTab]);

  const renderItem = ({ item }: { item: LeaderEntry }) => {
    const isTop3 = item.rank <= 3;
    const rankColor = isTop3 ? RANK_COLORS[item.rank - 1] : Colors.text.muted;

    return (
      <View style={[styles.row, isTop3 && styles.topRow]}>
        <View style={styles.rankCol}>
          {isTop3 ? (
            <Ionicons name={RANK_ICONS[item.rank - 1] as any} size={20} color={rankColor} />
          ) : (
            <Text style={[styles.rankText, { color: rankColor }]}>{item.rank}</Text>
          )}
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
        <View style={styles.statsCol}>
          <View style={styles.killChip}>
            <MaterialCommunityIcons name="sword" size={11} color={Colors.primary} />
            <Text style={styles.killText}>{item.kills}</Text>
          </View>
          <Text style={[styles.points, isTop3 && { color: rankColor }]}>{item.points} pts</Text>
        </View>
      </View>
    );
  };

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

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
          scrollEnabled={!!data.length}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.colRank}>#</Text>
              <Text style={styles.colPlayer}>Player</Text>
              <Text style={styles.colStats}>Kills / Points</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={56} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No Data</Text>
              <Text style={styles.emptyText}>Leaderboard will populate after matches</Text>
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
  listHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    paddingHorizontal: 12, marginBottom: 4,
  },
  colRank: { width: 36, fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  colPlayer: { flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted, marginLeft: 40 },
  colStats: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card,
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  topRow: { borderColor: Colors.border.default, backgroundColor: Colors.background.elevated },
  rankCol: { width: 36, alignItems: 'center' },
  rankText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: Colors.border.default,
  },
  avatarText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.primary },
  username: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  statsCol: { alignItems: 'flex-end', gap: 3 },
  killChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(254,76,17,0.1)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  killText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  points: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
