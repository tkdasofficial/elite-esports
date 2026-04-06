import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform, Linking } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface AppPermissions {
  notifications: PermissionStatus;
  location: PermissionStatus;
  backgroundFetch: 'available' | 'denied' | 'restricted' | 'unknown';
}

async function requestNotifications(): Promise<PermissionStatus> {
  try {
    const { status: current } = await Notifications.getPermissionsAsync();
    if (current === 'granted') return 'granted';
    const { status } = await Notifications.requestPermissionsAsync();
    return status as PermissionStatus;
  } catch {
    return 'undetermined';
  }
}

async function requestLocation(): Promise<PermissionStatus> {
  try {
    const { status: current } = await Location.getForegroundPermissionsAsync();
    if (current === 'granted') return 'granted';
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status as PermissionStatus;
  } catch {
    return 'undetermined';
  }
}

async function requestBackgroundFetch(): Promise<'available' | 'denied' | 'restricted' | 'unknown'> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return 'available';
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return 'denied';
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return 'restricted';
      default:
        return 'unknown';
    }
  } catch {
    return 'unknown';
  }
}

/**
 * Opens the device's battery optimization settings so the user can
 * exempt this app from power restrictions (Android only).
 */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Linking.openSettings();
  } catch {
  }
}

/**
 * Requests all app permissions in order:
 *  1. Notifications
 *  2. Location (foreground)
 *  3. Background Fetch availability check
 *
 * Each request is independent — denial of one does not block the others.
 * Safe to call multiple times; already-granted permissions are not re-prompted.
 */
export async function requestAppPermissions(): Promise<AppPermissions> {
  const notifications = await requestNotifications();
  const location = await requestLocation();
  const backgroundFetch = await requestBackgroundFetch();
  return { notifications, location, backgroundFetch };
}
