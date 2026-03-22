import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/src/store/notificationStore';
import { Colors } from '@/src/theme/colors';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  trophy: 'trophy',
  wallet: 'wallet',
  user: 'person',
  bell: 'notifications',
};

export default function NotificationDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notifications, markRead } = useNotificationStore();
  const notification = notifications.find(n => n.id === id);

  useEffect(() => {
    if (id && notification?.unread) markRead(id);
  }, [id]);

  if (!notification) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Notification not found.</Text>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Text style={styles.link}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const iconName = ICON_MAP[notification.iconType] ?? 'notifications';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconSection}>
          <View style={styles.iconBox}>
            <Ionicons name={iconName} size={32} color={Colors.white} />
          </View>
          <Text style={styles.title}>{notification.title}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.time}>{notification.time}</Text>
          </View>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.message}>{notification.fullMessage || notification.message}</Text>
        </View>

        {notification.actionLabel && notification.actionPath && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(notification.actionPath as any)}
          >
            <Text style={styles.actionBtnText}>{notification.actionLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16 },
  iconSection: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  iconBox: {
    width: 72, height: 72, backgroundColor: Colors.brandPrimary,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '700', color: Colors.textPrimary,
    textAlign: 'center', letterSpacing: -0.4, paddingHorizontal: 20,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  time: { fontSize: 13, color: Colors.textMuted },
  messageCard: { backgroundColor: Colors.appCard, borderRadius: 16, padding: 20 },
  message: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.brandPrimary, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 20,
  },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFoundText: { fontSize: 17, color: Colors.textSecondary },
  link: { fontSize: 16, color: Colors.brandPrimary, fontWeight: '500' },
  backBtn: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 8 },
  backText: { fontSize: 17, color: Colors.brandPrimary },
});
