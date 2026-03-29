import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/utils/colors';
import { Match } from '@/utils/types';

interface Props {
  match: Match;
}

export function LiveMatchCard({ match }: Props) {
  const canWatch = !!match.stream_url;

  return (
    <View style={styles.card}>
      <View style={styles.bannerWrap}>
        {match.banner_url ? (
          <Image source={{ uri: match.banner_url }} style={styles.banner} contentFit="cover" />
        ) : (
          <LinearGradient colors={['#1A0500', '#050505']} style={styles.banner}>
            <Ionicons name="game-controller-outline" size={48} color={Colors.primary + '50'} />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', Colors.background.card]}
          locations={[0.3, 0.7, 1]}
          style={styles.bannerFade}
        />
        {/* Live badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
        <Text style={styles.gamePill}>{match.game}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{match.title}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <Ionicons name="people-outline" size={13} color={Colors.text.muted} />
            <Text style={styles.infoText}>{match.players_joined}/{match.max_players}</Text>
          </View>
          <View style={styles.infoChip}>
            <Ionicons name="trophy-outline" size={13} color={Colors.primary} />
            <Text style={[styles.infoText, { color: Colors.primary }]}>₹{match.prize_pool}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.watchBtn, !canWatch && styles.watchBtnDisabled]}
          onPress={() => canWatch && Linking.openURL(match.stream_url!)}
          activeOpacity={0.82}
          disabled={!canWatch}
        >
          <Ionicons name="play-circle" size={20} color="#fff" />
          <Text style={styles.watchBtnText}>{canWatch ? 'Watch Live' : 'Stream Unavailable'}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
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
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.background.elevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    height: 48,
  },
  watchBtnDisabled: {
    backgroundColor: Colors.background.elevated,
  },
  watchBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
