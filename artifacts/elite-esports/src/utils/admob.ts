import { EmitterSubscription } from 'react-native';

export const EliteAdMobNative: { loadAd: (unitId: string, type: string) => void; showAd: () => void } | null = null;

class NoOpEmitter {
  addListener(_event: string, _handler: (...args: unknown[]) => void): EmitterSubscription {
    return { remove: () => {} } as EmitterSubscription;
  }
}

export const admobEmitter: Pick<import('react-native').NativeEventEmitter, 'addListener'> = new NoOpEmitter();

export const AD_EVENTS = {
  LOADED:   'EliteAdMob:loaded',
  CLOSED:   'EliteAdMob:closed',
  REWARDED: 'EliteAdMob:rewarded',
  FAILED:   'EliteAdMob:failed',
} as const;

export const IS_ADMOB_AVAILABLE = false;
