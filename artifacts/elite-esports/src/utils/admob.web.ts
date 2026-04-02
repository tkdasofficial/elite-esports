export const EliteAdMobNative = {
  loadAd: (_unitId: string, _type: string) => {},
  showAd: () => {},
};

export const admobEmitter = {
  addListener: (_event: string, _cb: () => void) => ({ remove: () => {} }),
};

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
