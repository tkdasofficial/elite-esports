import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

const _module = NativeModules.EliteAdMob as
  | { loadAd: (unitId: string, type: string) => void; showAd: () => void }
  | undefined
  | null;

export const EliteAdMobNative = _module ?? null;

const _IS_AVAILABLE = !!_module;

class NoOpEmitter {
  addListener(_event: string, _handler: (...args: unknown[]) => void): EmitterSubscription {
    return { remove: () => {} } as EmitterSubscription;
  }
}

export const admobEmitter: Pick<NativeEventEmitter, 'addListener'> = _IS_AVAILABLE
  ? new NativeEventEmitter(_module!)
  : new NoOpEmitter();

export const AD_EVENTS = {
  LOADED:   'EliteAdMob:loaded',
  CLOSED:   'EliteAdMob:closed',
  REWARDED: 'EliteAdMob:rewarded',
  FAILED:   'EliteAdMob:failed',
} as const;

export const AD_UNITS = {
  APP_OPEN:     process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_UNIT_ID     ?? 'ca-app-pub-2219438935030744/4030020209',
  INTERSTITIAL: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID ?? 'ca-app-pub-2219438935030744/6236112228',
  REWARDED:     process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID     ?? 'ca-app-pub-2219438935030744/4867190230',
} as const;

export const IS_ADMOB_AVAILABLE = _IS_AVAILABLE;
