/**
 * AdMobService — core ad loading & showing logic
 * Safe on web and Expo Go (no native modules available there).
 * Ads only fire on native Android / iOS EAS builds.
 */
import { Platform } from 'react-native';

// ── Test Unit IDs (Google official) ─────────────────────────────────────────
export const TEST_UNIT_IDS = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED:     'ca-app-pub-3940256099942544/5224354917',
  APP_OPEN:     'ca-app-pub-3940256099942544/3419835294',
} as const;

// ── App Unit IDs (production) ─────────────────────────────────────────────
export const APP_ID_ANDROID = 'ca-app-pub-2219438935030744~5831569923';

// Set EXPO_PUBLIC_AD_TESTING=false in production env to use real IDs
export const IS_TESTING =
  process.env.EXPO_PUBLIC_AD_TESTING !== 'false';

export const IS_NATIVE = Platform.OS !== 'web';

// ── Native module lazy-load (safe on Expo Go / web) ──────────────────────
let _MobileAds: any       = null;
let _Interstitial: any    = null;
let _Rewarded: any        = null;
let _AdEventType: any     = null;
let _RewardedEvent: any   = null;
export let nativeAdsAvailable = false;

if (IS_NATIVE) {
  try {
    const m = require('react-native-google-mobile-ads');
    _MobileAds       = m.default;
    _Interstitial    = m.InterstitialAd;
    _Rewarded        = m.RewardedAd;
    _AdEventType     = m.AdEventType;
    _RewardedEvent   = m.RewardedAdEventType;
    nativeAdsAvailable = true;
  } catch {
    nativeAdsAvailable = false;
  }
}

// ── SDK initialisation (called once at app root) ──────────────────────────
export async function initMobileAds(): Promise<void> {
  if (!nativeAdsAvailable || !_MobileAds) return;
  try {
    await _MobileAds().initialize();
  } catch {}
}

// ── Resolve unit ID: test vs. production ─────────────────────────────────
export function resolveUnitId(
  prodId: string,
  type: 'interstitial' | 'rewarded',
): string {
  if (IS_TESTING || !prodId) {
    return type === 'rewarded' ? TEST_UNIT_IDS.REWARDED : TEST_UNIT_IDS.INTERSTITIAL;
  }
  return prodId;
}

// ── Pre-loaded interstitial pool ─────────────────────────────────────────
const preloadedInterstitials: Record<string, any> = {};

export function preloadInterstitial(unitId: string): void {
  if (!nativeAdsAvailable || !_Interstitial) return;
  try {
    const ad = _Interstitial.createForAdRequest(unitId);
    ad.addAdEventListener(_AdEventType.LOADED, () => {
      preloadedInterstitials[unitId] = ad;
    });
    ad.addAdEventListener(_AdEventType.ERROR, () => {});
    ad.load();
  } catch {}
}

// ── Show Interstitial ────────────────────────────────────────────────────
export function showInterstitialAd(unitId: string): Promise<'shown' | 'failed'> {
  return new Promise((resolve) => {
    if (!nativeAdsAvailable || !_Interstitial || !_AdEventType) {
      resolve('failed');
      return;
    }
    try {
      const ad = preloadedInterstitials[unitId]
        ?? _Interstitial.createForAdRequest(unitId);

      delete preloadedInterstitials[unitId];

      const unsubs: (() => void)[] = [];
      const cleanup = () => unsubs.forEach(u => u());

      unsubs.push(
        ad.addAdEventListener(_AdEventType.LOADED, () => { ad.show(); }),
        ad.addAdEventListener(_AdEventType.CLOSED, () => {
          cleanup();
          preloadInterstitial(unitId); // reload for next time
          resolve('shown');
        }),
        ad.addAdEventListener(_AdEventType.ERROR, () => {
          cleanup();
          resolve('failed');
        }),
      );

      // If already loaded (preloaded), show immediately
      if (preloadedInterstitials[unitId]) {
        ad.show();
      } else {
        ad.load();
      }
    } catch {
      resolve('failed');
    }
  });
}

// ── Show Rewarded ─────────────────────────────────────────────────────────
export function showRewardedAd(
  unitId: string,
): Promise<'rewarded' | 'dismissed' | 'failed'> {
  return new Promise((resolve) => {
    if (!nativeAdsAvailable || !_Rewarded || !_RewardedEvent || !_AdEventType) {
      resolve('failed');
      return;
    }
    try {
      const ad = _Rewarded.createForAdRequest(unitId);
      let rewarded = false;

      const unsubs: (() => void)[] = [];
      const cleanup = () => unsubs.forEach(u => u());

      unsubs.push(
        ad.addAdEventListener(_RewardedEvent.LOADED,       () => { ad.show(); }),
        ad.addAdEventListener(_RewardedEvent.EARNED_REWARD, () => { rewarded = true; }),
        ad.addAdEventListener(_AdEventType.CLOSED,         () => {
          cleanup();
          resolve(rewarded ? 'rewarded' : 'dismissed');
        }),
        ad.addAdEventListener(_AdEventType.ERROR,          () => {
          cleanup();
          resolve('failed');
        }),
      );

      ad.load();
    } catch {
      resolve('failed');
    }
  });
}
