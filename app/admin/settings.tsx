import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Switch, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlatformStore } from '@/src/store/platformStore';
import { Colors } from '@/src/theme/colors';

export default function AdminSettings() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = usePlatformStore();
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(form);
    setSaving(false);
    Alert.alert('Saved', 'Settings updated successfully.');
  };

  const Section = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const FieldRow = ({ label, field, keyboardType = 'default', multiline = false }: any) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={String(form[field] ?? '')}
        onChangeText={v => set(field, v)}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCapitalize="none"
      />
    </View>
  );

  const ToggleRow = ({ label, field, sub }: any) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub && <Text style={styles.toggleSub}>{sub}</Text>}
      </View>
      <Switch
        value={!!form[field]}
        onValueChange={v => set(field, v)}
        trackColor={{ false: Colors.appFill, true: Colors.brandSuccess }}
        thumbColor={Colors.white}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section title="Platform" />
        <View style={styles.card}>
          <FieldRow label="Platform Name" field="platformName" />
          <FieldRow label="Support Email" field="supportEmail" keyboardType="email-address" />
          <FieldRow label="Contact Phone" field="contactPhone" keyboardType="phone-pad" />
        </View>

        <Section title="Economy" />
        <View style={styles.card}>
          <FieldRow label="Referral Bonus (Coins)" field="referralBonus" keyboardType="numeric" />
          <FieldRow label="Min Deposit (₹)" field="minDeposit" keyboardType="numeric" />
          <FieldRow label="Min Withdraw (₹)" field="minWithdraw" keyboardType="numeric" />
          <FieldRow label="UPI ID" field="upiId" />
          <FieldRow label="Gift Card Instructions" field="giftCardInstructions" multiline />
        </View>

        <Section title="Features" />
        <View style={styles.card}>
          <ToggleRow label="Maintenance Mode" field="maintenanceMode" sub="Disable app access for users" />
          <View style={styles.divider} />
          <ToggleRow label="Allow Registration" field="allowRegistration" />
          <View style={styles.divider} />
          <ToggleRow label="Enable Referrals" field="enableReferrals" />
          <View style={styles.divider} />
          <ToggleRow label="Enable Wallet" field="enableWallet" />
        </View>

        <Section title="Social" />
        <View style={styles.card}>
          <FieldRow label="Discord Link" field="discordLink" />
          <FieldRow label="Telegram Link" field="telegramLink" />
          <FieldRow label="Instagram Link" field="instagramLink" />
          <FieldRow label="YouTube Link" field="youtubeLink" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginTop: 12, marginBottom: 6, paddingHorizontal: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden', gap: 0 },
  field: { padding: 16, gap: 6, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  label: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  input: {
    height: 40, backgroundColor: Colors.appElevated, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 15, color: Colors.textPrimary,
  },
  multiline: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, color: Colors.textPrimary },
  toggleSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 16 },
  saveBtn: {
    height: 52, backgroundColor: Colors.brandPrimary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
