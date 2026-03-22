import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, Switch, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/src/store/gameStore';
import { Colors } from '@/src/theme/colors';

interface GameForm {
  name: string;
  logo: string;
  banner: string;
  category: string;
  status: 'active' | 'inactive';
}

const EMPTY: GameForm = { name: '', logo: '', banner: '', category: '', status: 'active' };

export default function AdminGames() {
  const insets = useSafeAreaInsets();
  const { games, addGame, updateGame, deleteGame, toggleStatus } = useGameStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string; form: GameForm } | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = games.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => setModal({ mode: 'add', form: { ...EMPTY } });
  const openEdit = (g: any) => setModal({ mode: 'edit', id: g.id, form: { name: g.name, logo: g.logo, banner: g.banner, category: g.category, status: g.status } });

  const handleSave = async () => {
    if (!modal) return;
    const { form, mode, id } = modal;
    if (!form.name.trim()) { Alert.alert('Game name is required'); return; }
    if (!form.logo.trim()) { Alert.alert('Logo URL is required'); return; }
    if (!form.banner.trim()) { Alert.alert('Banner URL is required'); return; }
    setSaving(true);
    if (mode === 'add') addGame({ name: form.name, logo: form.logo, banner: form.banner, category: form.category, status: 'active' });
    else if (id) updateGame(id, { name: form.name, logo: form.logo, banner: form.banner, category: form.category, status: form.status });
    setSaving(false);
    setModal(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Game', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGame(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Games</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search games..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="game-controller" size={20} color={Colors.brandPrimary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowCategory}>{item.category || 'No category'}</Text>
            </View>
            <Switch
              value={item.status === 'active'}
              onValueChange={() => toggleStatus(item.id)}
              trackColor={{ false: Colors.appFill, true: Colors.brandSuccess }}
              thumbColor={Colors.white}
            />
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.iconBtn}>
              <Ionicons name="trash" size={16} color={Colors.brandLive} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No games found</Text>
          </View>
        }
      />

      <Modal visible={!!modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal?.mode === 'add' ? 'Add Game' : 'Edit Game'}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {(['name', 'logo', 'banner', 'category'] as const).map(field => (
                <View key={field} style={styles.field}>
                  <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)} {field === 'logo' || field === 'banner' ? 'URL' : ''}</Text>
                  <TextInput
                    style={styles.input}
                    value={modal?.form[field] ?? ''}
                    onChangeText={v => setModal(m => m ? { ...m, form: { ...m.form, [field]: v } } : m)}
                    placeholder={`Enter ${field}...`}
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Game</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.appElevated, margin: 16, borderRadius: 12,
    paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: Colors.appBorder,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { paddingBottom: 24 },
  separator: { height: 1, backgroundColor: Colors.appBorder },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,107,43,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  rowCategory: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.appCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  modalScroll: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  input: {
    height: 48, backgroundColor: Colors.appElevated, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  saveBtn: {
    marginHorizontal: 20, marginTop: 8, height: 52, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
