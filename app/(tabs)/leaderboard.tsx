import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

interface LeaderboardEntry {
  id: string;
  username: string;
  coins: number;
  rank: string;
  wins: number;
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, coins, rank')
      .order('coins', { ascending: false })
      .limit(50);

    if (data) {
      setPlayers(data.map((p: any) => ({
        id: p.id,
        username: p.username ?? 'Unknown',
        coins: p.coins ?? 0,
        rank: p.rank ?? 'Bronze',
        wins: 0,
      })));
    }
    setLoading(false);
  };

  const myIndex = players.findIndex(p => p.id === user?.id);

  const renderPodium = () => {
    if (players.length < 3) return null;
    const [first, second, third] = players;
    return (
      <View style={styles.podium}>
        {/* Second */}
        <View style={[styles.podiumItem, styles.podiumSecond]}>
          <Text style={styles.podiumMedal}>🥈</Text>
          <LetterAvatar name={second.username} size="lg" />
          <Text style={styles.podiumName} numberOfLines={1}>{second.username}</Text>
          <Text style={styles.podiumCoins}>₹{second.coins}</Text>
          <View style={[styles.podiumBlock, { height: 60, backgroundColor: '#C0C0C0' }]}>
            <Text style={styles.podiumRank}>2</Text>
          </View>
        </View>

        {/* First */}
        <View style={[styles.podiumItem, styles.podiumFirst]}>
          <Text style={styles.podiumCrown}>👑</Text>
          <LetterAvatar name={first.username} size="xl" />
          <Text style={styles.podiumName} numberOfLines={1}>{first.username}</Text>
          <Text style={styles.podiumCoins}>₹{first.coins}</Text>
          <View style={[styles.podiumBlock, { height: 80, backgroundColor: '#FFD700' }]}>
            <Text style={styles.podiumRank}>1</Text>
          </View>
        </View>

        {/* Third */}
        <View style={[styles.podiumItem, styles.podiumThird]}>
          <Text style={styles.podiumMedal}>🥉</Text>
          <LetterAvatar name={third.username} size="lg" />
          <Text style={styles.podiumName} numberOfLines={1}>{third.username}</Text>
          <Text style={styles.podiumCoins}>₹{third.coins}</Text>
          <View style={[styles.podiumBlock, { height: 44, backgroundColor: '#CD7F32' }]}>
            <Text style={styles.podiumRank}>3</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isMe = item.id === user?.id;
    const rank = index + 1;
    return (
      <View style={[styles.row, isMe && styles.rowHighlight]}>
        <Text style={[styles.rowRank, rank <= 3 && { color: RANK_COLORS[rank - 1] }]}>
          {rank}
        </Text>
        <LetterAvatar name={item.username} size="md" />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{item.username}{isMe ? ' (You)' : ''}</Text>
          <Text style={styles.rowRankLabel}>{item.rank}</Text>
        </View>
        <View style={styles.rowCoins}>
          <Ionicons name="flash" size={13} color={Colors.brandWarning} />
          <Text style={styles.rowCoinsText}>₹{item.coins}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <TouchableOpacity onPress={loadLeaderboard}>
          <Ionicons name="refresh" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderPodium}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {!loading && myIndex > 2 && (
        <View style={[styles.myPosition, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.myPositionText}>Your Rank: #{myIndex + 1}</Text>
          <Text style={styles.myPositionCoins}>₹{user?.coins ?? 0}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 8,
    backgroundColor: Colors.appCard, marginHorizontal: 16, borderRadius: 20, marginBottom: 16,
  },
  podiumItem: { alignItems: 'center', flex: 1, gap: 4 },
  podiumFirst: { marginBottom: 0 },
  podiumSecond: { marginBottom: 0 },
  podiumThird: { marginBottom: 0 },
  podiumCrown: { fontSize: 24, marginBottom: 4 },
  podiumMedal: { fontSize: 20, marginBottom: 4 },
  podiumName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  podiumCoins: { fontSize: 11, color: Colors.textMuted },
  podiumBlock: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, alignItems: 'center', justifyContent: 'center' },
  podiumRank: { fontSize: 16, fontWeight: '800', color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 80 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: Colors.appCard, borderRadius: 14, marginBottom: 8,
  },
  rowHighlight: { borderWidth: 1, borderColor: Colors.brandPrimary + '40', backgroundColor: Colors.brandPrimary + '08' },
  rowRank: { width: 28, fontSize: 15, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  rowRankLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowCoins: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowCoinsText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  myPosition: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.appCard,
    borderTopWidth: 1, borderTopColor: Colors.appBorder,
  },
  myPositionText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  myPositionCoins: { fontSize: 14, fontWeight: '600', color: Colors.brandPrimary },
});
