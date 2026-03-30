import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, Modal, TextInput, KeyboardAvoidingView, Pressable, AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/services/supabase';
import {
  getNotificationPermissionStatus,
  openSystemNotificationSettings,
  requestNotificationPermissions,
} from '@/services/NotificationService';

/* ── Notification preference keys ── */
const NOTIF_KEYS = {
  all:        'notif_all',
  match:      'notif_match',
  reward:     'notif_reward',
  tournament: 'notif_tournament',
  account:    'notif_account',
} as const;

type NotifPrefs = Record<keyof typeof NOTIF_KEYS, boolean>;
type PermissionStatus = 'granted' | 'denied' | 'undetermined';

const DEFAULT_PREFS: NotifPrefs = {
  all: true, match: true, reward: true, tournament: true, account: true,
};

async function loadPrefs(): Promise<NotifPrefs> {
  const entries = await Promise.all(
    Object.entries(NOTIF_KEYS).map(async ([key, storageKey]) => {
      const val = await AsyncStorage.getItem(storageKey);
      return [key, val === null ? true : val === 'true'] as const;
    })
  );
  return Object.fromEntries(entries) as NotifPrefs;
}

async function savePref(key: keyof typeof NOTIF_KEYS, value: boolean) {
  await AsyncStorage.setItem(NOTIF_KEYS[key], String(value));
}

/* ── Reusable row components ── */
function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SettingRow({
  icon, iconColor, label, sublabel, type, value, onToggle, onPress, disabled, rightIcon,
}: {
  icon: string; iconColor?: string; label: string; sublabel?: string;
  type: 'toggle' | 'arrow' | 'danger' | 'info';
  value?: boolean; onToggle?: (v: boolean) => void;
  onPress?: () => void; disabled?: boolean; rightIcon?: React.ReactNode;
}) {
  const ic = iconColor ?? Colors.primary;
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={type !== 'toggle' ? onPress : undefined}
      activeOpacity={type === 'toggle' || type === 'info' ? 1 : 0.75}
      disabled={type === 'toggle' || type === 'info' || (!onPress && type !== 'danger')}
    >
      <View style={[styles.iconBox, type === 'danger' && styles.dangerIconBox, { backgroundColor: ic + '18' }]}>
        <Ionicons name={icon as any} size={18} color={ic} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, type === 'danger' && styles.dangerLabel, disabled && styles.rowLabelMuted]}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      {type === 'toggle' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: Colors.background.surface, true: Colors.primary }}
          thumbColor="#fff"
        />
      )}
      {type === 'arrow' && <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />}
      {type === 'info' && rightIcon}
    </TouchableOpacity>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function CardDivider() {
  return null;
}

/* ── Permission Status Banner ── */
function PermissionBanner({ status, onEnable }: { status: PermissionStatus; onEnable: () => void }) {
  if (status === 'granted') return null;
  return (
    <TouchableOpacity style={styles.permBanner} onPress={onEnable} activeOpacity={0.8}>
      <Ionicons name="warning-outline" size={18} color={Colors.status.warning} />
      <View style={styles.permBannerText}>
        <Text style={styles.permBannerTitle}>Notifications are blocked</Text>
        <Text style={styles.permBannerSub}>Tap to open system settings and enable notifications</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={Colors.status.warning} />
    </TouchableOpacity>
  );
}

/* ── Main screen ── */
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [permStatus, setPermStatus] = useState<PermissionStatus>('undetermined');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* Load saved prefs */
  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  /* Check system permission — re-check whenever app comes to foreground */
  const refreshPermStatus = useCallback(async () => {
    const s = await getNotificationPermissionStatus();
    setPermStatus(s);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    refreshPermStatus();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refreshPermStatus();
    });
    return () => sub.remove();
  }, [refreshPermStatus]);

  const handleEnableNotifications = async () => {
    if (permStatus === 'undetermined') {
      const granted = await requestNotificationPermissions();
      setPermStatus(granted ? 'granted' : 'denied');
    } else {
      openSystemNotificationSettings();
    }
  };

  const togglePref = async (key: keyof NotifPrefs, value: boolean) => {
    if (key === 'all') {
      const next = { all: value, match: value, reward: value, tournament: value, account: value };
      setPrefs(next);
      await Promise.all(
        (Object.keys(NOTIF_KEYS) as (keyof typeof NOTIF_KEYS)[]).map(k => savePref(k, value))
      );
    } else {
      const next = { ...prefs, [key]: value };
      const anyOn = next.match || next.reward || next.tournament || next.account;
      next.all = anyOn;
      setPrefs(next);
      await savePref(key, value);
      await savePref('all', anyOn);
    }
  };

  const handleChangePassword = () => { setNewPassword(''); setShowPasswordModal(true); };

  const confirmPasswordChange = async () => {
    if (newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    setShowPasswordModal(false);
    Alert.alert(error ? 'Error' : 'Success', error ? error.message : 'Password updated successfully!');
  };

  const masterOff = !prefs.all;
  const notifDisabled = Platform.OS !== 'web' && permStatus !== 'granted';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET + 24 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Notifications ── */}
        <SectionTitle title="Notifications" />

        {/* Permission Banner — only visible on native when blocked */}
        {Platform.OS !== 'web' && permStatus !== 'granted' && (
          <PermissionBanner status={permStatus} onEnable={handleEnableNotifications} />
        )}

        <Card>
          {/* System permission status row */}
          {Platform.OS !== 'web' && (
            <>
              <SettingRow
                icon={permStatus === 'granted' ? 'shield-checkmark' : 'shield-outline'}
                iconColor={permStatus === 'granted' ? Colors.status.success : Colors.status.warning}
                label="System Permission"
                sublabel={
                  permStatus === 'granted'
                    ? 'Allowed — notifications will be delivered'
                    : permStatus === 'denied'
                    ? 'Blocked — tap to open system settings'
                    : 'Not yet requested — tap to enable'
                }
                type={permStatus !== 'granted' ? 'arrow' : 'info'}
                onPress={permStatus !== 'granted' ? handleEnableNotifications : undefined}
                rightIcon={
                  permStatus === 'granted' ? (
                    <View style={[styles.statusPill, styles.statusPillOn]}>
                      <Text style={styles.statusPillText}>ON</Text>
                    </View>
                  ) : null
                }
              />
              <CardDivider />
            </>
          )}

          <SettingRow
            icon="notifications"
            label="All Notifications"
            sublabel={prefs.all ? 'Receiving all alerts' : 'All alerts paused'}
            type="toggle"
            value={prefs.all}
            onToggle={v => togglePref('all', v)}
            disabled={notifDisabled}
          />
          <CardDivider />
          <SettingRow
            icon="game-controller-outline"
            label="Match Notifications"
            sublabel="Match start, end & score updates"
            type="toggle"
            value={prefs.match}
            onToggle={v => togglePref('match', v)}
            disabled={notifDisabled || masterOff}
          />
          <CardDivider />
          <SettingRow
            icon="gift-outline"
            label="Reward Notifications"
            sublabel="Prize credits & wallet payouts"
            type="toggle"
            value={prefs.reward}
            onToggle={v => togglePref('reward', v)}
            disabled={notifDisabled || masterOff}
          />
          <CardDivider />
          <SettingRow
            icon="trophy-outline"
            label="Tournament Notifications"
            sublabel="New tournaments & registration deadlines"
            type="toggle"
            value={prefs.tournament}
            onToggle={v => togglePref('tournament', v)}
            disabled={notifDisabled || masterOff}
          />
          <CardDivider />
          <SettingRow
            icon="wallet-outline"
            label="Account Notifications"
            sublabel="Wallet & security alerts"
            type="toggle"
            value={prefs.account}
            onToggle={v => togglePref('account', v)}
            disabled={notifDisabled || masterOff}
          />
        </Card>

        {/* ── Account ── */}
        <SectionTitle title="Account" />
        <Card>
          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            type="arrow"
            onPress={handleChangePassword}
          />
        </Card>

        {/* ── App ── */}
        <SectionTitle title="App" />
        <Card>
          <SettingRow
            icon="document-text-outline"
            label="Terms & Conditions"
            type="arrow"
            onPress={() => router.push('/terms')}
          />
          <CardDivider />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            type="arrow"
            onPress={() => router.push('/privacy')}
          />
          <CardDivider />
          <SettingRow
            icon="information-circle-outline"
            label="About Elite eSports"
            type="arrow"
            onPress={() => router.push('/about')}
          />
        </Card>

        {/* ── Danger Zone ── */}
        <SectionTitle title="Danger Zone" />
        <Card>
          <SettingRow
            icon="log-out-outline"
            iconColor={Colors.status.error}
            label="Sign Out"
            type="danger"
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ])
            }
          />
        </Card>

        {/* ── App Info ── */}
        <View style={styles.appInfoRow}>
          <Text style={styles.version}>Elite eSports · v1.0.0</Text>
          <Text style={styles.packageName}>com.elite.esports.android</Text>
        </View>
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPasswordModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Text style={styles.modalSubtitle}>Enter your new password (min. 6 characters)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New password"
                placeholderTextColor={Colors.text.muted}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={confirmPasswordChange}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm, passwordLoading && styles.modalBtnDisabled]}
                  onPress={confirmPasswordChange}
                  disabled={passwordLoading}
                >
                  <Text style={styles.modalBtnConfirmText}>{passwordLoading ? 'Saving…' : 'Update'}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}

const ROW_PADDING = 14;
const ICON_BOX = 36;
const ROW_GAP = 12;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 16 },

  sectionTitle: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4,
  },

  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.status.warning + '15',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.status.warning + '40',
    padding: 14,
    marginBottom: 10,
  },
  permBannerText: { flex: 1 },
  permBannerTitle: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.status.warning,
  },
  permBannerSub: {
    fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2,
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillOn: {
    backgroundColor: Colors.status.success + '20',
    borderWidth: 1,
    borderColor: Colors.status.success + '50',
  },
  statusPillText: {
    fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.status.success,
  },

  card: {
    gap: 8,
  },
  divider: {
    height: 0,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: ROW_GAP, padding: ROW_PADDING,
    backgroundColor: Colors.background.card,
    borderRadius: 28, borderWidth: 1,
    borderColor: Colors.border.default,
  },
  rowDisabled: { opacity: 0.4 },
  iconBox: {
    width: ICON_BOX, height: ICON_BOX, borderRadius: ICON_BOX / 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dangerIconBox: { backgroundColor: 'rgba(239,68,68,0.12)' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  rowLabelMuted: { color: Colors.text.muted },
  rowSublabel: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    color: Colors.text.muted, marginTop: 2,
  },
  dangerLabel: { color: Colors.status.error },

  appInfoRow: { alignItems: 'center', marginTop: 24, marginBottom: 8, gap: 4 },
  version: {
    fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted,
  },
  packageName: {
    fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.text.muted + 'AA',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 400,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 20 },
  modalInput: {
    backgroundColor: Colors.background.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default,
    color: Colors.text.primary, fontFamily: 'Inter_400Regular',
    fontSize: 15, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: {
    backgroundColor: Colors.background.surface,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  modalBtnCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  modalBtnConfirm: { backgroundColor: Colors.primary },
  modalBtnConfirmText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  modalBtnDisabled: { opacity: 0.6 },
});
