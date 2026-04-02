import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, AppState, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/store/AuthContext';
import { useTheme, ThemeMode } from '@/store/ThemeContext';
import { supabase } from '@/services/supabase';
import {
  getNotificationPermissionStatus,
  openSystemNotificationSettings,
  requestNotificationPermissions,
} from '@/services/NotificationService';
import { VIBRATION_KEY, setHapticEnabled, isHapticEnabled } from '@/utils/haptics';

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

const THEME_OPTIONS: { label: string; value: ThemeMode; icon: string }[] = [
  { label: 'Dark',   value: 'dark',   icon: 'moon' },
  { label: 'Light',  value: 'light',  icon: 'sunny' },
  { label: 'System', value: 'system', icon: 'phone-portrait' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [permStatus, setPermStatus] = useState<PermissionStatus>('undetermined');
  const [resetLoading, setResetLoading] = useState(false);
  const [vibrationOn, setVibrationOn] = useState(true);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadPrefs().then(setPrefs);
    AsyncStorage.getItem(VIBRATION_KEY).then(val => {
      setVibrationOn(val === null ? true : val === 'true');
    });
  }, []);

  const refreshPermStatus = useCallback(async () => {
    const s = await getNotificationPermissionStatus();
    setPermStatus(s);
  }, []);

  useEffect(() => {
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

  const handleVibrationToggle = (val: boolean) => {
    setVibrationOn(val);
    setHapticEnabled(val);
  };

  const handleResetPassword = () => {
    const email = user?.email;
    if (!email) {
      Alert.alert('Error', 'No email address found for your account.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `A password reset link will be sent to:\n\n${email}\n\nOpen the link in the email to set a new password.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            setResetLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            setResetLoading(false);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Email Sent', `Check your inbox at ${email} and follow the link to reset your password.`);
            }
          },
        },
      ]
    );
  };

  const masterOff = !prefs.all;
  const notifDisabled = permStatus !== 'granted';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Preferences ── */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.card}>
          {/* Vibration Feedback */}
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="phone-portrait" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Vibration Feedback</Text>
              <Text style={styles.rowSublabel}>
                {vibrationOn ? 'Haptic feedback is on' : 'Haptic feedback is off'}
              </Text>
            </View>
            <Switch
              value={vibrationOn}
              onValueChange={handleVibrationToggle}
              trackColor={{ false: colors.background.elevated, true: colors.primary }}
              thumbColor={vibrationOn ? '#fff' : colors.primary}
              ios_backgroundColor={colors.background.elevated}
            />
          </View>
        </View>

        {/* ── Theme ── */}
        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.themeCard}>
          {THEME_OPTIONS.map((opt, i) => {
            const isActive = themeMode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.themeOption,
                  isActive && styles.themeOptionActive,
                  i < THEME_OPTIONS.length - 1 && styles.themeOptionBorder,
                ]}
                onPress={() => setThemeMode(opt.value)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={20}
                  color={isActive ? colors.primary : colors.text.muted}
                />
                <Text style={[styles.themeLabel, isActive && styles.themeLabelActive]}>
                  {opt.label}
                </Text>
                {isActive && (
                  <View style={styles.themeCheck}>
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Notifications ── */}
        <Text style={styles.sectionTitle}>Notifications</Text>

        {permStatus !== 'granted' && (
          <TouchableOpacity style={styles.permBanner} onPress={handleEnableNotifications} activeOpacity={0.8}>
            <Ionicons name="warning-outline" size={18} color={colors.status.warning} />
            <View style={styles.permBannerText}>
              <Text style={styles.permBannerTitle}>Notifications are blocked</Text>
              <Text style={styles.permBannerSub}>Tap to open system settings and enable notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.status.warning} />
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          {(
            <>
              <View style={styles.row}>
                <View style={[styles.iconBox, {
                  backgroundColor: (permStatus === 'granted' ? colors.status.success : colors.status.warning) + '18',
                }]}>
                  <Ionicons
                    name={permStatus === 'granted' ? 'shield-checkmark' : 'shield-outline'}
                    size={18}
                    color={permStatus === 'granted' ? colors.status.success : colors.status.warning}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>System Permission</Text>
                  <Text style={styles.rowSublabel}>
                    {permStatus === 'granted'
                      ? 'Allowed — notifications will be delivered'
                      : permStatus === 'denied'
                      ? 'Blocked — tap to open system settings'
                      : 'Not yet requested — tap to enable'}
                  </Text>
                </View>
                {permStatus === 'granted' ? (
                  <View style={[styles.statusPill, styles.statusPillOn]}>
                    <Text style={styles.statusPillText}>ON</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleEnableNotifications}>
                    <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {[
            { key: 'all' as const,        icon: 'notifications',        label: 'All Notifications',      sub: prefs.all ? 'Receiving all alerts' : 'All alerts paused', disabled: notifDisabled },
            { key: 'match' as const,      icon: 'game-controller-outline', label: 'Match Notifications',  sub: 'Match start, end & score updates',          disabled: notifDisabled || masterOff },
            { key: 'reward' as const,     icon: 'gift-outline',           label: 'Reward Notifications',  sub: 'Prize credits & wallet payouts',             disabled: notifDisabled || masterOff },
            { key: 'tournament' as const, icon: 'trophy-outline',         label: 'Tournament Notifications', sub: 'New tournaments & registration deadlines', disabled: notifDisabled || masterOff },
            { key: 'account' as const,    icon: 'wallet-outline',         label: 'Account Notifications', sub: 'Wallet & security alerts',                   disabled: notifDisabled || masterOff },
          ].map(item => (
            <View key={item.key} style={[styles.row, item.disabled && styles.rowDisabled]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, item.disabled && styles.rowLabelMuted]}>{item.label}</Text>
                <Text style={styles.rowSublabel}>{item.sub}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={v => togglePref(item.key, v)}
                disabled={item.disabled}
                trackColor={{ false: colors.background.elevated, true: colors.primary }}
                thumbColor={prefs[item.key] ? '#fff' : colors.primary}
                ios_backgroundColor={colors.background.elevated}
              />
            </View>
          ))}
        </View>

        {/* ── Account ── */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleResetPassword} disabled={resetLoading} activeOpacity={0.75}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Reset Password</Text>
              <Text style={styles.rowSublabel}>Send a reset link to your email</Text>
            </View>
            {resetLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            }
          </TouchableOpacity>
        </View>

        {/* ── App ── */}
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          {[
            { icon: 'document-text-outline', label: 'Terms & Conditions', route: '/terms' },
            { icon: 'shield-checkmark-outline', label: 'Privacy Policy', route: '/privacy' },
            { icon: 'warning-outline', label: 'Disclaimer', route: '/disclaimer' },
            { icon: 'information-circle-outline', label: 'About Elite eSports', route: '/about' },
          ].map(item => (
            <TouchableOpacity
              key={item.route}
              style={styles.row}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Danger Zone ── */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ])
            }
            activeOpacity={0.75}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.status.error} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.status.error }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.appInfoRow}>
          <Text style={styles.version}>Elite eSports · v1.0.0</Text>
          <Text style={styles.packageName}>com.elite.esports.android</Text>
        </View>
      </ScrollView>

    </View>
  );
}

const ROW_PADDING = 14;
const ICON_BOX = 36;
const ROW_GAP = 12;

function createStyles(colors: ReturnType<typeof import('@/utils/colors').getColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 16 },

    sectionTitle: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4,
    },

    permBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.status.warning + '15',
      borderRadius: 100, borderWidth: 1,
      borderColor: colors.status.warning + '40',
      padding: 14, marginBottom: 10,
    },
    permBannerText: { flex: 1 },
    permBannerTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.status.warning },
    permBannerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },

    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusPillOn: {
      backgroundColor: colors.status.success + '20',
      borderWidth: 1, borderColor: colors.status.success + '50',
    },
    statusPillText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.status.success },

    card: { gap: 8 },

    themeCard: {
      flexDirection: 'row',
      gap: 8,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 6,
      backgroundColor: colors.background.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
    themeOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    themeOptionBorder: {},
    themeLabel: {
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
      color: colors.text.muted,
    },
    themeLabelActive: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    themeCheck: {
      position: 'absolute',
      top: 6,
      right: 8,
    },

    row: {
      flexDirection: 'row', alignItems: 'center',
      gap: ROW_GAP, paddingVertical: ROW_PADDING, paddingHorizontal: 18,
      backgroundColor: colors.background.card,
      borderRadius: 100, borderWidth: 1,
      borderColor: colors.border.default,
    },
    rowDisabled: { opacity: 0.4 },
    iconBox: {
      width: ICON_BOX, height: ICON_BOX, borderRadius: ICON_BOX / 2,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text.primary },
    rowLabelMuted: { color: colors.text.muted },
    rowSublabel: {
      fontSize: 11, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, marginTop: 2,
    },

    appInfoRow: { alignItems: 'center', marginTop: 24, marginBottom: 8, gap: 4 },
    version: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    packageName: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.text.muted + 'AA' },
  });
}
