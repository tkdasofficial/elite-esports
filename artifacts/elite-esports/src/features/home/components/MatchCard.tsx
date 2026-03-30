import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/utils/colors';
import { Match, STATUS_CONFIG } from '@/utils/types';

const { width } = Dimensions.get('window');
const CARD_W = width - 32;
const BANNER_H = Math.round(CARD_W * (9 / 16));

interface Props {
  match: Match;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: Props) {
  const cfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.upcoming;
  const isFull = match.players_joined >= match.max_players;
  const progress = Math.min(match.players_joined / match.max_players, 1);
  const isOngoing = match.status === 'ongoing';
  const isJoinable = match.status === 'upcoming' && !isFull;

  const joinLabel =
    isFull ? 'Full' :
    isJoinable ? 'Join Match' :
    isOngoing ? 'View Live' :
    'View Details';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
    >
      {/* ── Banner (16:9) ── */}
      <View style={styles.bannerWrap}>
        {match.banner_url ? (
          <Image
            source={{ uri: match.banner_url }}
            style={styles.banner}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <LinearGradient
            colors={['#200800', '#1A0600', '#120400']}
            style={styles.banner}
          >
            <Ionicons name="game-controller-outline" size={48} color={Colors.primary + '66'} />
          </LinearGradient>
        )}

        {/* Bottom gradient overlay for readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Game name on banner */}
        {match.game ? (
          <Text style={styles.bannerGame}>{match.game}</Text>
        ) : null}

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + 'DD' }]}>
          {isOngoing && <View style={styles.liveDot} />}
          <Text style={styles.statusTxt}>{cfg.label}</Text>
        </View>

        {/* Prize pool on banner — bottom right */}
        <View style={styles.prizeTag}>
          <Ionicons name="trophy" size={10} color="#FFD700" />
          <Text style={styles.prizeTxt}>₹{match.prize_pool.toLocaleString()}</Text>
        </View>
      </View>

      {/* ── Card body ── */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{match.title}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLbl}>ENTRY</Text>
            <Text style={styles.statVal}>₹{match.entry_fee}</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statLbl}>PRIZE</Text>
            <Text style={[styles.statVal, { color: Colors.primary }]}>
              ₹{match.prize_pool.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statLbl}>PLAYERS</Text>
            <Text style={styles.statVal}>
              {match.players_joined}
              <Text style={styles.statMax}>/{match.max_players}</Text>
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` as any },
              isFull && { backgroundColor: Colors.status.error },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {isFull ? 'Slots full' : `${match.max_players - match.players_joined} slots left`}
        </Text>

        {/* Join button */}
        <Pressable
          style={({ pressed }) => [
            styles.joinBtn,
            isJoinable
              ? { backgroundColor: Colors.primary }
              : isOngoing
              ? styles.joinBtnLive
              : styles.joinBtnSecondary,
            isFull && styles.joinBtnFull,
            pressed && styles.joinBtnPressed,
          ]}
          onPress={handlePress}
        >
          {isOngoing && <View style={styles.btnLiveDot} />}
          <Text
            style={[
              styles.joinTxt,
              !isJoinable && { color: isOngoing ? '#22C55E' : Colors.text.secondary },
              isFull && { color: Colors.text.muted },
            ]}
          >
            {joinLabel}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  bannerWrap: {
    position: 'relative',
    width: '100%',
    height: BANNER_H,
    backgroundColor: '#0D0D0D',
  },
  banner: {
    width: '100%',
    height: BANNER_H,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerGame: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFFCC',
    letterSpacing: 0.5,
  },

  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  statusTxt: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  prizeTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00000088',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFD70033',
  },
  prizeTxt: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#FFD700' },

  body: { padding: 14 },

  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    marginBottom: 14,
    letterSpacing: -0.3,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingVertical: 12,
    marginBottom: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statLbl: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.muted,
    letterSpacing: 1,
  },
  statVal: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
  },
  statMax: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
  },
  statDiv: { width: 1, height: 28, backgroundColor: Colors.border.default },

  progressTrack: {
    height: 3,
    backgroundColor: Colors.background.elevated,
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    marginBottom: 14,
    textAlign: 'right',
  },

  joinBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  joinBtnLive: {
    backgroundColor: '#22C55E18',
    borderWidth: 1,
    borderColor: '#22C55E44',
  },
  joinBtnSecondary: {
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  joinBtnFull: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  joinBtnPressed: { opacity: 0.85 },
  btnLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  joinTxt: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
});
