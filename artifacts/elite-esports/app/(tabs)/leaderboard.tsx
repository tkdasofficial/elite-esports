import React, { useMemo } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/store/ThemeContext';
import { GlobalHeader } from '@/components/GlobalHeader';
import { LeaderRow } from '@/features/leaderboard/components/LeaderRow';
import { useLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard';
import { SkeletonBar } from '@/components/SkeletonBar';

const SKELETON_COUNT = 10;

function SkeletonLeaderRow() {
  const { colors } = useTheme();
  return (
    <View style={[skStyles.row, { backgroundColor: colors.background.card, borderColor: colors.border.subtle }]}>
      <SkeletonBar width={28} height={14} radius={5} style={{ marginRight: 8 }} />
      <SkeletonBar width={42} height={42} radius={21} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBar width="50%" height={13} radius={5} />
      </View>
      <SkeletonBar width={72} height={32} radius={8} />
    </View>
  );
}

const skStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 6 },
});

export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { data, loading, refreshing, refresh } = useLeaderboard();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const showSkeleton = loading && data.length === 0;

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.colRank}><Text style={styles.colLabel}>#</Text></View>
      <View style={{ width: 42, marginRight: 12 }} />
      <Text style={[styles.colLabel, { flex: 1 }]}>Player</Text>
      <View style={styles.trophyHeader}>
        <Ionicons name="trophy" size={20} color="#FFA200" />
        <Text style={styles.colLabel}>Wins</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <GlobalHeader />

      {showSkeleton ? (
        <FlatList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-lb-${i}`}
          renderItem={() => <SkeletonLeaderRow />}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <LeaderRow item={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={56} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No Winners Yet</Text>
              <Text style={styles.emptyText}>
                Players appear here once they win a match
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },

    list: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
    listHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 6, paddingHorizontal: 12, marginBottom: 4,
    },
    colRank: { width: 36, alignItems: 'center' },
    colLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text.muted },
    trophyHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },

    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary },
    emptyText: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, textAlign: 'center', paddingHorizontal: 32,
    },
  });
}
