import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';
import { LeaderEntry } from '@/utils/types';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS: Array<'trophy' | 'medal' | 'ribbon'> = ['trophy', 'medal', 'ribbon'];

interface Props {
  item: LeaderEntry;
}

export function LeaderRow({ item }: Props) {
  const isTop3 = item.rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[item.rank - 1] : Colors.text.muted;

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
          <MaterialCommunityIcons name="sword" size={12} color={Colors.primary} />
          <Text style={styles.killText}>{item.kills}</Text>
        </View>
        <Text style={[styles.points, isTop3 && { color: rankColor }]}>{item.points} pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  topRow: {
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.elevated,
  },
  rankCol: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primary },
  username: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  statsCol: { alignItems: 'flex-end', gap: 5 },
  killChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  killText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  points: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
});
