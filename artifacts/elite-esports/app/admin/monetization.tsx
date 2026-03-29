import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Switch, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

interface AdUnit { id: string; name: string; type: string; unit_id: string; enabled: boolean; }
interface AdTrigger { id: string; trigger_type: string; ad_unit_id: string; enabled: boolean; cooldown_seconds: number; }

const AD_TYPES = ['interstitial', 'rewarded', 'app_open'];
const TYPE_ICONS: Record<string, string> = {
  interstitial: 'layers-outline', rewarded: 'gift-outline', app_open: 'phone-portrait-outline',
};

export default function AdminMonetizationScreen() {
  const insets = useSafeAreaInsets();
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [triggers, setTriggers] = useState<AdTrigger[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [defaultCooldown, setDefaultCooldown] = useState('60');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: '', type: 'interstitial', unit_id: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [units, trigs, settings] = await Promise.all([
      supabase.from('ad_units').select('id, name, type, ad_unit_id, status').order('name'),
      supabase.from('ad_triggers').select('id, trigger, ad_unit_id, enabled, cooldown_seconds'),
      supabase.from('ad_settings').select('*').limit(1).maybeSingle(),
    ]);

    setAdUnits((units.data ?? []).map((u: any) => ({
      id: u.id, name: u.name, type: u.type, unit_id: u.ad_unit_id, enabled: u.status === 'active',
    })));
    setTriggers((trigs.data ?? []).map((t: any) => ({
      id: t.id, trigger_type: t.trigger, ad_unit_id: t.ad_unit_id, enabled: t.enabled ?? false, cooldown_seconds: t.cooldown_seconds ?? 60,
    })));

    if (settings.data) {
      setSettingsId(settings.data.id ?? null);
      setAdsEnabled(settings.data.ads_enabled ?? true);
      setDefaultCooldown(String(settings.data.default_cooldown ?? 60));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleUnit = async (unit: AdUnit) => {
    await supabase.from('ad_units').update({ status: unit.enabled ? 'inactive' : 'active' }).eq('id', unit.id);
    load();
  };

  const deleteUnit = (unit: AdUnit) => {
    Alert.alert('Delete Ad Unit', `Delete "${unit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('ad_units').delete().eq('id', unit.id); load(); } },
    ]);
  };

  const addUnit = async () => {
    if (!unitForm.name.trim() || !unitForm.unit_id.trim()) { Alert.alert('Required', 'Fill all fields.'); return; }
    setSaving(true);
    await supabase.from('ad_units').insert({ name: unitForm.name.trim(), type: unitForm.type, ad_unit_id: unitForm.unit_id.trim(), status: 'active' });
    setSaving(false);
    setShowUnitModal(false);
    setUnitForm({ name: '', type: 'interstitial', unit_id: '' });
    load();
  };

  const toggleTrigger = async (t: AdTrigger) => {
    await supabase.from('ad_triggers').update({ enabled: !t.enabled }).eq('id', t.id);
    load();
  };

  const saveSettings = async () => {
    const cooldown = parseInt(defaultCooldown) || 60;
    if (settingsId) {
      await supabase.from('ad_settings').update({ ads_enabled: adsEnabled, default_cooldown: cooldown }).eq('id', settingsId);
    } else {
      await supabase.from('ad_settings').insert({ ads_enabled: adsEnabled, default_cooldown: cooldown });
    }
    Alert.alert('Saved', 'Global ad settings updated.');
  };

  if (loading) return (
    <View style={[styles.root, styles.centered]}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.root}>
      <AdminHeader
        title="Monetization"
        rightElement={
          <TouchableOpacity onPress={() => setShowUnitModal(true)} style={styles.addBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        {/* Global Toggle */}
        <View style={[styles.globalCard, { borderColor: adsEnabled ? Colors.status.success + '40' : C.border }]}>
          <View style={styles.globalLeft}>
            <View style={[styles.globalIcon, { backgroundColor: adsEnabled ? 'rgba(34,197,94,0.12)' : C.elevated }]}>
              <Ionicons name="flash" size={20} color={adsEnabled ? Colors.status.success : Colors.text.muted} />
            </View>
            <View>
              <Text style={styles.globalTitle}>Ads Enabled</Text>
              <Text style={styles.globalSub}>{adsEnabled ? 'Ads are running' : 'All ads paused'}</Text>
            </View>
          </View>
          <Switch
            value={adsEnabled}
            onValueChange={setAdsEnabled}
            thumbColor="#fff"
            trackColor={{ true: Colors.status.success, false: C.elevated }}
          />
        </View>

        {/* Ad Units */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ad Units</Text>
          <Text style={styles.sectionCount}>{adUnits.length}</Text>
        </View>

        {adUnits.length === 0 ? (
          <View style={styles.emptyInline}>
            <Ionicons name="phone-portrait-outline" size={32} color={Colors.text.muted} />
            <Text style={styles.emptyInlineText}>No ad units yet. Tap + to add one.</Text>
          </View>
        ) : (
          adUnits.map(unit => (
            <View key={unit.id} style={styles.card}>
              <View style={[styles.typeIcon, { backgroundColor: unit.enabled ? 'rgba(254,76,17,0.12)' : C.elevated }]}>
                <Ionicons name={(TYPE_ICONS[unit.type] ?? 'layers-outline') as any} size={16} color={unit.enabled ? Colors.primary : Colors.text.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{unit.name}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{unit.type} · {unit.unit_id}</Text>
              </View>
              <Switch
                value={unit.enabled}
                onValueChange={() => toggleUnit(unit)}
                thumbColor="#fff"
                trackColor={{ true: Colors.primary, false: C.border }}
              />
              <TouchableOpacity onPress={() => deleteUnit(unit)} style={styles.deleteBtn} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={16} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Ad Triggers */}
        {triggers.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>Ad Triggers</Text>
              <Text style={styles.sectionCount}>{triggers.filter(t => t.enabled).length} active</Text>
            </View>
            {triggers.map(t => {
              const unit = adUnits.find(u => u.id === t.ad_unit_id);
              return (
                <View key={t.id} style={styles.card}>
                  <View style={[styles.typeIcon, { backgroundColor: t.enabled ? 'rgba(59,130,246,0.12)' : C.elevated }]}>
                    <Ionicons name="git-branch-outline" size={16} color={t.enabled ? Colors.status.info : Colors.text.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{t.trigger_type.replace(/_/g, ' ')}</Text>
                    <Text style={styles.cardSub}>{unit?.name ?? 'Unknown'} · {t.cooldown_seconds}s cooldown</Text>
                  </View>
                  <Switch value={t.enabled} onValueChange={() => toggleTrigger(t)} thumbColor="#fff" trackColor={{ true: Colors.primary, false: C.border }} />
                </View>
              );
            })}
          </>
        )}

        {/* Global Settings */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Global Settings</Text>
        </View>
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Default Cooldown</Text>
            <Text style={styles.cardSub}>Seconds between ad displays</Text>
          </View>
          <TextInput
            style={styles.cooldownInput}
            value={defaultCooldown}
            onChangeText={setDefaultCooldown}
            keyboardType="numeric"
            placeholderTextColor={Colors.text.muted}
          />
          <Text style={styles.cooldownUnit}>sec</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings} activeOpacity={0.85}>
          <Ionicons name="save-outline" size={17} color="#fff" />
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Ad Unit Modal */}
      <Modal visible={showUnitModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowUnitModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Ad Unit</Text>
            <TouchableOpacity onPress={() => setShowUnitModal(false)} style={styles.modalClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {[
              { label: 'Unit Name', key: 'name' as const, ph: 'e.g. Home Banner' },
              { label: 'Ad Unit ID', key: 'unit_id' as const, ph: 'ca-app-pub-xxx/yyy' },
            ].map(f => (
              <View key={f.key} style={{ marginBottom: 16 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={unitForm[f.key]}
                    onChangeText={v => setUnitForm(p => ({ ...p, [f.key]: v }))}
                    placeholder={f.ph}
                    placeholderTextColor={Colors.text.muted}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}
            <Text style={styles.fieldLabel}>Ad Type</Text>
            <View style={styles.typeRow}>
              {AD_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, unitForm.type === t && styles.typeChipActive]}
                  onPress={() => setUnitForm(p => ({ ...p, type: t }))}
                  activeOpacity={0.8}
                >
                  <Ionicons name={(TYPE_ICONS[t] ?? 'layers-outline') as any} size={14} color={unitForm.type === t ? '#fff' : Colors.text.muted} />
                  <Text style={[styles.typeChipText, unitForm.type === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={addUnit} disabled={saving} activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="add-circle-outline" size={17} color="#fff" />
                  <Text style={styles.saveBtnText}>Add Unit</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const C = { card: '#111111', border: '#2A2A2A', elevated: '#1A1A1A' };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },
  addBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(254,76,17,0.12)', borderRadius: 11 },
  globalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 20 },
  globalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  globalIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  globalTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  globalSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  sectionCount: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, backgroundColor: C.elevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8, gap: 12 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  cardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  deleteBtn: { padding: 6 },
  cooldownInput: { width: 60, backgroundColor: C.elevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: Colors.text.primary, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 15, borderWidth: 1, borderColor: C.border },
  cooldownUnit: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, height: 52, marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  emptyInline: { alignItems: 'center', paddingVertical: 24, gap: 8, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  emptyInlineText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  modal: { flex: 1, backgroundColor: Colors.background.dark },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: C.elevated, borderRadius: 10 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrap: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 50, justifyContent: 'center' },
  input: { color: Colors.text.primary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  typeChipTextActive: { color: '#fff' },
});
