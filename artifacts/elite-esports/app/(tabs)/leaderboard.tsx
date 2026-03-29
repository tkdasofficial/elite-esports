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

      {/* Segment control */}
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.segBtn, activeTab === tab && styles.segBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segText, activeTab === tab && styles.segTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={[styles.centered, { paddingBottom: tabBarHeight }]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <LeaderRow item={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View style={styles.colHeader}>
              <Text style={[styles.colLabel, { width: 36, textAlign: 'center' }]}>#</Text>
              <Text style={[styles.colLabel, { flex: 1, marginLeft: 50 }]}>Player</Text>
              <Text style={styles.colLabel}>Stats</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={52} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No Data Yet</Text>
              <Text style={styles.emptyText}>Leaderboard populates after matches end</Text>
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

  segmentWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.background.elevated,
    borderRadius: 10,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  segBtnActive: {
    backgroundColor: Colors.background.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.default,
  },
  segText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
  },
  segTextActive: {
    color: Colors.text.primary,
  },

  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  colLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  list: { paddingHorizontal: 16, paddingTop: 0, gap: 6 },
  empty: { alignItems: 'center', paddingTop: 72, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
