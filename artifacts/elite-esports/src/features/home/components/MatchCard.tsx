import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { Match, STATUS_CONFIG } from '@/utils/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W   = SCREEN_W - 32;
const BANNER_H = Math.round(CARD_W * (9 / 16));

interface Props {
  match:   Match;
  onPress: () => void;
}

export function MatchCard({ match, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cfg       = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.upcoming;
  const isOngoing = match.status === 'ongoing';
  const isFree    = match.entry_fee === 0;

  const handlePress = () => {
    triggerHaptic();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
    >
      {/* ── Banner ── */}
      <View style={[styles.bannerWrap, { height: BANNER_H }]}>
        {match.banner_url ? (
          <Image
            source={{ uri: match.banner_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
            <Ionicons name="game-controller-outline" size={36} color="#333" />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
          {isOngoing && <View style={styles.liveDot} />}
          <Text style={styles.statusTxt}>{cfg.label}</Text>
        </View>

        {/* Game tag */}
        {match.game ? (
          <Text style={styles.gameTag} numberOfLines={1}>{match.game}</Text>
        ) : null}

        {/* Prize pool on banner */}
        <View style={styles.bannerBottom}>
          <View style={styles.prizeWrap}>
            <Ionicons name="trophy" size={13} color="#FFD700" />
            <Text style={styles.prizeVal}>₹{match.prize_pool.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>

      {/* ── Info Strip ── */}
      <View style={styles.infoStrip}>
        <Text style={styles.title} numberOfLines={1}>{match.title}</Text>

        <View style={styles.bottomRow}>
          {/* Entry fee badge */}
          <View style={[styles.feeBadge, isFree ? styles.feeBadgeFree : styles.feeBadgePaid]}>
            <Ionicons
              name={isFree ? 'gift-outline' : 'ticket-outline'}
              size={11}
              color={isFree ? '#22C55E' : '#EE3D2D'}
            />
            <Text style={[styles.feeText, isFree ? styles.feeTextFree : styles.feeTextPaid]}>
              {isFree ? 'FREE' : `₹${match.entry_fee}`}
            </Text>
          </View>

          {/* Players count */}
          <View style={styles.playersWrap}>
            <Ionicons name="people-outline" size={12} color="#888" />
            <Text style={styles.playersText}>
              {match.players_joined}/{match.max_players}
            </Text>
          </View>

          {/* Details button */}
          <View style={styles.detailsBtn}>
            <Text style={styles.detailsTxt}>Details</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: '#111',
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: '#222',
    },
    cardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },

    bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#0D0D0D' },
    placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#151515' },

    statusBadge: {
      position: 'absolute', top: 10, right: 10,
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    statusTxt: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

    gameTag: {
      position: 'absolute', top: 10, left: 12,
      fontSize: 10, fontFamily: 'Inter_700Bold',
      color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.2,
    },

    bannerBottom: {
      position: 'absolute', bottom: 10, left: 12, right: 12,
      flexDirection: 'row', alignItems: 'center',
    },
    prizeWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    prizeVal: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFD700' },

    infoStrip: {
      paddingHorizontal: 14, paddingTop: 11, paddingBottom: 13,
      gap: 10, backgroundColor: '#111',
    },
    title: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },

    bottomRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },

    feeBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5,
      borderWidth: 1,
    },
    feeBadgeFree: {
      backgroundColor: 'rgba(34,197,94,0.10)',
      borderColor: 'rgba(34,197,94,0.30)',
    },
    feeBadgePaid: {
      backgroundColor: 'rgba(238,61,45,0.10)',
      borderColor: 'rgba(238,61,45,0.30)',
    },
    feeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
    feeTextFree: { color: '#22C55E' },
    feeTextPaid: { color: '#EE3D2D' },

    playersWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1,
    },
    playersText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#888' },

    detailsBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#EE3D2D',
      paddingHorizontal: 13, paddingVertical: 7, borderRadius: 8,
    },
    detailsTxt: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  });
}
