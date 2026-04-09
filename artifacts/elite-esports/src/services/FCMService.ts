/**
 * FCMService — Firebase Cloud Messaging integration via expo-notifications
 *
 * This service is the single source of truth for:
 *  1. Getting & refreshing FCM push tokens (device-level, via expo-notifications)
 *  2. Persisting tokens to Supabase (fcm_tokens + device_registrations tables)
 *  3. Handling token refresh (automatic re-sync on FCM token rotation)
 *  4. Deregistering tokens on logout
 *  5. Notification response routing (tap → navigate to correct in-app screen)
 *  6. Handling the "killed app" tap via getLastNotificationResponseAsync
 *
 * Architecture:
 *  - expo-notifications wraps FCM on Android (google-services.json is in place).
 *  - getDevicePushTokenAsync() → raw FCM registration token.
 *  - addPushTokenListener() → fires when FCM rotates the token.
 *  - addNotificationResponseReceivedListener() → fires on notification tap.
 *  - getLastNotificationResponseAsync() → handles tap that launched a killed app.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

// ── Constants ─────────────────────────────────────────────────────────────────
const FCM_TOKEN_CACHE_KEY  = 'elite_fcm_token_v2';
const DUID_KEY             = 'elite_ncm_duid';

// ── Notification handler (must be set at module load, before any await) ───────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

// ── Android channels ──────────────────────────────────────────────────────────
export const CHANNELS = {
  DEFAULT:    'elite-esports-default',
  MATCH:      'elite-esports-match',
  REWARD:     'elite-esports-reward',
  TOURNAMENT: 'elite-esports-tournament',
  ACCOUNT:    'elite-esports-account',
} as const;

export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const defs = [
    { id: CHANNELS.DEFAULT,    name: 'General',           importance: Notifications.AndroidImportance.HIGH, desc: 'General Elite eSports notifications' },
    { id: CHANNELS.MATCH,      name: 'Match Alerts',      importance: Notifications.AndroidImportance.HIGH, desc: 'Match start, end & score updates' },
    { id: CHANNELS.REWARD,     name: 'Rewards & Prizes',  importance: Notifications.AndroidImportance.HIGH, desc: 'Prize credits & wallet payouts' },
    { id: CHANNELS.TOURNAMENT, name: 'Tournaments',       importance: Notifications.AndroidImportance.HIGH, desc: 'New tournaments & registration deadlines' },
    { id: CHANNELS.ACCOUNT,    name: 'Account & Security',importance: Notifications.AndroidImportance.MAX,  desc: 'Wallet & security alerts' },
  ];
  for (const ch of defs) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name:                 ch.name,
      importance:           ch.importance,
      description:          ch.desc,
      vibrationPattern:     [0, 250, 250, 250],
      lightColor:           '#FE4C11',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights:         true,
      enableVibrate:        true,
      showBadge:            true,
    });
  }
}

// ── Permission helpers ────────────────────────────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ── DUID helper (mirrors NCMService, shared store) ────────────────────────────
async function getDUID(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(DUID_KEY);
    if (stored) return stored;
  } catch {
    // SecureStore may not be available in Expo Go
  }
  try {
    return await AsyncStorage.getItem(DUID_KEY);
  } catch {
    return null;
  }
}

// ── Raw FCM token from expo-notifications ─────────────────────────────────────
async function getRawFCMToken(): Promise<string | null> {
  try {
    const granted = await hasPermission();
    if (!granted) return null;
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return typeof tokenData.data === 'string' ? tokenData.data : null;
  } catch {
    return null; // Graceful fail on emulators / simulators
  }
}

// ── Persist token to Supabase ─────────────────────────────────────────────────
async function persistToken(user: User, token: string): Promise<void> {
  const displayName =
    user.user_metadata?.full_name  ||
    user.user_metadata?.name       ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0]       ||
    'Unknown';

  // 1. fcm_tokens table (legacy — for server-side FCM sending)
  await supabase.from('fcm_tokens').upsert(
    {
      user_id:      user.id,
      token,
      platform:     Platform.OS,
      email:        user.email ?? null,
      display_name: displayName,
      updated_at:   new Date().toISOString(),
    },
    { onConflict: 'token' },
  ).throwOnError();

  // 2. device_registrations table (NCM system)
  const duid = await getDUID();
  if (duid) {
    await supabase.from('device_registrations').upsert(
      {
        user_id:      user.id,
        duid,
        platform:     Platform.OS,
        os_version:   String(Platform.Version),
        push_token:   token,
        email:        user.email ?? null,
        display_name: displayName,
        updated_at:   new Date().toISOString(),
        is_active:    true,
      },
      { onConflict: 'duid' },
    ).throwOnError();
  }

  await AsyncStorage.setItem(FCM_TOKEN_CACHE_KEY, token);
}

// ── Register / refresh token for signed-in user ───────────────────────────────
export async function registerFCMToken(user: User): Promise<void> {
  try {
    const token = await getRawFCMToken();
    if (!token) return;

    const cached = await AsyncStorage.getItem(FCM_TOKEN_CACHE_KEY);
    if (cached === token) {
      // Token hasn't changed — check if it still exists in DB (e.g. after wipe)
      const { data } = await supabase
        .from('fcm_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('token', token)
        .maybeSingle();
      if (data) return; // Already in DB, nothing to do
    }

    await persistToken(user, token);
  } catch {
    // Non-critical — fail silently
  }
}

// ── Remove token on logout ────────────────────────────────────────────────────
export async function deregisterFCMToken(userId: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_CACHE_KEY);
    if (token) {
      await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);
    }

    // Mark device as inactive in device_registrations
    const duid = await getDUID();
    if (duid) {
      await supabase
        .from('device_registrations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('duid', duid);
    }

    await AsyncStorage.removeItem(FCM_TOKEN_CACHE_KEY);
  } catch {
    // Non-critical
  }
}

// ── Token refresh subscription ────────────────────────────────────────────────
let tokenRefreshSub: Notifications.Subscription | null = null;

/**
 * Start listening for FCM token rotation.
 * Call after the user is signed in. Returns a cleanup function.
 */
export function subscribeTokenRefresh(user: User): () => void {
  tokenRefreshSub?.remove();
  tokenRefreshSub = Notifications.addPushTokenListener(async (tokenData) => {
    try {
      const token = typeof tokenData.data === 'string' ? tokenData.data : null;
      if (!token) return;
      await persistToken(user, token);
    } catch {
      // Non-critical
    }
  });
  return () => {
    tokenRefreshSub?.remove();
    tokenRefreshSub = null;
  };
}

// ── Notification routing (tap → in-app screen) ────────────────────────────────
/**
 * Maps notification data payload to an app route.
 *
 * The NCM triggers embed `type` and optional `match_id` / `ncm_id` in data.
 * We read these and navigate accordingly.
 */
export function resolveNotificationRoute(
  data?: Record<string, unknown>,
): string | null {
  if (!data) return null;

  const type    = data.type    as string | undefined;
  const matchId = data.match_id as string | undefined;
  const ncmId   = data.ncm_id  as string | undefined;

  // Match-related
  if ((type === 'match_joined' || type === 'match_live') && matchId) {
    return `/match/${matchId}`;
  }
  if (type === 'match_result' && matchId) {
    return `/match/${matchId}`;
  }
  if (type === 'match_cancelled') {
    return '/my-matches';
  }

  // Wallet-related
  if (
    type === 'prize_credited'         ||
    type === 'deposit_approved'       ||
    type === 'deposit_rejected'       ||
    type === 'withdrawal_approved'    ||
    type === 'withdrawal_rejected'    ||
    type === 'deposit_pending'        ||
    type === 'withdrawal_pending'     ||
    type === 'referral_bonus'         ||
    type === 'ad_bonus'               ||
    type === 'refund'
  ) {
    return '/(tabs)/wallet';
  }

  // NCM in-app notification detail (generic)
  if (ncmId) {
    return `/notification/${ncmId}`;
  }

  // Fallback — notification centre
  return '/notifications';
}

/**
 * Navigate based on a notification response (tap from any app state).
 * Safe to call even if router isn't ready; retries after 300 ms.
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as
    Record<string, unknown> | undefined;
  const route = resolveNotificationRoute(data);
  if (!route) return;

  // Slight delay ensures the root navigator is mounted
  setTimeout(() => {
    try {
      router.push(route as Parameters<typeof router.push>[0]);
    } catch {
      // Navigator not ready yet — retry once
      setTimeout(() => {
        try { router.push(route as Parameters<typeof router.push>[0]); } catch { /* ignore */ }
      }, 800);
    }
  }, 300);
}

// ── Notification response listeners ──────────────────────────────────────────
let responseSub: Notifications.Subscription | null = null;

/**
 * Subscribe to notification tap events (foreground + background state).
 * Returns a cleanup function.
 */
export function subscribeNotificationResponses(): () => void {
  responseSub?.remove();
  responseSub = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );
  return () => {
    responseSub?.remove();
    responseSub = null;
  };
}

const LAST_HANDLED_NOTIF_KEY = 'elite_last_handled_notif_id';

/**
 * Handle the case where the user tapped a notification that cold-launched
 * the app (app was completely killed).
 *
 * getLastNotificationResponseAsync() persists across normal app restarts and
 * does NOT clear itself automatically — so we track the notification request
 * ID in AsyncStorage and skip it if it was already handled in a previous
 * session. This prevents the "always redirects to /notifications" bug.
 *
 * Call this once after the root navigator is ready.
 */
export async function handleColdStartNotification(): Promise<void> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return;

    const requestId = response.notification.request.identifier;

    // Skip if we already routed this notification in a previous session
    const lastHandled = await AsyncStorage.getItem(LAST_HANDLED_NOTIF_KEY);
    if (lastHandled === requestId) return;

    // Mark as handled before navigating (in case navigation throws)
    await AsyncStorage.setItem(LAST_HANDLED_NOTIF_KEY, requestId);
    handleNotificationResponse(response);
  } catch {
    // Non-critical
  }
}

// ── Full initialisation ───────────────────────────────────────────────────────
/**
 * Called once at app startup (before a user signs in).
 * Sets up channels + notification handler. Does NOT need a user.
 */
export async function initFCM(): Promise<void> {
  await setupAndroidChannels();
}

/**
 * Called after a user signs in. Registers the FCM token and starts
 * the token-refresh listener.
 * Returns a cleanup function to call on sign-out.
 */
export async function initFCMForUser(user: User): Promise<() => void> {
  await registerFCMToken(user);
  const unsubRefresh = subscribeTokenRefresh(user);
  return unsubRefresh;
}
