import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useNotifications, Notification } from '@/context/NotificationsContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function NotifCard({ notif, onPress }: { notif: Notification; onPress: () => void }) {
  const iconMap: Record<string, string> = {
    match: 'game-controller-outline',
    wallet: 'wallet-outline',
    general: 'notifications-outline',
  };
  return (
    <TouchableOpacity style={[styles.card, !notif.is_read && styles.cardUnread]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.icon, { backgroundColor: notif.is_read ? Colors.background.elevated : 'rgba(254,76,17,0.15)' }]}>
        <Ionicons name={(iconMap[notif.type] || 'notifications-outline') as any} size={20} color={notif.is_read ? Colors.text.muted : Colors.primary} />
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
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <NotifCard notif={item} onPress={() => markAsRead(item.id)} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListHeaderComponent={notifications.some(n => !n.is_read) ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} activeOpacity={0.8}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={56} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You're all caught up</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  list: { padding: 16, gap: 0 },
  markAllBtn: { alignSelf: 'flex-end', paddingVertical: 8, marginBottom: 12 },
  markAllText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.background.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  cardUnread: { borderColor: Colors.primary + '33', backgroundColor: Colors.background.elevated },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 3 },
  message: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 19 },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4 },
  sep: { height: 8 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.secondary },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
});
