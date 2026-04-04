import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'elite_device_id';
const PERMISSION_KEY = 'elite_fingerprint_granted';
const EVENT_LOG_KEY = 'elite_auth_events';
const MAX_EVENTS = 50;

export type AuthEventType =
  | 'sign_in'
  | 'sign_up'
  | 'sign_out'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'email_verify'
  | 'token_exchange'
  | 'deep_link_received'
  | 'callback_error';

export type AuthEvent = {
  type: AuthEventType;
  timestamp: string;
  deviceId: string;
  platform: string;
  osVersion: string | number;
  email?: string;
  meta?: string;
};

function generateId(): string {
  const hex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${hex()}-${hex()}${hex()}${hex()}`;
}

class DeviceFingerprintService {
  private static instance: DeviceFingerprintService | null = null;
  private deviceId: string | null = null;
  private initialized = false;
  private permissionGranted = false;

  static getInstance(): DeviceFingerprintService {
    if (!DeviceFingerprintService.instance) {
      DeviceFingerprintService.instance = new DeviceFingerprintService();
    }
    return DeviceFingerprintService.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const granted = await AsyncStorage.getItem(PERMISSION_KEY);
    if (granted === 'true') {
      this.permissionGranted = true;
      await this.loadOrCreateDeviceId();
      return;
    }

    if (granted === 'false') {
      return;
    }

    await this.requestPermission();
  }

  private async requestPermission(): Promise<void> {
    return new Promise(resolve => {
      Alert.alert(
        'Security Tracking',
        'Elite Esports would like to track authentication activity (sign-in, sign-up, password reset) on this device to protect your account. No personal data or location is collected.',
        [
          {
            text: 'Deny',
            style: 'cancel',
            onPress: async () => {
              await AsyncStorage.setItem(PERMISSION_KEY, 'false');
              resolve();
            },
          },
          {
            text: 'Allow',
            onPress: async () => {
              await AsyncStorage.setItem(PERMISSION_KEY, 'true');
              this.permissionGranted = true;
              await this.loadOrCreateDeviceId();
              resolve();
            },
          },
        ],
        { cancelable: false },
      );
    });
  }

  private async loadOrCreateDeviceId(): Promise<void> {
    try {
      const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (stored) {
        this.deviceId = stored;
        return;
      }
      const newId = generateId();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
      this.deviceId = newId;
    } catch {
      if (!this.deviceId) {
        try {
          const fallback = await AsyncStorage.getItem(DEVICE_ID_KEY);
          if (fallback) {
            this.deviceId = fallback;
          } else {
            const newId = generateId();
            await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
            this.deviceId = newId;
          }
        } catch {
          this.deviceId = generateId();
        }
      }
    }
  }

  getDeviceId(): string | null {
    return this.permissionGranted ? this.deviceId : null;
  }

  async logEvent(type: AuthEventType, email?: string, meta?: string): Promise<void> {
    if (!this.permissionGranted || !this.deviceId) return;

    const event: AuthEvent = {
      type,
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      platform: Platform.OS,
      osVersion: Platform.Version,
      ...(email ? { email } : {}),
      ...(meta ? { meta } : {}),
    };

    try {
      const raw = await AsyncStorage.getItem(EVENT_LOG_KEY);
      const events: AuthEvent[] = raw ? JSON.parse(raw) : [];
      events.unshift(event);
      if (events.length > MAX_EVENTS) events.splice(MAX_EVENTS);
      await AsyncStorage.setItem(EVENT_LOG_KEY, JSON.stringify(events));
    } catch {
    }
  }

  async getEventLog(): Promise<AuthEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(EVENT_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async clearEventLog(): Promise<void> {
    await AsyncStorage.removeItem(EVENT_LOG_KEY);
  }
}

export const deviceFingerprint = DeviceFingerprintService.getInstance();
