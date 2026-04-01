import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { LeaderEntry } from '@/utils/types';

const RANK_COLORS_DARK  = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_COLORS_LIGHT = ['#9A6F00', '#707070', '#8B4513'];
const RANK_ICONS: Array<'trophy' | 'medal' | 'ribbon'> = ['trophy', 'medal', 'ribbon'];

interface Props { item: LeaderEntry; }

export function LeaderRow({ item }: Props) {
  const { colors, isDark } = useTheme();
  const rankColors = isDark ? RANK_COLORS_DARK : RANK_COLORS_LIGHT;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isTop3 = item.rank <= 3;
  const rankColor = isTop3 ? rankColors[item.rank - 1] : colors.text.muted;

  return (
    <View style={[styles.row, isTop3 && styles.topRow]}>
      <View style={styles.rankCol}>
        {isTop3 ? (
          <Ionicons name={RANK_ICONS[item.rank - 1]} size={22} color={rankColor} />
        ) : (
          <Text style={[styles.rankText, { color: rankColor }]}>{item.rank}</Text>
        )}
      </View>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
      <View style={styles.statsCol}>
        <View style={styles.killChip}>
          <MaterialCommunityIcons name="sword" size={12} color={colors.primary} />
          <Text style={styles.killText}>{item.kills}</Text>
        </View>
        <Text style={[styles.points, isTop3 && { color: rankColor }]}>{item.points} pts</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card, borderRadius: 14,
      padding: 14, borderWidth: 1, borderColor: colors.border.subtle,
    },
    topRow: { borderColor: colors.border.default, backgroundColor: colors.background.elevated },
    rankCol: { width: 40, alignItems: 'center' },
    rankText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
    avatarCircle: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.background.surface,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 12, borderWidth: 1, borderColor: colors.border.default,
    },
    avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary },
    username: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    statsCol: { alignItems: 'flex-end', gap: 5 },
    killChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.primary + '1A', borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    killText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    points: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.text.primary },
  });
}
