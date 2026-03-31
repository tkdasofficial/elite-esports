import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VIBRATION_KEY = 'vibration_feedback';

let _enabled: boolean | null = null;

export async function loadHapticPreference(): Promise<void> {
  try {
    const val = await AsyncStorage.getItem(VIBRATION_KEY);
    _enabled = val === null ? true : val === 'true';
  } catch {
    _enabled = true;
  }
}

export function setHapticEnabled(enabled: boolean): void {
  _enabled = enabled;
  AsyncStorage.setItem(VIBRATION_KEY, String(enabled)).catch(() => {});
}

export function isHapticEnabled(): boolean {
  return _enabled !== false;
}

export function triggerHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
): void {
  if (_enabled !== false) {
    Haptics.impactAsync(style).catch(() => {});
  }
}
