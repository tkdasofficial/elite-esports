/**
 * useAdGate — generic hook that gates an action behind an ad.
 *
 * Usage:
 *   const { gateAction, overlayVisible, overlayConfig, dismiss } = useAdGate();
 *
 *   // In your button handler:
 *   gateAction(adConfig.join, () => doJoinMatch());
 *
 * Flow:
 *   1. Show AdLoadingOverlay with countdown.
 *   2. Attempt to load + show the ad.
 *   3. On ad complete OR on timeout (bypass) → run the action.
 *   4. If ad fails, user can tap "Continue" after countdown to proceed.
 */
import { useCallback, useRef, useState } from 'react';
import { AdGateConfig } from '@/store/AdContext';
import {
  showInterstitialAd,
  showRewardedAd,
  nativeAdsAvailable,
} from '@/services/AdMobService';

export interface AdGateOverlayState {
  visible:     boolean;
  duration:    number;
  label:       string;
}

export function useAdGate() {
  const [overlay, setOverlay] = useState<AdGateOverlayState>({
    visible:  false,
    duration: 5,
    label:    'Loading Ad...',
  });

  const callbackRef    = useRef<(() => void) | null>(null);
  const dismissedRef   = useRef(false);

  const dismiss = useCallback(() => {
    setOverlay(prev => ({ ...prev, visible: false }));
    dismissedRef.current = true;
    const cb = callbackRef.current;
    callbackRef.current = null;
    cb?.();
  }, []);

  /**
   * Gate an action behind an ad.
   *
   * @param config   — the gate's AdGateConfig (unit id, duration, type)
   * @param action   — callback to run after ad completes (or times out)
   * @param label    — text shown in the overlay (e.g. "Loading Reward Ad...")
   */
  const gateAction = useCallback(
    async (
      config: AdGateConfig,
      action: () => void,
      label = 'Loading Ad...',
    ) => {
      // If ads not enabled or no native support, run action immediately
      if (!config.enabled || !nativeAdsAvailable) {
        action();
        return;
      }

      callbackRef.current  = action;
      dismissedRef.current = false;

      // Show the overlay / countdown
      setOverlay({ visible: true, duration: config.duration, label });

      // Attempt to show the ad
      try {
        let result: string;
        if (config.type === 'rewarded') {
          result = await showRewardedAd(config.unitId);
        } else {
          result = await showInterstitialAd(config.unitId);
        }

        // Ad resolved (shown, rewarded, dismissed, or failed)
        if (!dismissedRef.current) {
          setOverlay(prev => ({ ...prev, visible: false }));
          dismissedRef.current = true;
          callbackRef.current = null;
          action();
        }
      } catch {
        // On unexpected error, let the overlay's timeout handle it
      }
    },
    [],
  );

  return { gateAction, overlay, dismiss };
}
