import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

interface User {
  id: string;
  username: string;
  email: string;
  coins: number;
  rank: string;
  role?: string;
}

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newCoins, setNewCoins] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('coins', { ascending: false }).limit(100);
    setUsers(data || []);
    setLoading(false);
  };

  const filtered = users.filter(u =>
    !query || u.username?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase())
  );

  const handleAdjustCoins = async () => {
    if (!editUser) return;
    const amount = parseInt(newCoins);
    if (isNaN(amount)) { Alert.alert('Invalid amount'); return; }
    const newTotal = Math.max(0, (editUser.coins || 0) + amount);
    const { error } = await supabase.from('profiles').update({ coins: newTotal }).eq('id', editUser.id);
    if (error) { Alert.alert('Error', error.message); return; }
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, coins: newTotal } : u));
    setEditUser(null);
    setNewCoins('');
    Alert.alert('Updated', `${editUser.username}'s coins: ₹${newTotal}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity onPress={loadUsers}>
          <Ionicons name="refresh" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={15} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search by username or email..." placeholderTextColor={Colors.textMuted} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <LetterAvatar name={item.username || '?'} size="md" />
              <View style={styles.info}>
                <Text style={styles.username}>{item.username || 'Unnamed'}</Text>
                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.coins}>₹{item.coins || 0}</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => { setEditUser(item); setNewCoins(''); }}>
                  <Ionicons name="cash" size={14} color={Colors.brandSuccess} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {editUser && (
        <View style={styles.editSheet}>
          <Text style={styles.editTitle}>Adjust Coins for @{editUser.username}</Text>
          <Text style={styles.editBalance}>Current: ₹{editUser.coins}</Text>
          <View style={styles.editRow}>
            <TextInput
              style={styles.editInput}
              value={newCoins}
              onChangeText={setNewCoins}
              placeholder="+50 or -20"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numbers-and-punctuation"
              autoFocus
            />
            <TouchableOpacity style={styles.editApply} onPress={handleAdjustCoins}>
              <Text style={styles.editApplyText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editCancel} onPress={() => setEditUser(null)}>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.appElevated, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  info: { flex: 1 },
  username: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coins: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  editBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: `${Colors.brandSuccess}20`, alignItems: 'center', justifyContent: 'center' },
  sep: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 70 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  editSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.appCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: Colors.appBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  editTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  editBalance: { fontSize: 14, color: Colors.textMuted },
  editRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editInput: { flex: 1, height: 44, backgroundColor: Colors.appElevated, borderRadius: 10, paddingHorizontal: 12, fontSize: 16, color: Colors.textPrimary },
  editApply: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.brandSuccess, borderRadius: 10 },
  editApplyText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  editCancel: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
