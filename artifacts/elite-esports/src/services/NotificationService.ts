import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

const PUSH_TOKEN_KEY = 'elite_esports_fcm_token';
const PERMISSION_PROMPTED_KEY = 'notification_permission_prompted';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'elite-esports-default',
  MATCH: 'elite-esports-match',
  REWARD: 'elite-esports-reward',
  TOURNAMENT: 'elite-esports-tournament',
  ACCOUNT: 'elite-esports-account',
};

export const CHANNEL_TO_PREF_KEY: Record<string, string> = {
  [NOTIFICATION_CHANNELS.MATCH]: 'notif_match',
  [NOTIFICATION_CHANNELS.REWARD]: 'notif_reward',
  [NOTIFICATION_CHANNELS.TOURNAMENT]: 'notif_tournament',
  [NOTIFICATION_CHANNELS.ACCOUNT]: 'notif_account',
};

export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channels: Array<{
    id: string;
    name: string;
    importance: Notifications.AndroidImportance;
    description: string;
  }> = [
    {
      id: NOTIFICATION_CHANNELS.DEFAULT,
      name: 'General',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'General Elite eSports notifications',
    },
    {
      id: NOTIFICATION_CHANNELS.MATCH,
      name: 'Match Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Match start, end & score updates',
    },
    {
      id: NOTIFICATION_CHANNELS.REWARD,
      name: 'Rewards & Prizes',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Prize credits & wallet payouts',
    },
    {
      id: NOTIFICATION_CHANNELS.TOURNAMENT,
      name: 'Tournaments',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'New tournaments & registration deadlines',
    },
    {
      id: NOTIFICATION_CHANNELS.ACCOUNT,
      name: 'Account & Security',
      importance: Notifications.AndroidImportance.MAX,
      description: 'Wallet & security alerts',
    },
  ];

  for (const ch of channels) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name: ch.name,
      importance: ch.importance,
      description: ch.description,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FE4C11',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }
}

export async function getNotificationPermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined'
> {
  if (Platform.OS === 'web') return 'undetermined';
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  await AsyncStorage.setItem(PERMISSION_PROMPTED_KEY, 'true');
  return status === 'granted';
}

export async function openSystemNotificationSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch {
    // Ignore
  }
}

function resolveDisplayName(user: User): string {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Unknown'
  );
}

async function getRawFcmToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data as string;
  } catch {
    return null;
  }
}

async function upsertTokenRecord(user: User, token: string): Promise<void> {
  const displayName = resolveDisplayName(user);
  await supabase.from('fcm_tokens').upsert(
    {
      user_id: user.id,
      token,
      platform: Platform.OS,
      email: user.email ?? null,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

/**
 * Registers or refreshes the FCM token for a signed-in user.
 * Saves user_id, email, display_name, platform, and token to Supabase.
 * Uses local cache to skip if token is already registered.
 * Safe to call multiple times.
 */
export async function saveFcmTokenForUser(user: User): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const token = await getRawFcmToken();
    if (!token) return;

    const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (cached === token) return;

    await upsertTokenRecord(user, token);
  } catch {
    // Fail silently — push notifications are non-critical
  }
}

/**
 * Backup verify-and-sync: bypasses local cache and checks Supabase directly.
 * If the token is missing from the DB (e.g. DB was wiped, first-time device),
 * it force-saves it. Returns true if a sync was performed.
 */
export async function verifyAndSyncFcmToken(user: User): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return false;

    const token = await getRawFcmToken();
    if (!token) return false;

    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('id')
      .eq('user_id', user.id)
      .eq('token', token)
      .maybeSingle();

    if (error) return false;
    if (data) return false; // already in DB — no sync needed

    // Token missing from DB — force upsert it
    await upsertTokenRecord(user, token);
    return true;
  } catch {
    return false;
  }
}

export async function removeFcmTokenForUser(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!token) return;
    await supabase
      .from('fcm_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export async function initNotifications(): Promise<boolean> {
  await setupAndroidChannels();
  const granted = await requestNotificationPermissions();
  return granted;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  channelId: string = NOTIFICATION_CHANNELS.DEFAULT,
  prefKey?: string,
): Promise<void> {
  if (Platform.OS === 'web') return;

  if (prefKey) {
    const pref = await AsyncStorage.getItem(prefKey);
    if (pref === 'false') return;
    const masterPref = await AsyncStorage.getItem('notif_all');
    if (masterPref === 'false') return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}
