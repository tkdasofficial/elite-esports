import { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useAuthStore } from '@/src/store/authStore';
import { Colors } from '@/src/theme/colors';

const getIconName = (iconType: string): keyof typeof Ionicons.glyphMap => {
  if (iconType === 'trophy') return 'trophy';
  if (iconType === 'wallet') return 'wallet';
  if (iconType === 'user')   return 'person';
  return 'notifications';
};

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { notifications, hasUnread, loading, fetchNotifications, markAllRead } = useNotificationStore();

  useEffect(() => {
    if (session?.user?.id) fetchNotifications(session.user.id);
  }, [session?.user?.id]);

  const unread = notifications.filter(n => n.unread);
  const read   = notifications.filter(n => !n.unread);

  const handleMarkAll = () => {
    if (session?.user?.id) markAllRead(session.user.id);
  };

  const sections: { label: string; data: typeof notifications }[] = [];
  if (unread.length > 0)  sections.push({ label: 'New',      data: unread });
  if (read.length > 0)    sections.push({ label: unread.length > 0 ? 'Earlier' : 'All Notifications', data: read });

  const renderItem = ({ item }: { item: typeof notifications[number] }) => {
    const iconName = getIconName(item.iconType);
    const isUnread = item.unread;
    return (
      <TouchableOpacity
        style={[styles.row, isUnread && styles.rowUnread]}
        onPress={() => router.push(`/notifications/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: item.iconBg || Colors.appElevated, opacity: isUnread ? 1 : 0.6 }]}>
          <Ionicons name={iconName} size={20} color={item.iconColor || Colors.textMuted} />
        </View>
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={[styles.rowTitle, !isUnread && styles.rowTitleRead]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.rowTime}>{item.time}</Text>
          </View>
          <Text style={[styles.rowBody, !isUnread && styles.rowBodyRead]} numberOfLines={2}>{item.message}</Text>
        </View>
        <View style={styles.rowEnd}>
          {isUnread && <View style={styles.unreadDot} />}
          <Ionicons name="chevron-forward" size={13} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {hasUnread ? (
          <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={15} color={Colors.brandPrimary} />
            <Text style={styles.markAllText}>Mark all</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>You don't have any notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <View style={styles.card}>
                {section.data.map((n, i) => (
                  <View key={n.id}>
                    {renderItem({ item: n })}
                    {i < section.data.length - 1 && <View style={styles.sep} />}
                  </View>
                ))}
              </View>
            </View>
          )}
          ListFooterComponent={
            !hasUnread && notifications.length > 0 ? (
              <View style={styles.caughtUp}>
                <Ionicons name="checkmark-done" size={16} color={Colors.brandSuccess} />
                <Text style={styles.caughtUpText}>You're all caught up!</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  markAllText: { fontSize: 15, color: Colors.brandPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  rowUnread: { backgroundColor: `${Colors.brandPrimary}08` },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1, gap: 2 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  rowTitleRead: { fontWeight: '400', color: Colors.textSecondary },
  rowTime: { fontSize: 12, color: Colors.textMuted, flexShrink: 0 },
  rowBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  rowBodyRead: { color: Colors.textMuted },
  rowEnd: { flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary },
  sep: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 70 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { width: 88, height: 88, backgroundColor: Colors.appCard, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  caughtUp: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${Colors.brandSuccess}10`, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${Colors.brandSuccess}20` },
  caughtUpText: { fontSize: 14, color: Colors.brandSuccess },
});
