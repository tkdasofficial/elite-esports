import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { Colors } from '@/src/theme/colors';

interface BlockedUser {
  id: string;
  username: string;
  blockedOn: string;
}

export default function BlockedUsers() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => { loadBlocked(); }, []);

  const loadBlocked = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('blocked_users')
      .select('blocked_id, created_at, profiles!blocked_id(username)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setBlocked(data.map((r: any) => ({
        id: r.blocked_id,
        username: r.profiles?.username ?? 'Unknown',
        blockedOn: new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      })));
    }
    setLoading(false);
  };

  const handleUnblock = async (userId: string) => {
    Alert.alert('Unblock User', 'Are you sure you want to unblock this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock', style: 'destructive',
        onPress: async () => {
          setUnblocking(userId);
          await supabase.from('blocked_users').delete()
            .eq('user_id', session?.user?.id ?? '').eq('blocked_id', userId);
          setBlocked(prev => prev.filter(u => u.id !== userId));
          setUnblocking(null);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} />
        </View>
      ) : blocked.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-remove" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Blocked Users</Text>
          <Text style={styles.emptyText}>You haven't blocked anyone yet</Text>
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Ionicons name="person-remove" size={18} color={Colors.brandLive} />
              </View>
              <View style={styles.info}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.blockedOn}>Blocked on {item.blockedOn}</Text>
              </View>
              <TouchableOpacity
                style={styles.unblockBtn}
                onPress={() => handleUnblock(item.id)}
                disabled={unblocking === item.id}
              >
                {unblocking === item.id ? (
                  <ActivityIndicator size="small" color={Colors.brandSuccess} />
                ) : (
                  <>
                    <Ionicons name="person-add" size={13} color={Colors.brandSuccess} />
                    <Text style={styles.unblockText}>Unblock</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: {
    width: 88, height: 88, backgroundColor: Colors.appCard,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  list: { paddingVertical: 8 },
  separator: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 72 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,59,48,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  username: { fontSize: 16, color: Colors.textPrimary },
  blockedOn: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  unblockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(48,209,88,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  unblockText: { fontSize: 13, fontWeight: '500', color: Colors.brandSuccess },
});
