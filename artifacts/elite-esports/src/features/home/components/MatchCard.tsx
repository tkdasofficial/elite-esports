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
    : match.status === 'ongoing' ? 'View Live'
    : 'View Details';

  const isJoinable = match.status === 'upcoming' && !isFull;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Banner */}
      <View style={styles.bannerWrap}>
        {match.banner_url ? (
          <Image source={{ uri: match.banner_url }} style={styles.banner} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#1A0600', '#0A0A0A']} style={styles.banner}>
            <Ionicons name="game-controller-outline" size={52} color={Colors.primary + '60'} />
          </LinearGradient>
        )}
        {/* Gradient fade to card bg at bottom */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', Colors.background.card]}
          locations={[0.4, 0.75, 1]}
          style={styles.bannerFade}
        />
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + 'EE' }]}>
          {match.status === 'ongoing' && <View style={styles.livePulse} />}
          <Text style={styles.statusText}>{cfg.label}</Text>
        </View>
        {/* Game chip overlaid at bottom of banner */}
        <Text style={styles.gamePill}>{match.game}</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{match.title}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Entry</Text>
            <Text style={styles.statValue}>₹{match.entry_fee}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Prize Pool</Text>
            <Text style={[styles.statValue, styles.prizeValue]}>₹{match.prize_pool}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Players</Text>
            <Text style={styles.statValue}>{match.players_joined}/{match.max_players}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[
            styles.cta,
            !isJoinable && styles.ctaSecondary,
            isFull && styles.ctaDisabled,
          ]}
          onPress={onPress}
          activeOpacity={0.82}
        >
          {match.status === 'ongoing' && <View style={styles.ctaLiveDot} />}
          <Text style={[
            styles.ctaText,
            !isJoinable && styles.ctaTextSecondary,
            isFull && styles.ctaTextDisabled,
          ]}>
            {joinLabel}
          </Text>
          {isJoinable && (
            <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.ctaArrow} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },

  bannerWrap: { position: 'relative' },
  banner: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.elevated,
  },
  bannerFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gamePill: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.3,
    lineHeight: 23,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  prizeValue: { color: Colors.primary },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: Colors.border.default,
  },

  progressTrack: {
    height: 3,
    backgroundColor: Colors.background.elevated,
    borderRadius: 2,
    marginBottom: 14,
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  cta: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  ctaDisabled: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  ctaLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.status.ongoing,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.1,
  },
  ctaTextSecondary: { color: Colors.text.secondary },
  ctaTextDisabled: { color: Colors.text.muted },
  ctaArrow: { marginLeft: 2 },
});
