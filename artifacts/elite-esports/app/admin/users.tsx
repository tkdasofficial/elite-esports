import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

interface UserRow {
  id: string;
  full_name: string | null;
  username: string | null;
  balance: number | null;
  is_admin: boolean | null;
}

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      (u.full_name ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q)
    ));
  }, [search, users]);

  const loadUsers = async () => {
    setLoading(true);
    const [usersRes, walletsRes, adminsRes] = await Promise.all([
      supabase.from('users').select('id, name, username').order('name', { ascending: true }),
      supabase.from('wallets').select('user_id, balance'),
      supabase.from('admin_users').select('user_id'),
    ]);

    const walletMap: Record<string, number> = {};
    for (const w of (walletsRes.data ?? [])) {
      walletMap[w.user_id] = w.balance ?? 0;
    }
    const adminSet = new Set((adminsRes.data ?? []).map(a => a.user_id));

    const rows: UserRow[] = (usersRes.data ?? []).map(u => ({
      id: u.id,
      full_name: u.name ?? null,
      username: u.username ?? null,
      balance: walletMap[u.id] ?? 0,
      is_admin: adminSet.has(u.id),
    }));

    setUsers(rows);
    setFiltered(rows);
    setLoading(false);
  };

  const handleBlock = (user: UserRow) => {
    Alert.alert('Block User', `Block @${user.username ?? user.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => Alert.alert('Done', 'User blocked.') },
    ]);
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Users" />
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={17} color={Colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or username…"
          placeholderTextColor={Colors.text.muted}
          autoCapitalize="none"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={17} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.full_name ?? item.username ?? '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.full_name ?? 'No name'}</Text>
                  {item.is_admin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.username}>@{item.username ?? 'unknown'}</Text>
                <Text style={styles.balance}>₹{(item.balance ?? 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleBlock(item)} style={styles.blockBtn} activeOpacity={0.7}>
                <Ionicons name="ban-outline" size={18} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background.card,
    margin: 16, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border.default,
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, color: Colors.text.primary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background.card,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border.default,
  },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  adminBadge: {
    backgroundColor: 'rgba(254,76,17,0.15)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  adminBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  username: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 1 },
  balance: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.status.success, marginTop: 3 },
  blockBtn: { padding: 6 },
  empty: { color: Colors.text.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_400Regular' },
});
