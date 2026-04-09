import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import type { AppColors } from '@/utils/colors';

interface Props {
  roomId?: string;
  roomPassword?: string;
}

export function RoomDetails({ roomId, roomPassword }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!roomId && !roomPassword) return null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="key-outline" size={23} color={colors.primary} />
        <Text style={styles.title}>Room Details</Text>
      </View>
      {roomId && (
        <View style={styles.row}>
          <Text style={styles.label}>Room ID</Text>
          <Text style={styles.value}>{roomId}</Text>
        </View>
      )}
      {roomPassword && (
        <View style={styles.row}>
          <Text style={styles.label}>Password</Text>
          <Text style={styles.value}>{roomPassword}</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background.card, borderRadius: 14, padding: 16, marginBottom: 16,
      borderWidth: 1, borderColor: colors.primary + '44',
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border.subtle },
    label: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary },
    value: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary, letterSpacing: 1 },
  });
}
