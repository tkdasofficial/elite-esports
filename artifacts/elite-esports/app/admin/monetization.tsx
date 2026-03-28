import React, { useEffect, useState } from 'react';
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

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [units, trigs, settings] = await Promise.all([
      supabase.from('ad_units').select('id, name, type, ad_unit_id, status').order('name'),
      supabase.from('ad_triggers').select('id, trigger, ad_unit_id, enabled, cooldown_seconds'),
      supabase.from('ad_settings').select('*').limit(1).maybeSingle(),
    ]);

    setAdUnits((units.data ?? []).map(u => ({
      id: u.id,
      name: u.name,
      type: u.type,
      unit_id: u.ad_unit_id,
      enabled: u.status === 'active',
    })));

    setTriggers((trigs.data ?? []).map(t => ({
      id: t.id,
      trigger_type: t.trigger,
      ad_unit_id: t.ad_unit_id,
      enabled: t.enabled ?? false,
      cooldown_seconds: t.cooldown_seconds ?? 60,
    })));

    if (settings.data) {
      setSettingsId(settings.data.id ?? null);
      setAdsEnabled(settings.data.ads_enabled ?? true);
      setDefaultCooldown(String(settings.data.default_cooldown ?? 60));
    }
    setLoading(false);
  };

  const toggleUnit = async (unit: AdUnit) => {
    const newStatus = unit.enabled ? 'inactive' : 'active';
    await supabase.from('ad_units').update({ status: newStatus }).eq('id', unit.id);
    load();
  };

  const deleteUnit = async (unit: AdUnit) => {
    Alert.alert('Delete Ad Unit', `Delete "${unit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('ad_units').delete().eq('id', unit.id); load(); } },
    ]);
  };

  const addUnit = async () => {
    if (!unitForm.name.trim() || !unitForm.unit_id.trim()) { Alert.alert('Required', 'Fill all fields.'); return; }
    setSaving(true);
    await supabase.from('ad_units').insert({
      name: unitForm.name.trim(),
      type: unitForm.type,
      ad_unit_id: unitForm.unit_id.trim(),
      status: 'active',
    });
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
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminHeader title="Monetization" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ad Units</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowUnitModal(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {adUnits.length === 0 ? (
          <Text style={styles.empty}>No ad units yet.</Text>
        ) : (
          adUnits.map(unit => (
            <View key={unit.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{unit.name}</Text>
                <Text style={styles.cardSub}>{unit.type} · {unit.unit_id}</Text>
              </View>
              <Switch value={unit.enabled} onValueChange={() => toggleUnit(unit)} thumbColor="#fff" trackColor={{ true: Colors.primary, false: Colors.border.default }} />
              <TouchableOpacity onPress={() => deleteUnit(unit)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Ad Triggers</Text>
        {triggers.length === 0 ? (
          <Text style={styles.empty}>No triggers configured.</Text>
        ) : (
          triggers.map(t => {
            const unit = adUnits.find(u => u.id === t.ad_unit_id);
            return (
              <View key={t.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t.trigger_type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.cardSub}>{unit?.name ?? 'Unknown unit'} · {t.cooldown_seconds}s cooldown</Text>
                </View>
                <Switch value={t.enabled} onValueChange={() => toggleTrigger(t)} thumbColor="#fff" trackColor={{ true: Colors.primary, false: Colors.border.default }} />
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Global Settings</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ads Enabled</Text>
          <Switch value={adsEnabled} onValueChange={setAdsEnabled} thumbColor="#fff" trackColor={{ true: Colors.primary, false: Colors.border.default }} />
        </View>
        <View style={[styles.card, { marginTop: 8 }]}>
          <Text style={[styles.cardTitle, { flex: 1 }]}>Default Cooldown (s)</Text>
          <TextInput
            style={styles.cooldownInput}
            value={defaultCooldown}
            onChangeText={setDefaultCooldown}
            keyboardType="numeric"
            placeholderTextColor={Colors.text.muted}
          />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showUnitModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowUnitModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Ad Unit</Text>
            <TouchableOpacity onPress={() => setShowUnitModal(false)}><Ionicons name="close" size={22} color={Colors.text.primary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {[{ label: 'Name', key: 'name', ph: 'Banner - Home' }, { label: 'Ad Unit ID', key: 'unit_id', ph: 'ca-app-pub-xxx/yyy' }].map(f => (
              <View key={f.key} style={{ marginBottom: 16 }}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={(unitForm as any)[f.key]}
                    onChangeText={v => setUnitForm(p => ({ ...p, [f.key]: v }))}
                    placeholder={f.ph}
                    placeholderTextColor={Colors.text.muted}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {AD_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, unitForm.type === t && styles.typeChipActive]}
                  onPress={() => setUnitForm(p => ({ ...p, type: t }))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeChipText, unitForm.type === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={addUnit} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Unit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(254,76,17,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border.default, marginBottom: 8, gap: 12 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  cardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  deleteBtn: { padding: 4 },
  cooldownInput: { width: 64, backgroundColor: Colors.background.elevated, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: Colors.text.primary, textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  empty: { color: Colors.text.muted, textAlign: 'center', paddingVertical: 16, fontFamily: 'Inter_400Regular', fontSize: 13 },
  modal: { flex: 1, backgroundColor: Colors.background.dark },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrapper: { backgroundColor: Colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 14, height: 50, justifyContent: 'center' },
  input: { color: Colors.text.primary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  typeChipTextActive: { color: '#fff' },
});
