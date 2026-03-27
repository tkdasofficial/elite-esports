import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/utils/colors';

interface Props {
  roomId?: string;
  roomPassword?: string;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(value); } catch {}
    } else {
      await Clipboard.setStringAsync(value);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? Colors.status.success : Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function RoomDetails({ roomId, roomPassword }: Props) {
  if (!roomId && !roomPassword) return null;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="key-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>Room Credentials</Text>
      </View>
      {roomId && <CopyRow label="Room ID" value={roomId} />}
      {roomPassword && <CopyRow label="Password" value={roomPassword} />}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
  label: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary, letterSpacing: 1 },
  copyBtn: { padding: 4 },
});
