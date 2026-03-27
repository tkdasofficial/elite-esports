import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { supabase } from '@/services/supabase';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

interface LiveMatch {
  id: string;
  title: string;
  game: string;
  banner_url?: string;
  stream_url?: string;
  players_joined: number;
  max_players: number;
  prize_pool: number;
}

export default function LiveScreen() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  const fetchLive = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'ongoing')
      .order('created_at', { ascending: false });
    if (data) setMatches(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLive();
    const channel = supabase
      .channel('live-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchLive)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLive(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>LIVE NOW</Text>
            </View>
            <Text style={styles.sectionTitle}>Active Matches</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.bannerContainer}>
              {item.banner_url ? (
                <Image source={{ uri: item.banner_url }} style={styles.banner} contentFit="cover" />
              ) : (
                <LinearGradient colors={['#1A0500', '#0A0A0A']} style={styles.banner}>
                  <Ionicons name="game-controller-outline" size={44} color={Colors.primary} />
                </LinearGradient>
              )}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bannerGradient}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.gameTag}>{item.game}</Text>
              <Text style={styles.matchTitle} numberOfLines={2}>{item.title}</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={14} color={Colors.text.secondary} />
                  <Text style={styles.infoText}>{item.players_joined}/{item.max_players}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="trophy-outline" size={14} color={Colors.primary} />
                  <Text style={[styles.infoText, { color: Colors.primary }]}>₹{item.prize_pool}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.watchBtn}
                onPress={() => item.stream_url && Linking.openURL(item.stream_url)}
                activeOpacity={0.8}
              >
                <Ionicons name="play-circle" size={20} color="#fff" />
                <Text style={styles.watchBtnText}>Watch Live</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="radio-outline" size={56} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No Live Matches</Text>
            <Text style={styles.emptyText}>Check the Home tab for upcoming tournaments</Text>
          </View>
        }
        scrollEnabled={matches.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 16 },
  sectionHeader: { marginBottom: 8 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.ongoing },
  liveLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.status.ongoing, letterSpacing: 1.5 },
  sectionTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  card: { backgroundColor: Colors.background.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden' },
  bannerContainer: { position: 'relative' },
  banner: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' },
  bannerGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, justifyContent: 'flex-end', padding: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239,68,68,0.9)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  cardBody: { padding: 16 },
  gameTag: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  matchTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  watchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.status.error, borderRadius: 10, height: 44,
  },
  watchBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
