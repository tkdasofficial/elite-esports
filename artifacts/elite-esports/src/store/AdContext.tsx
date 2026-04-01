/**
 * AdContext — Google AdMob integration for Elite eSports.
 *
 * Replace the test App ID / unit IDs with your real AdMob IDs before
 * publishing to the Play Store / App Store.
 *
 * Test IDs (safe to use during development):
 *   App ID (Android):   ca-app-pub-3940256099942544~3347511713
 *   Interstitial unit:  ca-app-pub-3940256099942544/1033173712
 *   Rewarded unit:      ca-app-pub-3940256099942544/5224354917
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Lazy-load the native module so the web bundle never breaks
// ---------------------------------------------------------------------------
let MobileAds: any        = null;
let InterstitialAd: any   = null;
let RewardedAd: any       = null;
let AdEventType: any      = {};
let RewardedAdEventType: any = {};

if (Platform.OS !== 'web') {
  try {
    const m           = require('react-native-google-mobile-ads');
    MobileAds         = m.default;
    InterstitialAd    = m.InterstitialAd;
    RewardedAd        = m.RewardedAd;
    AdEventType       = m.AdEventType;
    RewardedAdEventType = m.RewardedAdEventType;
  } catch (e) {
    console.warn('[AdContext] react-native-google-mobile-ads not available:', e);
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AdGateConfig {
  unitId:   string;
  duration: number;
  enabled:  boolean;
  type:     'interstitial' | 'rewarded';
}

export interface AdConfig {
  join:     AdGateConfig;
  leave:    AdGateConfig;
  reward:   AdGateConfig;
  withdraw: AdGateConfig;
  timer:    AdGateConfig & { intervalSeconds: number };
}

interface AdContextValue {
  adConfig:        AdConfig;
  adsEnabled:      boolean;
  sdkReady:        boolean;
  isInLiveMatch:   boolean;
  setInLiveMatch:  (v: boolean) => void;
  showInterstitial: (unitId: string, onDone?: () => void) => void;
  showRewarded:     (unitId: string, onReward?: (reward: any) => void, onDone?: () => void) => void;
  triggerTimerAd:  () => void;
}

// ---------------------------------------------------------------------------
// Test unit IDs — swap for real IDs in production
// ---------------------------------------------------------------------------
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID     = 'ca-app-pub-3940256099942544/5224354917';

const DISABLED_GATE: AdGateConfig = {
  unitId: '', duration: 0, enabled: false, type: 'interstitial',
};

const DEFAULT_CONFIG: AdConfig = {
  join:     { ...DISABLED_GATE, unitId: TEST_INTERSTITIAL_ID, enabled: true, duration: 5 },
  leave:    { ...DISABLED_GATE, unitId: TEST_INTERSTITIAL_ID, enabled: true, duration: 5 },
  reward:   { ...DISABLED_GATE, unitId: TEST_REWARDED_ID,     enabled: true, type: 'rewarded' },
  withdraw: { ...DISABLED_GATE, unitId: TEST_REWARDED_ID,     enabled: true, type: 'rewarded' },
  timer:    { ...DISABLED_GATE, intervalSeconds: 120 },
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AdCtx = createContext<AdContextValue>({
  adConfig:         DEFAULT_CONFIG,
  adsEnabled:       false,
  sdkReady:         false,
  isInLiveMatch:    false,
  setInLiveMatch:   () => {},
  showInterstitial: () => {},
  showRewarded:     () => {},
  triggerTimerAd:   () => {},
});

export function useAds() {
  return useContext(AdCtx);
}

// ---------------------------------------------------------------------------
// Helper — show an interstitial ad and call onDone when closed / on error
// ---------------------------------------------------------------------------
function _showInterstitial(unitId: string, onDone?: () => void) {
  if (!InterstitialAd || Platform.OS === 'web') {
    onDone?.();
    return;
  }
  try {
    const ad = InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    const cleanup = () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show().catch(() => { cleanup(); onDone?.(); });
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      cleanup();
      onDone?.();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      cleanup();
      onDone?.();
    });
    ad.load();
  } catch (e) {
    console.warn('[AdContext] showInterstitial error:', e);
    onDone?.();
  }
}

// ---------------------------------------------------------------------------
// Helper — show a rewarded ad
// ---------------------------------------------------------------------------
function _showRewarded(
  unitId:   string,
  onReward?: (reward: any) => void,
  onDone?:  () => void,
) {
  if (!RewardedAd || Platform.OS === 'web') {
    onDone?.();
    return;
  }
  try {
    const ad = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    const cleanup = () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
    };
    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      ad.show().catch(() => { cleanup(); onDone?.(); });
    });
    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
      onReward?.(reward);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      cleanup();
      onDone?.();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      cleanup();
      onDone?.();
    });
    ad.load();
  } catch (e) {
    console.warn('[AdContext] showRewarded error:', e);
    onDone?.();
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  const [sdkReady,     setSdkReady]     = useState(false);
  const [isInLiveMatch, setInLiveMatch] = useState(false);

  // Initialize the SDK once
  useEffect(() => {
    if (!MobileAds || Platform.OS === 'web') return;
    MobileAds()
      .initialize()
      .then(() => setSdkReady(true))
      .catch((e: any) => {
        console.warn('[AdContext] MobileAds.initialize() failed:', e);
        setSdkReady(false);
      });
  }, []);

  // Timer ad — show an interstitial on a repeating interval while in a live match
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const cfg = DEFAULT_CONFIG.timer;
    if (!isInLiveMatch || !cfg.enabled || !sdkReady) return;
    timerRef.current = setInterval(() => {
      _showInterstitial(cfg.unitId || TEST_INTERSTITIAL_ID);
    }, (cfg.intervalSeconds ?? 120) * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isInLiveMatch, sdkReady]);

  const showInterstitial = useCallback((unitId: string, onDone?: () => void) => {
    if (!sdkReady) { onDone?.(); return; }
    _showInterstitial(unitId, onDone);
  }, [sdkReady]);

  const showRewarded = useCallback((
    unitId: string,
    onReward?: (reward: any) => void,
    onDone?: () => void,
  ) => {
    if (!sdkReady) { onDone?.(); return; }
    _showRewarded(unitId, onReward, onDone);
  }, [sdkReady]);

  const triggerTimerAd = useCallback(() => {
    const cfg = DEFAULT_CONFIG.timer;
    if (!cfg.enabled || !sdkReady) return;
    _showInterstitial(cfg.unitId || TEST_INTERSTITIAL_ID);
  }, [sdkReady]);

  return (
    <AdCtx.Provider value={{
      adConfig:        DEFAULT_CONFIG,
      adsEnabled:      sdkReady,
      sdkReady,
      isInLiveMatch,
      setInLiveMatch,
      showInterstitial,
      showRewarded,
      triggerTimerAd,
    }}>
      {children}
    </AdCtx.Provider>
  );
}
