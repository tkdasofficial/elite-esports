import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/utils/colors';
import { LeaderEntry } from '@/utils/types';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
const RANK_ICONS: Array<'trophy' | 'medal' | 'ribbon'> = ['trophy', 'medal', 'ribbon'];
const RANK_GRADIENTS: [string, string][] = [
  ['#FFD70030', '#00000000'],
  ['#C0C0C030', '#00000000'],
  ['#CD7F3230', '#00000000'],
];

interface Props {
  item: LeaderEntry;
}

export function LeaderRow({ item }: Props) {
  const isTop3 = item.rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[item.rank - 1] : Colors.text.muted;

  return (
    <View style={[styles.row, isTop3 && styles.topRow]}>
      {isTop3 && (
        <LinearGradient
          colors={RANK_GRADIENTS[item.rank - 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Rank */}
      <View style={styles.rankCol}>
        {isTop3 ? (
          <Ionicons name={RANK_ICONS[item.rank - 1]} size={20} color={rankColor} />
        ) : (
          <Text style={[styles.rankNum, { color: rankColor }]}>{item.rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatarWrap, isTop3 && { borderColor: rankColor + '80' }]}>
        <Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>

      {/* Name */}
      <Text style={styles.username} numberOfLines={1}>{item.username}</Text>

      {/* Stats */}
      <View style={styles.statsCol}>
        <View style={styles.killChip}>
          <MaterialCommunityIcons name="sword" size={11} color={Colors.primary} />
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
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  topRow: {
    borderColor: Colors.border.default,
  },
  rankCol: {
    width: 36,
    alignItems: 'center',
    flexShrink: 0,
  },
  rankNum: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  username: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
    letterSpacing: -0.1,
  },
  statsCol: {
    alignItems: 'flex-end',
    gap: 5,
  },
  killChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary + '18',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  killText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  points: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
});
