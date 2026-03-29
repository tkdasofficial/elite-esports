import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = 'elite_esports_push_token';
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

  const channels: Array<{ id: string; name: string; importance: Notifications.AndroidImportance; description: string }> = [
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

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
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

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (stored) return stored;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export async function initNotifications(): Promise<boolean> {
  await setupAndroidChannels();
  const granted = await requestNotificationPermissions();
  if (granted) {
    await registerPushToken();
  }
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
