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

const GOLD_DARK  = '#FFD700';
const GOLD_LIGHT = '#9A6F00';

export function MatchCard({ match, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const gold   = isDark ? GOLD_DARK : GOLD_LIGHT;
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
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
            <Ionicons name="game-controller-outline" size={36} color={colors.border.default} />
          </View>
        )}

        <LinearGradient
          colors={isDark
            ? ['transparent', 'rgba(0,0,0,0.42)']
            : ['transparent', 'rgba(0,0,0,0.28)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Status badge — top right */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
          {isOngoing && <View style={styles.liveDot} />}
          <Text style={styles.statusTxt}>{cfg.label}</Text>
        </View>

        {/* Game tag — top left */}
        {match.game ? (
          <Text style={styles.gameTag} numberOfLines={1}>{match.game}</Text>
        ) : null}
      </View>

      {/* ── Info Strip ── */}
      <View style={styles.infoStrip}>

        {/* Row 1: Title (left) + Player count (right) */}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{match.title}</Text>
          <View style={styles.playersWrap}>
            <Ionicons name="people-outline" size={12} color={colors.text.secondary} />
            <Text style={styles.playersText}>
              {match.players_joined}/{match.max_players}
            </Text>
          </View>
        </View>

        {/* Row 2: Fee + Prize (left, side by side) + Details button (right) */}
        <View style={styles.bottomRow}>
          {/* Entry Fee */}
          <View style={[styles.statBadge, isFree ? styles.feeBadgeFree : styles.feeBadgePaid]}>
            <Ionicons
              name={isFree ? 'gift-outline' : 'ticket-outline'}
              size={11}
              color={isFree ? '#22C55E' : '#EE3D2D'}
            />
            <Text style={[styles.badgeText, isFree ? styles.feeTextFree : styles.feeTextPaid]}>
              {isFree ? 'FREE' : `₹${match.entry_fee}`}
            </Text>
          </View>

          {/* Prize Pool */}
          <View style={styles.prizeBadge}>
            <Ionicons name="trophy" size={11} color={gold} />
            <Text style={styles.prizeText}>₹{match.prize_pool.toLocaleString('en-IN')}</Text>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Details button — same position as before */}
          <View style={styles.detailsBtn}>
            <Text style={styles.detailsTxt}>Details</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </View>
        </View>

      </View>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>, isDark: boolean) {
  const gold = isDark ? GOLD_DARK : GOLD_LIGHT;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border.default,
    },
    cardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },

    bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: colors.background.dark },
    placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.dark },

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
      color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 1.2,
    },

    infoStrip: {
      paddingHorizontal: 14, paddingTop: 11, paddingBottom: 13,
      gap: 9, backgroundColor: colors.background.card,
    },

    /* Row 1: title + players */
    titleRow: {
      flexDirection: 'row', alignItems: 'center',
    },
    title: {
      flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary,
    },
    playersWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
    },
    playersText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.secondary },

    /* Row 2: fee + prize + details */
    bottomRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
    },

    statBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5,
      borderWidth: 1,
    },
    feeBadgeFree: {
      backgroundColor: 'rgba(34,197,94,0.10)',
      borderColor: 'rgba(34,197,94,0.28)',
    },
    feeBadgePaid: {
      backgroundColor: 'rgba(238,61,45,0.10)',
      borderColor: 'rgba(238,61,45,0.28)',
    },
    badgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
    feeTextFree: { color: '#22C55E' },
    feeTextPaid: { color: '#EE3D2D' },

    prizeBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5,
      backgroundColor: isDark ? 'rgba(255,215,0,0.08)' : 'rgba(154,111,0,0.08)',
      borderWidth: 1, borderColor: isDark ? 'rgba(255,215,0,0.22)' : 'rgba(154,111,0,0.30)',
    },
    prizeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: gold },

    detailsBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#EE3D2D',
      paddingHorizontal: 13, paddingVertical: 7, borderRadius: 8,
    },
    detailsTxt: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  });
}
