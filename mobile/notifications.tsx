import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { Colors } from '@/src/theme/colors';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_user_id.eq.${session?.user?.id},target_user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  const iconForType = (type: string) => {
    if (type === 'match') return { name: 'trophy', color: Colors.brandWarning, bg: `${Colors.brandWarning}20` };
    if (type === 'win') return { name: 'trophy', color: Colors.brandSuccess, bg: `${Colors.brandSuccess}20` };
    if (type === 'wallet') return { name: 'wallet', color: Colors.brandPrimary, bg: `${Colors.brandPrimary}20` };
    return { name: 'notifications', color: Colors.textMuted, bg: Colors.appElevated };
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const icon = iconForType(item.type);
    const time = new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    return (
      <TouchableOpacity style={[styles.row, !item.read && styles.rowUnread]}>
        <View style={[styles.icon, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name as any} size={18} color={icon.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.rowTime}>{time}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
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
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  list: { paddingTop: 8, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowUnread: { backgroundColor: `${Colors.brandPrimary}08` },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  info: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  rowBody: { fontSize: 13, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  rowTime: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary, marginTop: 6 },
  sep: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 70 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
