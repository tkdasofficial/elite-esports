import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface AppPermissions {
  notifications: PermissionStatus;
  location: PermissionStatus;
}

async function requestNotifications(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'undetermined';
  try {
    const { status: current } = await Notifications.getPermissionsAsync();
    if (current === 'granted') return 'granted';
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status as PermissionStatus;
  } catch {
    return 'undetermined';
  }
}

async function requestLocation(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') return 'undetermined';
  try {
    const { status: current } = await Location.getForegroundPermissionsAsync();
    if (current === 'granted') return 'granted';
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status as PermissionStatus;
  } catch {
    return 'undetermined';
  }
}

/**
 * Requests Notifications then Location permissions on app open.
 * Each request is independent — a denial of one does not block the other.
 * Safe to call multiple times; already-granted permissions are not re-prompted.
 */
export async function requestAppPermissions(): Promise<AppPermissions> {
  const notifications = await requestNotifications();
  const location = await requestLocation();
  return { notifications, location };
}
