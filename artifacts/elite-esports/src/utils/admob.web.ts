/* Web stub — AdMob is a native-only SDK and does not run in a browser. */

export const mobileAds = () => ({
  initialize: async () => [],
});

export const AdEventType = {
  LOADED:   'loaded',
  ERROR:    'error',
  OPENED:   'opened',
  CLICKED:  'clicked',
  CLOSED:   'closed',
} as const;

export const RewardedAdEventType = {
  LOADED:        'rewarded_loaded',
  EARNED_REWARD: 'rewarded_earned_reward',
} as const;

const noopUnsubscribe = () => {};

const makeNoopAd = () => ({
  addAdEventListener: (_event: string, _cb: () => void) => noopUnsubscribe,
  load:  () => {},
  show:  async () => {},
});

export const InterstitialAd = {
  createForAdRequest: (_unitId: string, _opts?: object) => makeNoopAd(),
};

export const RewardedAd = {
  createForAdRequest: (_unitId: string, _opts?: object) => makeNoopAd(),
};
