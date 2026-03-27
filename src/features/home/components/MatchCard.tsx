import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/utils/colors';
import { Match, STATUS_CONFIG } from '@/utils/types';

interface Props {
  match: Match;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: Props) {
  const cfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.upcoming;
  const isFull = match.players_joined >= match.max_players;
  const progress = Math.min(match.players_joined / match.max_players, 1);

  const joinLabel =
    isFull ? 'Full'
    : match.status === 'upcoming' ? 'Join Match'
    : match.status === 'ongoing' ? 'View'
    : 'Details';

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

      <View style={styles.body}>
        <Text style={styles.gameLabel}>{match.game}</Text>
        <Text style={styles.title} numberOfLines={1}>{match.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>₹{match.entry_fee}</Text>
            <Text style={styles.statLbl}>Entry</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: Colors.primary }]}>₹{match.prize_pool}</Text>
            <Text style={styles.statLbl}>Prize</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{match.players_joined}/{match.max_players}</Text>
            <Text style={styles.statLbl}>Players</Text>
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
          <Text style={styles.joinBtnText}>{joinLabel}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  body: { padding: 16 },
  gameLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  statLbl: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: Colors.border.default },
  progressTrack: { height: 4, backgroundColor: Colors.background.elevated, borderRadius: 2, marginBottom: 14 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  joinBtn: { backgroundColor: Colors.primary, borderRadius: 10, height: 44, alignItems: 'center', justifyContent: 'center' },
  joinBtnDisabled: { backgroundColor: Colors.background.surface },
  joinBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
