import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, ScrollView, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCampaignStore, Campaign } from '@/src/store/campaignStore';
import { Colors } from '@/src/theme/colors';

const AD_TYPES = ['Image', 'Video', 'Banner'] as const;
const TRIGGERS = ['Welcome', 'Join', 'Leave', 'Reward', 'Timer'] as const;

interface CampaignForm {
  name: string;
  adType: 'Image' | 'Video' | 'Banner';
  triggerType: 'Welcome' | 'Join' | 'Leave' | 'Reward' | 'Timer';
  mediaUrl: string;
  title: string;
  description: string;
  buttonText: string;
  linkUrl: string;
  duration: number;
  priority: number;
  isSkippable: boolean;
  skipAfter: number;
  intervalMinutes: number;
  status: 'active' | 'inactive';
}

const EMPTY: CampaignForm = {
  name: '', adType: 'Banner', triggerType: 'Welcome',
  mediaUrl: '', title: '', description: '', buttonText: '', linkUrl: '',
  duration: 5, priority: 0, isSkippable: true, skipAfter: 3, intervalMinutes: 30,
  status: 'active',
};

const TRIGGER_COLOR: Record<string, string> = {
  Welcome: Colors.brandPrimary, Join: Colors.brandSuccess,
  Leave: Colors.brandLive, Reward: Colors.brandWarning, Timer: Colors.textSecondary,
};

export default function AdminCampaign() {
  const insets = useSafeAreaInsets();
  const { campaigns, addCampaign, updateCampaign, deleteCampaign, toggleStatus } = useCampaignStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; id?: string; form: CampaignForm } | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = campaigns.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => setModal({ mode: 'add', form: { ...EMPTY } });
  const openEdit = (c: Campaign) => setModal({
    mode: 'edit', id: c.id,
    form: {
      name: c.name, adType: c.adType, triggerType: c.triggerType,
      mediaUrl: c.mediaUrl ?? '', title: c.title ?? '', description: c.description ?? '',
      buttonText: c.buttonText ?? '', linkUrl: c.linkUrl ?? '',
      duration: c.duration, priority: c.priority, isSkippable: c.isSkippable,
      skipAfter: c.skipAfter, intervalMinutes: c.intervalMinutes, status: c.status,
    },
  });

  const handleSave = async () => {
    if (!modal) return;
    const { form, mode, id } = modal;
    if (!form.name.trim()) { Alert.alert('Campaign name required'); return; }
    setSaving(true);
    const payload: Omit<Campaign, 'id' | 'createdAt'> = { ...form };
    if (mode === 'add') await addCampaign(payload);
    else if (id) await updateCampaign(id, { ...form });
    setSaving(false);
    setModal(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Campaign', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCampaign(id) },
    ]);
  };

  const set = (field: keyof CampaignForm, value: any) =>
    setModal(m => m ? { ...m, form: { ...m.form, [field]: value } } : m);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ad Campaigns</Text>
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
          placeholder="Search campaigns..."
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
              <View style={[styles.triggerBadge, { backgroundColor: `${TRIGGER_COLOR[item.triggerType] ?? Colors.textMuted}20` }]}>
                <Text style={[styles.triggerText, { color: TRIGGER_COLOR[item.triggerType] ?? Colors.textMuted }]}>
                  {item.triggerType}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.adType} · {item.duration}s · P{item.priority}</Text>
              </View>
              <Switch
                value={item.status === 'active'}
                onValueChange={() => toggleStatus(item.id)}
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
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No campaigns yet</Text>
          </View>
        }
      />

      <Modal visible={!!modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal?.mode === 'add' ? 'New Campaign' : 'Edit Campaign'}</Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.input} value={modal?.form.name ?? ''} onChangeText={v => set('name', v)} placeholder="Campaign name" placeholderTextColor={Colors.textMuted} />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Ad Type</Text>
                <View style={styles.chipRow}>
                  {AD_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, modal?.form.adType === t && styles.chipActive]} onPress={() => set('adType', t)}>
                      <Text style={[styles.chipText, modal?.form.adType === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Trigger</Text>
                <View style={styles.chipRow}>
                  {TRIGGERS.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, modal?.form.triggerType === t && styles.chipActive]} onPress={() => set('triggerType', t)}>
                      <Text style={[styles.chipText, modal?.form.triggerType === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Media URL</Text>
                <TextInput style={styles.input} value={modal?.form.mediaUrl ?? ''} onChangeText={v => set('mediaUrl', v)} placeholder="https://..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
              </View>

              <View style={styles.twoCol}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Duration (s)</Text>
                  <TextInput style={styles.input} value={String(modal?.form.duration ?? 5)} onChangeText={v => set('duration', parseInt(v) || 0)} keyboardType="numeric" />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Priority</Text>
                  <TextInput style={styles.input} value={String(modal?.form.priority ?? 0)} onChangeText={v => set('priority', parseInt(v) || 0)} keyboardType="numeric" />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Title (optional)</Text>
                <TextInput style={styles.input} value={modal?.form.title ?? ''} onChangeText={v => set('title', v)} placeholder="Ad title..." placeholderTextColor={Colors.textMuted} />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Skippable</Text>
                <Switch value={!!modal?.form.isSkippable} onValueChange={v => set('isSkippable', v)} trackColor={{ false: Colors.appFill, true: Colors.brandSuccess }} thumbColor={Colors.white} />
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Campaign</Text>}
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
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  triggerBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  triggerText: { fontSize: 11, fontWeight: '600' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.appElevated, borderRadius: 20 },
  chipActive: { backgroundColor: Colors.brandPrimary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  twoCol: { flexDirection: 'row', gap: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saveBtn: {
    marginHorizontal: 20, marginTop: 8, height: 52, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
