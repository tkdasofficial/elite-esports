/**
 * Native Cloud Messaging (NCM) Service
 *
 * Delivery architecture (no FCM/APNs keys needed):
 *   1. Device registers → DUID + token saved to `device_registrations`
 *   2. Backend trigger  → inserts row in `ncm_notifications`
 *   3. Supabase Realtime carries the INSERT to the device (online path)
 *   4. App fires a LOCAL notification immediately on receipt
 *   5. Background fetch polls pending rows every 15 min (offline fallback)
 *   6. App foreground poll syncs any missed notifications on reconnect
 *
 * DUID (Device Unique ID):
 *   Generated once on first launch, stored in SecureStore (AsyncStorage fallback).
 *   Format: DUID-<base36 timestamp>-<random 6 chars>
 *   Persists across app restarts. One row per app-install in device_registrations.
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

// ── Constants ────────────────────────────────────────────────────────────────
const DUID_KEY        = 'elite_ncm_duid';
const LAST_POLL_KEY   = 'elite_ncm_last_poll';
const BACKGROUND_TASK = 'NCM_BACKGROUND_POLL';

// ── DUID generation & persistence ────────────────────────────────────────────
function generateDUID(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DUID-${ts}-${rand}`;
}

async function getDUID(): Promise<string> {
  // Primary: SecureStore (survives reinstall on iOS, encrypted on Android)
  try {
    const stored = await SecureStore.getItemAsync(DUID_KEY);
    if (stored) return stored;
    const id = generateDUID();
    await SecureStore.setItemAsync(DUID_KEY, id);
    return id;
  } catch {
    // Fallback: AsyncStorage (works everywhere, not encrypted)
    const fallback = await AsyncStorage.getItem(DUID_KEY);
    if (fallback) return fallback;
    const id = generateDUID();
    await AsyncStorage.setItem(DUID_KEY, id);
    return id;
  }
}

// ── Raw device push token (stored for reference, delivery is via Realtime) ───
async function getPushToken(): Promise<string | null> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    const t = await Notifications.getDevicePushTokenAsync();
    return typeof t.data === 'string' ? t.data : null;
  } catch {
    return null; // Graceful fail on emulators / no Play Services
  }
}

// ── Device registration ───────────────────────────────────────────────────────
// NOTE: push_token is intentionally omitted here.
// FCMService.registerFCMToken() writes the FCM token to device_registrations
// with full token data. NCMService only updates presence/metadata fields
// so we don't accidentally overwrite a valid token with null.
export async function registerDevice(user: User): Promise<void> {
  try {
    const duid = await getDUID();

    await supabase.from('device_registrations').upsert(
      {
        user_id:      user.id,
        duid,
        platform:     Platform.OS,
        os_version:   String(Platform.Version),
        email:        user.email ?? null,
        display_name: user.user_metadata?.full_name
                      || user.user_metadata?.name
                      || user.email?.split('@')[0]
                      || null,
        updated_at:   new Date().toISOString(),
        is_active:    true,
      },
      { onConflict: 'duid' },
    );
  } catch {
    // Non-critical — do not crash the app
  }
}

export async function deregisterDevice(userId: string): Promise<void> {
  try {
    const duid = await getDUID();
    await supabase
      .from('device_registrations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('duid', duid);
  } catch {
    // Non-critical
  }
}

export async function getNCMDeviceId(): Promise<string> {
  return getDUID();
}

// ── Local notification delivery ───────────────────────────────────────────────
async function deliverNCMNotification(row: {
  id: string;
  title: string;
  body: string;
  channel_id?: string;
}): Promise<void> {
  try {
    // Try channel-aware notification first (Android)
    await Notifications.scheduleNotificationAsync({
      content: {
        title:    row.title,
        body:     row.body,
        sound:    true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data:     { ncm_id: row.id },
      },
      trigger: {
        channelId: row.channel_id ?? 'elite-esports-default',
      } as Notifications.NotificationTriggerInput,
    });
  } catch {
    // Fallback for iOS or unsupported trigger format
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title:    row.title,
          body:     row.body,
          sound:    true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data:     { ncm_id: row.id },
        },
        trigger: null,
      });
    } catch {
      // Fail silently — notification is still in the in-app list
    }
  }

  // Mark delivered in the DB so offline poll doesn't re-send it
  try {
    await supabase
      .from('ncm_notifications')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', row.id);
  } catch {
    // Non-critical
  }
}

// ── Offline sync poll ─────────────────────────────────────────────────────────
// Called on: app foreground, background fetch, initial mount
async function pollPendingNotifications(userId: string): Promise<void> {
  try {
    const duid = await getDUID();

    // Fetch all pending rows for this user (user-specific OR broadcast)
    const { data } = await supabase
      .from('ncm_notifications')
      .select('id, title, body, channel_id')
      .eq('status', 'pending')
      .or(`target_user_id.eq.${userId},target_user_id.is.null`)
      .or(`target_duid.eq.${duid},target_duid.is.null`)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) return;

    for (const row of data) {
      await deliverNCMNotification(row);
    }

    await AsyncStorage.setItem(LAST_POLL_KEY, Date.now().toString());
  } catch {
    // Non-critical
  }
}

// ── Background fetch task (offline fallback every 15 min) ────────────────────
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
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
      minimumInterval: 15 * 60,  // 15 minutes
      stopOnTerminate: false,    // continue after app is killed
      startOnBoot:     true,     // start on device reboot
    });
  } catch {
    // Background fetch not supported in Expo Go — safe to ignore
  }
}

// ── Realtime subscription (online delivery) ───────────────────────────────────
// Two separate channels:
//   Channel A — user-specific notifications (target_user_id = userId)
//   Channel B — broadcast notifications (target_user_id IS NULL)
// This avoids receiving other users' notifications in the realtime stream.

let userChannel:      ReturnType<typeof supabase.channel> | null = null;
let broadcastChannel: ReturnType<typeof supabase.channel> | null = null;

export function subscribeNCMRealtime(userId: string): () => void {
  // Tear down any existing subscriptions first
  if (userChannel)      { supabase.removeChannel(userChannel);      userChannel = null; }
  if (broadcastChannel) { supabase.removeChannel(broadcastChannel); broadcastChannel = null; }

  // Shared handler — filters by DUID if target_duid is set
  const handleRow = async (payload: { new: Record<string, unknown> }) => {
    const row = payload.new as {
      id:             string;
      title:          string;
      body:           string;
      channel_id?:    string;
      status:         string;
      target_user_id: string | null;
      target_duid:    string | null;
    };

    if (row.status !== 'pending') return;

    // If the notification targets a specific device, verify it's this one
    if (row.target_duid !== null) {
      const duid = await getDUID();
      if (row.target_duid !== duid) return;
    }

    await deliverNCMNotification(row);
  };

  // Channel A: user-specific
  userChannel = supabase
    .channel(`ncm-user-${userId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'ncm_notifications',
        filter: `target_user_id=eq.${userId}`,
      },
      handleRow,
    )
    .subscribe();

  // Channel B: broadcast (target_user_id IS NULL)
  broadcastChannel = supabase
    .channel(`ncm-broadcast-${userId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'ncm_notifications',
        filter: 'target_user_id=is.null',
      },
      handleRow,
    )
    .subscribe();

  // Foreground sync: poll when app comes back from background
  const appStateSub = AppState.addEventListener('change', async (state) => {
    if (state === 'active') {
      await pollPendingNotifications(userId);
    }
  });

  // Cleanup function returned to the caller (NCMContext)
  return () => {
    if (userChannel)      { supabase.removeChannel(userChannel);      userChannel = null; }
    if (broadcastChannel) { supabase.removeChannel(broadcastChannel); broadcastChannel = null; }
    appStateSub.remove();
  };
}

// ── Battery saver helpers ─────────────────────────────────────────────────────
export async function requestBatteryOptimizationExemption(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const url      = `package:com.elite.esports.android`;
      const canOpen  = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openSettings();
      }
    }
  } catch {
    try { await Linking.openSettings(); } catch { /* ignore */ }
  }
}

export async function checkBatterySaverActive(): Promise<boolean> {
  try {
    return await Battery.isBatteryOptimizationEnabledAsync();
  } catch {
    return false;
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function initNCM(user: User): Promise<void> {
  await registerDevice(user);
  await registerBackgroundTask();
}
