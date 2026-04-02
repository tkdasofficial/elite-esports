import { NativeModules, NativeEventEmitter } from 'react-native';

export const EliteAdMobNative = NativeModules.EliteAdMob as {
  loadAd: (unitId: string, type: 'interstitial' | 'rewarded' | 'app_open') => void;
  showAd: () => void;
};

export const admobEmitter = new NativeEventEmitter(NativeModules.EliteAdMob);

export const AD_EVENTS = {
  LOADED:   'EliteAdMob:loaded',
  CLOSED:   'EliteAdMob:closed',
  REWARDED: 'EliteAdMob:rewarded',
  FAILED:   'EliteAdMob:failed',
} as const;

export const AD_UNITS = {
  APP_OPEN:    'ca-app-pub-2219438935030744/4030020209',
  INTERSTITIAL:'ca-app-pub-2219438935030744/6236112228',
  REWARDED:    'ca-app-pub-2219438935030744/4867190230',
} as const;
