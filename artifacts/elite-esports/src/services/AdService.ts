/**
 * AdService — Google AdMob utilities (Android only)
 *
 * Ad Unit IDs:
 *   Use TEST IDs during development — NEVER real IDs in dev builds or you risk account suspension.
 *   Replace TEST IDs with your real ad unit IDs before publishing to Play Store.
 *
 * App ID (already in AndroidManifest.xml):
 *   ca-app-pub-2219438935030744~5831569923
 */

import { Platform } from 'react-native';
import {
  MobileAds,
  AppOpenAd,
  InterstitialAd,
  RewardedAd,
  BannerAd,
  BannerAdSize,
  TestIds,
  AdEventType,
  RewardedAdEventType,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';

/* ─── Ad Unit IDs ──────────────────────────────────────────────────────────
 *
 * DEVELOPMENT  → use TestIds (hard-coded Google test IDs, safe to show)
 * PRODUCTION   → replace the strings below with your real Ad Unit IDs
 *                from AdMob Dashboard → Apps → Elite eSports → Ad Units
 *
 * ────────────────────────────────────────────────────────────────────────── */

const IS_DEV = __DEV__;

export const AD_UNITS = {
  BANNER:       IS_DEV ? TestIds.ADAPTIVE_BANNER       : 'ca-app-pub-2219438935030744/XXXXXXXXXX',
  INTERSTITIAL: IS_DEV ? TestIds.INTERSTITIAL           : 'ca-app-pub-2219438935030744/XXXXXXXXXX',
  REWARDED:     IS_DEV ? TestIds.REWARDED               : 'ca-app-pub-2219438935030744/XXXXXXXXXX',
  APP_OPEN:     IS_DEV ? TestIds.APP_OPEN               : 'ca-app-pub-2219438935030744/XXXXXXXXXX',
} as const;

/* ─── SDK Initialization ────────────────────────────────────────────────── */

let _initialized = false;

/**
 * Call once at app startup (already called via MobileAds.initialize in
 * MainApplication.kt on Android). This JS-side init sets content rating
 * and request config.
 */
export async function initializeAds(): Promise<void> {
  if (!IS_ANDROID || _initialized) return;

  await MobileAds().initialize();

  await MobileAds().setRequestConfiguration({
    maxAdContentRating:    MaxAdContentRating.PG,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent:      false,
  });

  _initialized = true;
}

const IS_ANDROID = Platform.OS === 'android';

/* ─── Interstitial ──────────────────────────────────────────────────────── */

/**
 * Load and show an interstitial ad.
 * Safe to call — silently no-ops on iOS or if load fails.
 *
 * @example
 *   showInterstitial(); // e.g. after a match ends
 */
export function showInterstitial(): void {
  if (!IS_ANDROID) return;

  const ad = InterstitialAd.createForAdRequest(AD_UNITS.INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: false,
  });

  const unsubscribeLoad = ad.addAdEventListener(AdEventType.LOADED, () => {
    ad.show();
    unsubscribeLoad();
  });

  const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
    unsubscribeError();
  });

  ad.load();
}

/* ─── Rewarded Ad ───────────────────────────────────────────────────────── */

/**
 * Load and show a rewarded ad.
 * Calls onRewarded(type, amount) when the user earns the reward.
 *
 * @example
 *   showRewarded((type, amount) => {
 *     console.log(`User earned ${amount} ${type}`);
 *   });
 */
export function showRewarded(
  onRewarded: (type: string, amount: number) => void,
): void {
  if (!IS_ANDROID) return;

  const ad = RewardedAd.createForAdRequest(AD_UNITS.REWARDED, {
    requestNonPersonalizedAdsOnly: false,
  });

  const unsubscribeLoad = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    ad.show();
    unsubscribeLoad();
  });

  ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    onRewarded(reward.type, reward.amount);
  });

  ad.addAdEventListener(AdEventType.ERROR, () => {});

  ad.load();
}

/* Re-export for convenience */
export { BannerAd, BannerAdSize, AD_UNITS as adUnits };
