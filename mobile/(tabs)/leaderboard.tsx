import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { useMatchStore } from '@/src/store/matchStore';
import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { AppHeader } from '@/components/AppHeader';
import { Colors } from '@/src/theme/colors';

interface LeaderboardEntry {
  id: string;
  username: string;
  coins: number;
  rank: string;
}

const FILTERS = ['Tournaments', 'Rankings'] as const;
type FilterType = typeof FILTERS[number];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_EMOJI = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const { completedMatches } = useMatchStore();
  const [filter, setFilter] = useState<FilterType>('Tournaments');
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeaderboard(); }, []);

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
      })));
    }
    setLoading(false);
  };

  const matchesWithWinners = completedMatches
    .filter(m => m.winners && Object.keys(m.winners).length > 0)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const top3 = players.slice(0, 3);
  const myIndex = players.findIndex(p => p.id === user?.id);

  return (
    <View style={styles.container}>
      <AppHeader title="Leaderboard" />

      {/* Filter toggle */}
      <View style={styles.filterWrapper}>
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} size="large" />
        </View>
      ) : filter === 'Rankings' ? (
        <FlatList
          data={players}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            top3.length >= 3 ? (
              <View style={styles.podium}>
                {[1, 0, 2].map(idx => {
                  const p = top3[idx];
                  const pos = idx + 1;
                  const heights = [80, 100, 60];
                  const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['md', 'xl', 'md'];
                  if (!p) return null;
                  return (
                    <View key={pos} style={[styles.podiumItem, { flex: 1 }]}>
                      {idx === 0 && <Text style={styles.crown}>👑</Text>}
                      {idx !== 0 && <Text style={styles.medal}>{MEDAL_EMOJI[idx]}</Text>}
                      <LetterAvatar name={p.username} size={sizes[idx]} />
                      <Text style={styles.podiumName} numberOfLines={1}>{p.username}</Text>
                      <Text style={styles.podiumCoins}>₹{p.coins.toLocaleString()}</Text>
                      <View style={[styles.podiumBlock, { height: heights[idx], backgroundColor: RANK_COLORS[idx] + '30', borderColor: RANK_COLORS[idx] + '50', borderWidth: 1 }]}>
                        <Text style={[styles.podiumRank, { color: RANK_COLORS[idx] }]}>#{pos}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isMe = item.id === user?.id;
            const pos = index + 1;
            return (
              <View style={[styles.row, isMe && styles.rowHighlight]}>
                <Text style={[styles.rowPos, pos <= 3 && { color: RANK_COLORS[pos - 1] }]}>{pos}</Text>
                <LetterAvatar name={item.username} size="sm" />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.username}{isMe ? ' (You)' : ''}
                  </Text>
                  <Text style={styles.rowRank}>{item.rank}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Ionicons name="flash" size={12} color={Colors.brandWarning} />
                  <Text style={styles.rowCoins}>₹{item.coins.toLocaleString()}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="trophy-outline" size={36} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Rankings Yet</Text>
              <Text style={styles.emptyText}>Leaderboard updates as players compete</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={matchesWithWinners}
          keyExtractor={item => item.match_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item: match }) => {
            const w = match.winners!;
            const podium = [
              { pos: 2, player: w.second, color: '#C0C0C0' },
              { pos: 1, player: w.first,  color: '#FFD700' },
              { pos: 3, player: w.third,  color: '#CD7F32' },
            ];
            return (
              <View style={styles.tournamentCard}>
                <View style={styles.tournamentBanner}>
                  {match.banner_image ? (
                    <Image source={{ uri: match.banner_image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.appElevated }]} />
                  )}
                  <View style={[StyleSheet.absoluteFill, styles.bannerOverlay]} />
                  <View style={styles.bannerContent}>
                    <View style={styles.trophyIcon}>
                      <Ionicons name="trophy" size={16} color={Colors.brandPrimaryLight} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.bannerTitle} numberOfLines={1}>{match.title}</Text>
                      <Text style={styles.bannerSub}>{match.game_name} · {match.mode}</Text>
                    </View>
                    <Text style={styles.bannerPrize}>{match.prize}</Text>
                  </View>
                </View>

                <View style={styles.miniPodium}>
                  {podium.map(({ pos, player, color }) => {
                    const heights = [60, 80, 44];
                    const h = heights[pos - 1];
                    if (!player) {
                      return (
                        <View key={pos} style={styles.miniPodiumSlot}>
                          <View style={[styles.miniAvatar, styles.miniAvatarEmpty]}>
                            <Text style={styles.miniQuestion}>?</Text>
                          </View>
                          <Text style={[styles.miniPos, { color: Colors.textMuted }]}>#{pos}</Text>
                          <View style={[styles.miniBlock, { height: h, backgroundColor: '#ffffff08' }]} />
                        </View>
                      );
                    }
                    return (
                      <View key={pos} style={styles.miniPodiumSlot}>
                        <LetterAvatar name={player.username} size="sm" />
                        <Text style={styles.miniName} numberOfLines={1}>{player.username}</Text>
                        <View style={[styles.miniBlock, { height: h, backgroundColor: color + '20', borderColor: color + '40', borderWidth: 1 }]}>
                          <Text style={styles.miniRankEmoji}>{MEDAL_EMOJI[pos - 1]}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="trophy-outline" size={36} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Results Yet</Text>
              <Text style={styles.emptyText}>Tournament winners will appear here</Text>
            </View>
          }
        />
      )}

      {filter === 'Rankings' && !loading && myIndex > 2 && (
        <View style={[styles.myBar, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.myBarText}>Your Rank: #{myIndex + 1}</Text>
          <Text style={styles.myBarCoins}>₹{user?.coins?.toLocaleString() ?? 0}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  filterWrapper: { paddingHorizontal: 16, marginVertical: 12 },
  filterRow: {
    flexDirection: 'row', gap: 0, backgroundColor: Colors.appElevated,
    borderRadius: 999, padding: 4,
  },
  filterTab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  filterTabActive: { backgroundColor: Colors.appCard },
  filterText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  filterTextActive: { color: Colors.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  podium: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    paddingTop: 24, paddingBottom: 20, gap: 8, marginBottom: 16,
  },
  podiumItem: { alignItems: 'center', gap: 4 },
  crown: { fontSize: 24, marginBottom: 4 },
  medal: { fontSize: 20, marginBottom: 4 },
  podiumName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center', maxWidth: 80 },
  podiumCoins: { fontSize: 11, color: Colors.textMuted },
  podiumBlock: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  podiumRank: { fontSize: 14, fontWeight: '800' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: Colors.appCard, borderRadius: 14, marginBottom: 8,
  },
  rowHighlight: { borderWidth: 1, borderColor: Colors.brandPrimary + '40', backgroundColor: Colors.brandPrimary + '08' },
  rowPos: { width: 28, fontSize: 15, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  rowRank: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowCoins: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  empty: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  emptyIcon: { width: 80, height: 80, backgroundColor: Colors.appCard, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  myBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.appCard, borderTopWidth: 1, borderTopColor: Colors.appBorder,
  },
  myBarText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  myBarCoins: { fontSize: 14, fontWeight: '600', color: Colors.brandPrimary },
  tournamentCard: { backgroundColor: Colors.appCard, borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  tournamentBanner: { height: 88, position: 'relative' },
  bannerOverlay: { backgroundColor: 'rgba(0,0,0,0.55)' },
  bannerContent: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  trophyIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.brandPrimary}30`, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: Colors.white },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  bannerPrize: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  miniPodium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingVertical: 20, gap: 16, paddingHorizontal: 12 },
  miniPodiumSlot: { alignItems: 'center', flex: 1, gap: 4 },
  miniAvatar: { width: 44, height: 44, borderRadius: 22 },
  miniAvatarEmpty: { backgroundColor: Colors.appElevated, alignItems: 'center', justifyContent: 'center' },
  miniQuestion: { fontSize: 11, color: Colors.textMuted },
  miniPos: { fontSize: 11, fontWeight: '500' },
  miniName: { fontSize: 11, fontWeight: '500', color: Colors.textPrimary, textAlign: 'center' },
  miniBlock: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  miniRankEmoji: { fontSize: 14 },
});
