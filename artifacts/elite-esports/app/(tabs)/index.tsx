import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';
import { supabase } from '@/services/supabase';
import { GlobalHeader } from '@/components/GlobalHeader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

interface Match {
  id: string;
  title: string;
  game: string;
  banner_url?: string;
  entry_fee: number;
  prize_pool: number;
  players_joined: number;
  max_players: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  starts_at: string;
}

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: Colors.status.upcoming },
  ongoing: { label: 'Live', color: Colors.status.ongoing },
  completed: { label: 'Ended', color: Colors.status.completed },
  cancelled: { label: 'Cancelled', color: Colors.status.cancelled },
};

function MatchCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const cfg = STATUS_CONFIG[match.status] || STATUS_CONFIG.upcoming;
  const isFull = match.players_joined >= match.max_players;
  const progress = Math.min(match.players_joined / match.max_players, 1);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.bannerContainer}>
        {match.banner_url ? (
          <Image source={{ uri: match.banner_url }} style={styles.banner} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#1A0500', '#2A1000']} style={styles.banner}>
            <Ionicons name="game-controller-outline" size={48} color={Colors.primary} />
          </LinearGradient>
        )}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
          {match.status === 'ongoing' && <View style={styles.liveDot} />}
          <Text style={styles.statusText}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.gameLabel}>{match.game}</Text>
        <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{match.entry_fee}</Text>
            <Text style={styles.statLabel}>Entry</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>₹{match.prize_pool}</Text>
            <Text style={styles.statLabel}>Prize Pool</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{match.players_joined}/{match.max_players}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>

        <TouchableOpacity
          style={[styles.joinBtn, (isFull || match.status !== 'upcoming') && styles.joinBtnDisabled]}
          onPress={onPress}
          disabled={isFull || match.status !== 'upcoming'}
          activeOpacity={0.8}
        >
          <Text style={styles.joinBtnText}>
            {isFull ? 'Full' : match.status === 'upcoming' ? 'Join Match' : match.status === 'ongoing' ? 'View' : 'Details'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMatches(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMatches();
    const channel = supabase
      .channel('matches-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchMatches(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <GlobalHeader />
        <View style={styles.centered}>
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
        renderItem={({ item }) => (
          <MatchCard match={item} onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tournaments</Text>
            <Text style={styles.sectionSubtitle}>Join & compete for prizes</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={56} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptyText}>Check back soon for upcoming tournaments</Text>
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
  sectionTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  sectionSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.background.card, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden',
  },
  bannerContainer: { position: 'relative' },
  banner: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' },
  statusBadge: {
    position: 'absolute', top: 10, left: 10, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  cardBody: { padding: 16 },
  gameLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  matchTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border.default },
  progressTrack: { height: 4, backgroundColor: Colors.background.elevated, borderRadius: 2, marginBottom: 14 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  joinBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    height: 44, alignItems: 'center', justifyContent: 'center',
  },
  joinBtnDisabled: { backgroundColor: Colors.background.surface },
  joinBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
