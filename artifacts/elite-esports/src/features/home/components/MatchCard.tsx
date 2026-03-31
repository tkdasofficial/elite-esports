import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handlePress = () => {
    triggerHaptic();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
    >
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
            <Ionicons name="image-outline" size={32} color={colors.text.muted} />
            <Text style={styles.placeholderText}>No banner available</Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.50)']}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
          {isOngoing && <View style={styles.liveDot} />}
          <Text style={styles.statusTxt}>{cfg.label}</Text>
        </View>

        {match.game ? (
          <Text style={styles.gameTag} numberOfLines={1}>{match.game}</Text>
        ) : null}
      </View>

      <View style={styles.infoStrip}>
        <Text style={styles.title} numberOfLines={1}>{match.title}</Text>
        <View style={styles.bottomRow}>
          <View style={styles.prizeWrap}>
            <Ionicons name="trophy" size={12} color="#FFD700" />
            <Text style={styles.prizeVal}>₹{match.prize_pool.toLocaleString('en-IN')}</Text>
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

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border.default,
    },
    cardPressed: { opacity: 0.91, transform: [{ scale: 0.985 }] },
    bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#0D0D0D' },
    placeholder: { alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1A1A1A' },
    placeholderText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text.muted },
    statusBadge: {
      position: 'absolute', top: 10, right: 10,
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    statusTxt: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
    gameTag: {
      position: 'absolute', bottom: 9, left: 12,
      fontSize: 10, fontFamily: 'Inter_700Bold',
      color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: 1.2,
    },
    infoStrip: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 9 },
    title: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    prizeWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, flexShrink: 1 },
    prizeVal: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#22C55E' },
    detailsBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    },
    detailsTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  });
}
