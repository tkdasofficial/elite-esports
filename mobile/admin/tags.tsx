import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, ScrollView, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdTagStore } from '@/src/store/adTagStore';
import { Colors } from '@/src/theme/colors';

const AD_TYPES = ['banner', 'interstitial', 'native', 'custom'];
const POSITIONS = ['join_button_ad', 'leave_button_ad', 'welcome_ad', 'get_reward_ad', 'timer_ad'];
const CODE_TYPES = ['html', 'javascript', 'url'];

const POSITION_LABELS: Record<string, string> = {
  join_button_ad:  'Join Match',
  leave_button_ad: 'Leave Match',
  welcome_ad:      'Welcome',
  get_reward_ad:   'Claim Reward',
  timer_ad:        'Timer (Auto)',
};

interface TagForm {
  name: string;
  type: string;
  code_type: string;
  code: string;
  position: string;
  is_active: boolean;
  priority: number;
}
const EMPTY: TagForm = {
  name: '', type: 'banner', code_type: 'html', code: '',
  position: 'welcome_ad', is_active: true, priority: 0,
};

export default function AdminTags() {
  const insets = useSafeAreaInsets();
  const { tags: adTags, createTag: addTag, updateTag, deleteTag, toggleTag, fetchAllTags } = useAdTagStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string; form: TagForm } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAllTags(); }, []);

  const list: any[] = adTags ?? [];
  const filtered = list.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => setModal({ mode: 'add', form: { ...EMPTY } });
  const openEdit = (t: any) => setModal({
    mode: 'edit', id: t.id,
    form: { name: t.name, type: t.type, code_type: t.code_type, code: t.code ?? '', position: t.position, is_active: t.is_active, priority: t.priority ?? 0 },
  });

  const handleSave = async () => {
    if (!modal) return;
    const { form, mode, id } = modal;
    if (!form.name.trim()) { Alert.alert('Name required'); return; }
    if (!form.code.trim()) { Alert.alert('Code/URL required'); return; }
    setSaving(true);
    if (mode === 'add') await addTag({ ...form, notes: '' } as any);
    else if (id) await updateTag(id, { ...form } as any);
    setSaving(false);
    setModal(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Ad Tag', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTag?.(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ad Tags</Text>
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
          placeholder="Search tags..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  {POSITION_LABELS[item.position] ?? item.position} · {item.type} · {item.code_type}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Switch
                  value={!!item.is_active}
                  onValueChange={() => toggleTag?.(item.id)}
                  trackColor={{ false: Colors.appFill, true: Colors.brandSuccess }}
                  thumbColor={Colors.white}
                />
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={15} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={15} color={Colors.brandLive} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No ad tags yet</Text>
          </View>
        }
      />

      <Modal visible={!!modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal?.mode === 'add' ? 'New Ad Tag' : 'Edit Ad Tag'}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={modal?.form.name ?? ''}
                  onChangeText={v => setModal(m => m ? { ...m, form: { ...m.form, name: v } } : m)}
                  placeholder="Tag name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {[
                { label: 'Ad Type', key: 'type', options: AD_TYPES },
                { label: 'Code Type', key: 'code_type', options: CODE_TYPES },
                { label: 'Position', key: 'position', options: POSITIONS },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {f.options.map(o => {
                      const isActive = modal?.form[f.key as keyof TagForm] === o;
                      return (
                        <TouchableOpacity
                          key={o}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => setModal(m => m ? { ...m, form: { ...m.form, [f.key]: o } } : m)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                            {POSITION_LABELS[o] ?? o}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Code / URL</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={modal?.form.code ?? ''}
                  onChangeText={v => setModal(m => m ? { ...m, form: { ...m.form, code: v } } : m)}
                  placeholder="Paste ad code or URL..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Active</Text>
                <Switch
                  value={!!modal?.form.is_active}
                  onValueChange={v => setModal(m => m ? { ...m, form: { ...m.form, is_active: v } } : m)}
                  trackColor={{ false: Colors.appFill, true: Colors.brandSuccess }}
                  thumbColor={Colors.white}
                />
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Tag</Text>}
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
  list: { padding: 16, gap: 8, paddingBottom: 40 },
  card: { backgroundColor: Colors.appCard, borderRadius: 14, padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardLeft: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.appCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  modalScroll: { padding: 20, gap: 14 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  input: {
    height: 44, backgroundColor: Colors.appElevated, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  codeInput: { height: 100, paddingTop: 12 },
  chipRow: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.appElevated, borderRadius: 20 },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saveBtn: {
    marginHorizontal: 20, marginTop: 8, height: 52, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
