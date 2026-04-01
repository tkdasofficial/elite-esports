import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { LeaderEntry } from '@/utils/types';
import { AvatarSVG } from '@/components/AvatarSVG';

const RANK_COLORS_DARK  = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_COLORS_LIGHT = ['#9A6F00', '#707070', '#8B4513'];
const RANK_ICONS: Array<'trophy' | 'medal' | 'ribbon'> = ['trophy', 'medal', 'ribbon'];

interface Props { item: LeaderEntry; }

export function LeaderRow({ item }: Props) {
  const { colors, isDark } = useTheme();
  const rankColors = isDark ? RANK_COLORS_DARK : RANK_COLORS_LIGHT;
  const styles     = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const isTop3     = item.rank <= 3;
  const rankColor  = isTop3 ? rankColors[item.rank - 1] : colors.text.muted;
  const avatarIdx  = isNaN(Number(item.avatar_url)) ? 0 : Number(item.avatar_url);

  return (
    <View style={[styles.row, isTop3 && { borderColor: rankColor + '55' }]}>

      {/* Rank */}
      <View style={styles.rankCol}>
        {isTop3 ? (
          <Ionicons name={RANK_ICONS[item.rank - 1]} size={22} color={rankColor} />
        ) : (
          <Text style={[styles.rankText, { color: rankColor }]}>{item.rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <AvatarSVG index={avatarIdx} size={34} />
      </View>

      {/* Name */}
      <Text style={styles.username} numberOfLines={1}>{item.username}</Text>

      {/* Trophy count */}
      <View style={[styles.trophyChip, { borderColor: rankColor + '55' }]}>
        <Ionicons
          name="trophy"
          size={13}
          color={isTop3 ? rankColor : (isDark ? '#FFD700' : '#9A6F00')}
        />
        <Text style={[styles.trophyCount, isTop3 && { color: rankColor }]}>
          {item.wins}
        </Text>
        <Text style={styles.trophyLabel}>
          {item.wins === 1 ? 'win' : 'wins'}
        </Text>
      </View>

    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof import('@/utils/colors').getColors>,
  isDark: boolean,
) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    rankCol: {
      width: 36,
      alignItems: 'center',
    },
    rankText: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
    },
    avatarCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden',
    },
    username: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.text.primary,
    },
    trophyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(255,215,0,0.08)' : 'rgba(154,111,0,0.08)',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
    },
    trophyCount: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: isDark ? '#FFD700' : '#9A6F00',
    },
    trophyLabel: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.text.muted,
    },
  });
}
