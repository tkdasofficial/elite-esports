import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from '@/utils/admob';
import { AdGateConfig, useAds } from '@/store/AdContext';

export interface AdGateOverlayState {
  visible:  boolean;
  duration: number;
  label:    string;
}

const HIDDEN: AdGateOverlayState = { visible: false, duration: 15, label: '' };
const IS_NATIVE = Platform.OS === 'android' || Platform.OS === 'ios';

export function useAdGate() {
  const { adsEnabled, setActionAdActive } = useAds();
  const [overlay, setOverlay] = useState<AdGateOverlayState>(HIDDEN);

  // Refs so event callbacks always see fresh values without re-subscribing
  const executed   = useRef(false);
  const cleanups   = useRef<Array<() => void>>([]);
  const onFinishRef = useRef<(() => void) | null>(null);

  const runCleanup = useCallback(() => {
    cleanups.current.forEach(fn => { try { fn(); } catch { /* ignore */ } });
    cleanups.current = [];
  }, []);

  /** Complete the ad gate — hide overlay, execute the gated action */
  const complete = useCallback(() => {
    if (executed.current) return;
    executed.current = true;
    runCleanup();
    setActionAdActive(false);
    setOverlay(HIDDEN);
    onFinishRef.current?.();
    onFinishRef.current = null;
  }, [runCleanup, setActionAdActive]);

  /** Called by the AdLoadingOverlay "Continue / Skip" button */
  const dismiss = useCallback(() => { complete(); }, [complete]);

  const gateAction = useCallback(
    (config: AdGateConfig, action: () => void, label = 'Loading Ad...') => {
      // Bypass if ads are off, no unit ID, or running in web/Expo-Go without native build
      if (!adsEnabled || !config.enabled || !config.unitId || !IS_NATIVE) {
        action();
        return;
      }

      executed.current   = false;
      onFinishRef.current = action;
      runCleanup();
      setActionAdActive(true);
      setOverlay({ visible: true, duration: config.duration > 0 ? config.duration : 15, label });

      if (config.type === 'rewarded') {
        /* ── Rewarded ──────────────────────────────────────────── */
        const ad = RewardedAd.createForAdRequest(config.unitId, {
          requestNonPersonalizedAdsOnly: true,
        });
        cleanups.current = [
          ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
            ad.show().catch(() => complete());
          }),
          ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            // reward earned; complete() fires after CLOSED
          }),
          ad.addAdEventListener(AdEventType.CLOSED as any, () => complete()),
          ad.addAdEventListener(AdEventType.ERROR  as any, () => {
            // leave overlay visible so countdown Skip button can fire
          }),
        ];
        ad.load();

      } else {
        /* ── Interstitial ──────────────────────────────────────── */
        const ad = InterstitialAd.createForAdRequest(config.unitId, {
          requestNonPersonalizedAdsOnly: true,
        });
        cleanups.current = [
          ad.addAdEventListener(AdEventType.LOADED, () => {
            ad.show().catch(() => complete());
          }),
          ad.addAdEventListener(AdEventType.CLOSED, () => complete()),
          ad.addAdEventListener(AdEventType.ERROR,  () => {
            // leave overlay visible so countdown Skip button can fire
          }),
        ];
        ad.load();
      }
    },
    [adsEnabled, runCleanup, complete, setActionAdActive],
  );

  return { gateAction, overlay, dismiss };
}
