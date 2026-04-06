/**
 * Native Cloud Messaging (NCM) Service
 *
 * Workflow 1 — Device Registration:
 *   On sign-in, generate (or reuse) a persistent DUID and save it together
 *   with the user record and FCM/APNs push token to `device_registrations`.
 *
 * Workflow 2 — Notification Delivery:
 *   Subscribe to `ncm_notifications` via Supabase Realtime.
 *   When a pending row targeting this user (or broadcast) arrives, fire a
 *   local notification via expo-notifications and mark it delivered.
 *
 * Background fallback:
 *   Register an expo-background-fetch task that polls for pending NCM rows
 *   every ~15 min so the device can receive messages even after battery-saver
 *   kills the foreground Realtime socket.
 */

import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import * as Battery from 'expo-battery';
import { Platform, Linking, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

const DUID_KEY = 'elite_ncm_duid';
const LAST_POLL_KEY = 'elite_ncm_last_poll';
const BACKGROUND_TASK = 'NCM_BACKGROUND_POLL';

function generateDUID(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DUID-${ts}-${rand}`;
}

async function getDUID(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(DUID_KEY);
    if (stored) return stored;
    const id = generateDUID();
    await SecureStore.setItemAsync(DUID_KEY, id);
    return id;
  } catch {
    const fallback = await AsyncStorage.getItem(DUID_KEY);
    if (fallback) return fallback;
    const id = generateDUID();
    await AsyncStorage.setItem(DUID_KEY, id);
    return id;
  }
}

async function getPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    const t = await Notifications.getDevicePushTokenAsync();
    return t.data as string;
  } catch {
    return null;
  }
}

export async function registerDevice(user: User): Promise<void> {
  try {
    const duid = await getDUID();
    const pushToken = await getPushToken();

    await supabase.from('device_registrations').upsert(
      {
        user_id: user.id,
        duid,
        platform: Platform.OS,
        os_version: String(Platform.Version),
        push_token: pushToken ?? null,
        email: user.email ?? null,
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          null,
        updated_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: 'duid' },
    );
  } catch {
  }
}

export async function deregisterDevice(userId: string): Promise<void> {
  try {
    const duid = await getDUID();
    await supabase
      .from('device_registrations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('duid', duid);
  } catch {
  }
}

export async function getNCMDeviceId(): Promise<string> {
  return getDUID();
}

async function deliverNCMNotification(row: {
  id: string;
  title: string;
  body: string;
  channel_id?: string;
}): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: row.title,
        body: row.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { ncm_id: row.id },
      },
      trigger: {
        channelId: row.channel_id ?? 'elite-esports-default',
      } as Notifications.NotificationTriggerInput,
    });
  } catch {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: row.title,
        body: row.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { ncm_id: row.id },
      },
      trigger: null,
    });
  }

  await supabase
    .from('ncm_notifications')
    .update({ status: 'delivered', delivered_at: new Date().toISOString() })
    .eq('id', row.id);
}

async function pollPendingNotifications(userId: string): Promise<void> {
  try {
    const duid = await getDUID();
    const { data } = await supabase
      .from('ncm_notifications')
      .select('id, title, body, channel_id')
      .eq('status', 'pending')
      .or(`target_user_id.eq.${userId},target_user_id.is.null`)
      .or(`target_duid.eq.${duid},target_duid.is.null`);

    if (!data || data.length === 0) return;
    for (const row of data) {
      await deliverNCMNotification(row);
    }
    await AsyncStorage.setItem(LAST_POLL_KEY, Date.now().toString());
  } catch {
  }
}

TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const session = await supabase.auth.getSession();
    const userId = session?.data?.session?.user?.id;
    if (!userId) return BackgroundFetch.BackgroundFetchResult.NoData;
    await pollPendingNotifications(userId);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function registerBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK);
    if (isRegistered) return;
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
  }
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

export function subscribeNCMRealtime(userId: string): () => void {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  realtimeChannel = supabase
    .channel(`ncm-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ncm_notifications',
      },
      async (payload) => {
        const row = payload.new as {
          id: string;
          title: string;
          body: string;
          channel_id?: string;
          status: string;
          target_user_id: string | null;
          target_duid: string | null;
        };

        if (row.status !== 'pending') return;

        const duid = await getDUID();
        const targetsUser =
          row.target_user_id === null || row.target_user_id === userId;
        const targetsDUID =
          row.target_duid === null || row.target_duid === duid;

        if (targetsUser && targetsDUID) {
          await deliverNCMNotification(row);
        }
      },
    )
    .subscribe();

  const appStateSub = AppState.addEventListener('change', async (state) => {
    if (state === 'active') {
      await pollPendingNotifications(userId);
    }
  });

  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    appStateSub.remove();
  };
}

export async function requestBatteryOptimizationExemption(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const pkg = 'com.elite.esports.android';
      const url = `package:${pkg}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openSettings();
      }
    }
  } catch {
    try {
      await Linking.openSettings();
    } catch {
    }
  }
}

export async function checkBatterySaverActive(): Promise<boolean> {
  try {
    return await Battery.isBatteryOptimizationEnabledAsync();
  } catch {
    return false;
  }
}

export async function initNCM(user: User): Promise<void> {
  await registerDevice(user);
  await registerBackgroundTask();
}
