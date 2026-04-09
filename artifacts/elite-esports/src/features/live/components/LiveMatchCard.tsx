import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/ThemeContext';
import { Match } from '@/utils/types';

interface Props { match: Match; }

export function LiveMatchCard({ match }: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.bannerContainer}>
        {match.banner_url ? (
          <Image
            source={{ uri: match.banner_url }}
            style={styles.banner}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.banner, styles.placeholder]}>
            <Ionicons name="image-outline" size={36} color="#555" />
            <Text style={styles.placeholderText}>No banner available</Text>
          </View>
        )}
        <LinearGradient
          colors={isDark ? ['transparent', 'rgba(0,0,0,0.50)'] : ['transparent', 'rgba(0,0,0,0.32)']}
          style={styles.bannerGradient}
        >
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.body}>
        <Text style={styles.gameTag}>{match.game}</Text>
        <Text style={styles.title} numberOfLines={2}>{match.title}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={27} color={colors.text.secondary} />
            <Text style={styles.infoText}>{match.players_joined}/{match.max_players}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="trophy-outline" size={27} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>₹{match.prize_pool}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.watchBtn}
          onPress={() => match.stream_url && Linking.openURL(match.stream_url)}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={28} color="#fff" />
          <Text style={styles.watchBtnText}>Watch Live</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 18, borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden',
    },
    bannerContainer: { position: 'relative' },
    banner: { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' },
    placeholder: { backgroundColor: '#1A1A1A', gap: 8 },
    placeholderText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#555' },
    bannerGradient: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 64, justifyContent: 'flex-end', padding: 14,
    },
    liveBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(239,68,68,0.92)', alignSelf: 'flex-start',
      paddingHorizontal: 11, paddingVertical: 5, borderRadius: 7,
    },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
    liveBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
    body: { padding: 18 },
    gameTag: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary,
      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
    },
    title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 14 },
    infoRow: { flexDirection: 'row', gap: 18, marginBottom: 16 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    watchBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: colors.status.error, borderRadius: 12, height: 52,
    },
    watchBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  });
}
