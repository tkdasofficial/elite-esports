import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MatchCard } from '@/features/home/components/MatchCard';
import { SkeletonCard } from '@/features/home/components/SkeletonCard';
import { useMyMatches } from '@/features/match/hooks/useMyMatches';
import { useAuth } from '@/store/AuthContext';
import { Match } from '@/utils/types';

const SKELETON_COUNT = 4;

export default function MyMatchesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { matches, loading, refreshing, refresh } = useMyMatches(user?.id);
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const showSkeleton = (loading && matches.length === 0) || refreshing;

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Matches" />
      {showSkeleton ? (
        <FlatList
          data={Array.from({ length: SKELETON_COUNT }, (_, i) => i)}
          keyExtractor={i => `skel-${i}`}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item: Match) => item.id}
          renderItem={({ item }: { item: Match }) => (
            <MatchCard
              match={item}
              onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="game-controller-outline" size={52} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Matches Yet</Text>
              <Text style={styles.emptyText}>Join a tournament to see your matches here</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    list: { padding: 16 },
    empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
    emptyIcon: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    emptyText: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, textAlign: 'center', lineHeight: 22,
    },
  });
}
