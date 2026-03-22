import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategoryStore } from '@/src/store/categoryStore';
import { Colors } from '@/src/theme/colors';

interface CategoryForm { name: string; iconName: string; description: string; }
const EMPTY: CategoryForm = { name: '', iconName: 'game-controller', description: '' };

export default function AdminCategories() {
  const insets = useSafeAreaInsets();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore() as any;
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string; form: CategoryForm } | null>(null);
  const [saving, setSaving] = useState(false);

  const catList: any[] = categories ?? [];
  const filtered = catList.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => setModal({ mode: 'add', form: { ...EMPTY } });
  const openEdit = (c: any) => setModal({
    mode: 'edit', id: c.id,
    form: { name: c.name, iconName: c.iconName ?? '', description: c.description ?? '' },
  });

  const handleSave = () => {
    if (!modal) return;
    const { form, mode, id } = modal;
    if (!form.name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    if (mode === 'add') addCategory?.({ ...form });
    else if (id) updateCategory?.(id, { ...form });
    setSaving(false);
    setModal(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory?.(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
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
          placeholder="Search categories..."
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
              <Ionicons name="grid" size={18} color={Colors.brandPrimary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.name}</Text>
              {item.description ? <Text style={styles.rowDesc} numberOfLines={1}>{item.description}</Text> : null}
            </View>
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
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        }
      />

      <Modal visible={!!modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal?.mode === 'add' ? 'Add Category' : 'Edit Category'}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {([
                { key: 'name', label: 'Name', placeholder: 'e.g. Battle Royale' },
                { key: 'iconName', label: 'Icon Name', placeholder: 'e.g. game-controller' },
                { key: 'description', label: 'Description', placeholder: 'Short description...' },
              ] as const).map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={modal?.form[f.key] ?? ''}
                    onChangeText={v => setModal(m => m ? { ...m, form: { ...m.form, [f.key]: v } } : m)}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Category</Text>}
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,107,43,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  rowDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.appCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  modalBody: { padding: 20, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  input: {
    height: 44, backgroundColor: Colors.appElevated, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  saveBtn: {
    marginHorizontal: 20, marginTop: 8, height: 52, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
