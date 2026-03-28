import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { useNotifications } from '@/store/NotificationsContext';
import { WEB_TOP_INSET } from '@/utils/webInsets';

export function GlobalHeader() {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const topInset = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;

  return (
    <View style={[styles.header, { paddingTop: topInset }]}>
      <View style={styles.content}>
        <View style={styles.left}>
          <View style={styles.logoMark}>
            <Ionicons name="flash" size={17} color={Colors.primary} />
          </View>
          <Text style={styles.logoText}>
            Elite <Text style={styles.logoHighlight}>eSports</Text>
          </Text>
        </View>
        <View style={styles.right}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={21} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={21} color={Colors.text.secondary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.background.dark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  content: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1A0500',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '99',
  },
  logoText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  logoHighlight: { color: Colors.primary },
  right: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 5,
    backgroundColor: Colors.primary,
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 8, fontFamily: 'Inter_700Bold' },
});
