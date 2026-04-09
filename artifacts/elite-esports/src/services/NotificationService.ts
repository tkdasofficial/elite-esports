/**
 * NotificationService — local notifications, permissions & Android channels.
 *
 * FCM token management has been consolidated into FCMService.ts.
 * This service handles:
 *  - Android notification channel setup
 *  - Permission requests & status checks
 *  - System notification settings navigation
 *  - Local notification scheduling (pref-gated)
 */

import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Channel IDs ───────────────────────────────────────────────────────────────
export const NOTIFICATION_CHANNELS = {
  DEFAULT:    'elite-esports-default',
  MATCH:      'elite-esports-match',
  REWARD:     'elite-esports-reward',
  TOURNAMENT: 'elite-esports-tournament',
  ACCOUNT:    'elite-esports-account',
} as const;

export const CHANNEL_TO_PREF_KEY: Record<string, string> = {
  [NOTIFICATION_CHANNELS.MATCH]:      'notif_match',
  [NOTIFICATION_CHANNELS.REWARD]:     'notif_reward',
  [NOTIFICATION_CHANNELS.TOURNAMENT]: 'notif_tournament',
  [NOTIFICATION_CHANNELS.ACCOUNT]:    'notif_account',
};

// ── Android channels setup ────────────────────────────────────────────────────
export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channels: Array<{
    id: string;
    name: string;
    importance: Notifications.AndroidImportance;
    description: string;
  }> = [
    {
      id:          NOTIFICATION_CHANNELS.DEFAULT,
      name:        'General',
      importance:  Notifications.AndroidImportance.HIGH,
      description: 'General Elite eSports notifications',
    },
    {
      id:          NOTIFICATION_CHANNELS.MATCH,
      name:        'Match Alerts',
      importance:  Notifications.AndroidImportance.HIGH,
      description: 'Match start, end & score updates',
    },
    {
      id:          NOTIFICATION_CHANNELS.REWARD,
      name:        'Rewards & Prizes',
      importance:  Notifications.AndroidImportance.HIGH,
      description: 'Prize credits & wallet payouts',
    },
    {
      id:          NOTIFICATION_CHANNELS.TOURNAMENT,
      name:        'Tournaments',
      importance:  Notifications.AndroidImportance.HIGH,
      description: 'New tournaments & registration deadlines',
    },
    {
      id:          NOTIFICATION_CHANNELS.ACCOUNT,
      name:        'Account & Security',
      importance:  Notifications.AndroidImportance.MAX,
      description: 'Wallet & security alerts',
    },
  ];

  for (const ch of channels) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name:                 ch.name,
      importance:           ch.importance,
      description:          ch.description,
      vibrationPattern:     [0, 250, 250, 250],
      lightColor:           '#FE4C11',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights:         true,
      enableVibrate:        true,
      showBadge:            true,
    });
  }
}

// ── Permissions ───────────────────────────────────────────────────────────────
export async function getNotificationPermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined'
> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
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

// ── Notification template ─────────────────────────────────────────────────────
// Consistent visual template for all local notifications:
//   [App icon]  Title  ←  bold subject line
//               Body   ←  smaller message text (expands to full on pull-down)
//   Accent colour #FE4C11  |  Vibration: configured per-channel (setNotificationChannelAsync)
function buildNotificationContent(
  title: string,
  body: string,
  channelId: string,
): Notifications.NotificationContentInput {
  return {
    title,
    body,
    sound:       true,
    priority:    Notifications.AndroidNotificationPriority.HIGH,
    color:       '#FE4C11',
    sticky:      false,
    autoDismiss: true,
    data:        { channelId },
  };
}

// ── Local notification scheduling (pref-gated) ────────────────────────────────
export async function scheduleLocalNotification(
  title: string,
  body: string,
  channelId: string = NOTIFICATION_CHANNELS.DEFAULT,
  prefKey?: string,
): Promise<void> {
  if (prefKey) {
    const pref = await AsyncStorage.getItem(prefKey);
    if (pref === 'false') return;
    const masterPref = await AsyncStorage.getItem('notif_all');
    if (masterPref === 'false') return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const content = buildNotificationContent(title, body, channelId);

  try {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { channelId } as Notifications.NotificationTriggerInput,
    });
  } catch {
    // Fallback: immediate delivery without channel (iOS)
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
  }
}
