import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformStore } from '@/src/store/platformStore';
import { Colors } from '@/src/theme/colors';

interface RuleForm { title: string; content: string; category: string; order: number; }

export default function AdminRules() {
  const insets = useSafeAreaInsets();
  const { rules, addRule, updateRule, deleteRule } = usePlatformStore() as any;
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string; form: RuleForm } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ruleList: any[] = rules ?? [];
  const filtered = ruleList.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => setModal({
    mode: 'add',
    form: { title: '', content: '', category: 'general', order: ruleList.length + 1 },
  });
  const openEdit = (r: any) => setModal({
    mode: 'edit', id: r.id,
    form: { title: r.title, content: r.content, category: r.category, order: r.order },
  });

  const handleSave = () => {
    if (!modal) return;
    const { form, mode, id } = modal;
    if (!form.title.trim()) { Alert.alert('Title required'); return; }
    if (!form.content.trim()) { Alert.alert('Content required'); return; }
    setSaving(true);
    if (mode === 'add') addRule?.({ ...form });
    else if (id) updateRule?.(id, { ...form });
    setSaving(false);
    setModal(null);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Rule', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRule?.(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Rules</Text>
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
          placeholder="Search rules..."
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.ruleCard}>
            <TouchableOpacity style={styles.ruleHeader} onPress={() => setExpanded(e => e === item.id ? null : item.id)}>
              <View style={styles.ruleIconBox}>
                <Ionicons name="book" size={16} color={Colors.brandPrimary} />
              </View>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleTitle}>{item.title}</Text>
                <Text style={styles.ruleCategory}>{item.category}</Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                <Ionicons name="pencil" size={15} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.iconBtn}>
                <Ionicons name="trash" size={15} color={Colors.brandLive} />
              </TouchableOpacity>
              <Ionicons name={expanded === item.id ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {expanded === item.id && (
              <View style={styles.ruleContent}>
                <Text style={styles.ruleText}>{item.content}</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No rules found</Text>
          </View>
        }
      />

      <Modal visible={!!modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal?.mode === 'add' ? 'Add Rule' : 'Edit Rule'}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {[
                { key: 'title', label: 'Title', multiline: false },
                { key: 'category', label: 'Category', multiline: false },
                { key: 'content', label: 'Content', multiline: true },
              ].map(f => (
                <View key={f.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, f.multiline && styles.multilineInput]}
                    value={String(modal?.form[f.key as keyof RuleForm] ?? '')}
                    onChangeText={v => setModal(m => m ? { ...m, form: { ...m.form, [f.key]: v } } : m)}
                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                    placeholderTextColor={Colors.textMuted}
                    multiline={f.multiline}
                    numberOfLines={f.multiline ? 5 : 1}
                    textAlignVertical={f.multiline ? 'top' : 'center'}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Rule</Text>}
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
  ruleCard: { backgroundColor: Colors.appCard, borderRadius: 14, overflow: 'hidden' },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  ruleIconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,107,43,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  ruleInfo: { flex: 1 },
  ruleTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ruleCategory: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  iconBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  ruleContent: { paddingHorizontal: 16, paddingBottom: 14, borderTopWidth: 1, borderTopColor: Colors.appBorder },
  ruleText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, paddingTop: 12 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.appCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  modalScroll: { padding: 20, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  input: {
    backgroundColor: Colors.appElevated, borderRadius: 12, paddingHorizontal: 14,
    height: 44, fontSize: 15, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  multilineInput: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  saveBtn: {
    marginHorizontal: 20, marginTop: 8, height: 52, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
