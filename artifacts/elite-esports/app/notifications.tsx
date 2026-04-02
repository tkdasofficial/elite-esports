import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useNotifications, Notification } from '@/store/NotificationsContext';
import type { AppColors } from '@/utils/colors';

const ICON_MAP: Record<string, string> = {
  match: 'game-controller-outline',
  wallet: 'wallet-outline',
  general: 'notifications-outline',
};

function NotifCard({ notif, onPress, colors }: { notif: Notification; onPress: () => void; colors: AppColors }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.card, !notif.is_read && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.icon, { backgroundColor: notif.is_read ? colors.background.elevated : 'rgba(254,76,17,0.12)' }]}>
        <Ionicons
          name={(ICON_MAP[notif.type] || 'notifications-outline') as any}
          size={20}
          color={notif.is_read ? colors.text.muted : colors.primary}
        />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{notif.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{notif.message}</Text>
        <Text style={styles.time}>{new Date(notif.created_at).toLocaleString()}</Text>
      </View>
      {!notif.is_read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handleNotifPress(item: Notification) {
    if (!item.is_read) markAsRead(item.id);
    router.push({ pathname: '/notification/[id]', params: { id: item.id } });
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" />
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <NotifCard notif={item} onPress={() => handleNotifPress(item)} colors={colors} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom }]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={
          notifications.some(n => !n.is_read) ? (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} activeOpacity={0.8}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You're all caught up</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    list: { padding: 16, paddingTop: 8 },
    markAllBtn: { alignSelf: 'flex-end', paddingVertical: 8, marginBottom: 10 },
    markAllText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: colors.background.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    cardUnread: {
      borderColor: colors.primary + '33',
      backgroundColor: colors.background.elevated,
    },
    icon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    body: { flex: 1 },
    title: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 3 },
    message: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, lineHeight: 19 },
    time: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 7 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5, flexShrink: 0 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text.secondary },
    emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted },
  });
}
