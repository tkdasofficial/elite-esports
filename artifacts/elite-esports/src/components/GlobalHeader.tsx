import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { useNotifications } from '@/store/NotificationsContext';

export function GlobalHeader() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const topPad = Platform.OS === 'web' ? Math.max(67, insets.top) : insets.top;

  return (
    <View style={[styles.header, { paddingTop: topPad + 8 }]}>
      <View style={styles.left}>
        <View style={styles.logoMark}>
          <Ionicons name="flash" size={18} color={Colors.primary} />
        </View>
        <Text style={styles.logoText}>
          Elite <Text style={styles.logoHighlight}>eSports</Text>
        </Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.dark,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1A0500',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  logoText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  logoHighlight: { color: Colors.primary },
  right: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 5,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_700Bold' },
});
