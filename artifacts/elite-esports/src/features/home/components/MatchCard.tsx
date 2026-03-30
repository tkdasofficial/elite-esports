/**
 * MatchCard — 16:10 card with 16:9 banner.
 *
 *  ┌──────────────────────────────────┐
 *  │                                  │
 *  │         BANNER  (16:9)           │  ← status badge top-right
 *  │                                  │
 *  ├──────────────────────────────────┤
 *  │  Match Title  (line 1)           │
 *  │  ₹Prize Pool          [Details→] │  ← line 2
 *  └──────────────────────────────────┘
 */
import React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/utils/colors';
import { Match, STATUS_CONFIG } from '@/utils/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W   = SCREEN_W - 32;
const BANNER_H = Math.round(CARD_W * (9 / 16));

interface Props {
  match:   Match;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: Props) {
  const cfg       = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.upcoming;
  const isOngoing = match.status === 'ongoing';

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
      <View style={[styles.bannerWrap, { height: BANNER_H }]}>
        {match.banner_url ? (
          <Image
            source={{ uri: match.banner_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <LinearGradient
            colors={['#1E0500', '#130300', '#0A0A0A']}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.placeholder}>
              <Ionicons name="game-controller-outline" size={44} color={Colors.primary + '55'} />
            </View>
          </LinearGradient>
        )}

        {/* bottom fade for text contrast */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.50)']}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Status badge — top right */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
          {isOngoing && <View style={styles.liveDot} />}
          <Text style={styles.statusTxt}>{cfg.label}</Text>
        </View>

        {/* Game tag — bottom left */}
        {match.game ? (
          <Text style={styles.gameTag} numberOfLines={1}>{match.game}</Text>
        ) : null}
      </View>

      {/* ── Info strip ── */}
      <View style={styles.infoStrip}>
        {/* Line 1 — title */}
        <Text style={styles.title} numberOfLines={1}>{match.title}</Text>

        {/* Line 2 — prize (left) + Details button (right) */}
        <View style={styles.bottomRow}>
          <View style={styles.prizeWrap}>
            <Ionicons name="trophy" size={12} color="#FFD700" />
            <Text style={styles.prizeVal}>
              ₹{match.prize_pool.toLocaleString('en-IN')}
            </Text>
          </View>

          <TouchableOpacity style={styles.detailsBtn} onPress={handlePress} activeOpacity={0.82}>
            <Text style={styles.detailsTxt}>Details</Text>
            <Ionicons name="arrow-forward" size={13} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  cardPressed: {
    opacity: 0.91,
    transform: [{ scale: 0.985 }],
  },

  /* Banner */
  bannerWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0D0D0D',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  statusTxt: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  gameTag: {
    position: 'absolute',
    bottom: 9,
    left: 12,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  /* Info strip */
  infoStrip: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 9,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prizeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexShrink: 1,
  },
  prizeVal: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#22C55E',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsTxt: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
