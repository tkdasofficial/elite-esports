import React from 'react';
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

  if (loading) {
    return (
      <View style={styles.container}>
        <GlobalHeader />
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <FlatList
        data={matches}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MatchCard match={item} onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tournaments</Text>
            <Text style={styles.sectionSub}>Join & compete for prizes</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="game-controller-outline" size={56} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptyText}>Check back soon for upcoming tournaments</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 16 },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  sectionSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
