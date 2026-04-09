import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { LeaderEntry } from '@/utils/types';
import { AvatarSVG } from '@/components/AvatarSVG';

const RANK_COLORS: Record<number, string> = {
  1: '#FFA200',
  2: '#C0C0C0',
  3: '#CD7F32',
};

interface Props { item: LeaderEntry; }

export function LeaderRow({ item }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isTop3    = item.rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[item.rank] : colors.text.muted;
  const avatarIdx = isNaN(Number(item.avatar_url)) ? 0 : Number(item.avatar_url);

  return (
    <View style={[styles.row, isTop3 && { borderColor: rankColor + '55' }]}>

      {/* Rank — always a number */}
      <View style={styles.rankCol}>
        <Text style={[styles.rankText, { color: rankColor }]}>{item.rank}</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <AvatarSVG index={avatarIdx} size={34} />
      </View>

      {/* Name */}
      <Text style={styles.username} numberOfLines={1}>{item.username}</Text>

      {/* Trophy + win count */}
      <View style={[styles.trophyChip, { borderColor: rankColor + '55' }]}>
        <Ionicons name="trophy" size={22} color="#FFA200" />
        <Text style={[styles.trophyCount, { color: rankColor }]}>
          {item.wins}
        </Text>
      </View>

    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
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
      gap: 5,
      backgroundColor: 'rgba(255,162,0,0.10)',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
    },
    trophyCount: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
    },
  });
}
