import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { ScreenHeader } from '@/components/ScreenHeader';

const ADMIN_TILES = [
  {
    icon: 'game-controller-outline' as const,
    label: 'Games',
    desc: 'Add & manage game catalog',
    route: '/admin/games',
    color: '#8B5CF6',
  },
];

export default function AdminIndexScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Admin Panel" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
            <Text style={styles.badgeText}>Admin Access</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Manage</Text>
        <View style={styles.grid}>
          {ADMIN_TILES.map(tile => (
            <TouchableOpacity
              key={tile.label}
              style={styles.tile}
              onPress={() => router.push(tile.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.tileIcon, { backgroundColor: tile.color + '22' }]}>
                <Ionicons name={tile.icon} size={26} color={tile.color} />
              </View>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileDesc}>{tile.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 20 },
  badgeRow: { flexDirection: 'row', marginBottom: 24 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(254,76,17,0.25)',
  },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  tileLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  tileDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
});
