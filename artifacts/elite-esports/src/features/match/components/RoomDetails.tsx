import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';

interface Props {
  roomId?: string;
  roomPassword?: string;
}

export function RoomDetails({ roomId, roomPassword }: Props) {
  if (!roomId && !roomPassword) return null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="key-outline" size={18} color={Colors.primary} />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
  label: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  value: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary, letterSpacing: 1 },
});
