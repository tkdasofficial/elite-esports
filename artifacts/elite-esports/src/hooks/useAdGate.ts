import { useCallback, useRef, useState } from 'react';
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { AdGateConfig } from '@/store/AdContext';
import { useAds } from '@/store/AdContext';

export interface AdGateOverlayState {
  visible:  boolean;
  duration: number;
  label:    string;
}

const FALLBACK_BYPASS = 15;

const EliteAdMob: {
  loadAd: (unitId: string, type: string) => void;
  showAd: () => void;
} | null = Platform.OS === 'android' ? (NativeModules.EliteAdMob ?? null) : null;

export function useAdGate() {
  const { adsEnabled } = useAds();

  const [overlay, setOverlay] = useState<AdGateOverlayState>({
    visible:  false,
    duration: FALLBACK_BYPASS,
    label:    '',
  });

  const pendingAction  = useRef<(() => void) | null>(null);
  const subscriptions  = useRef<ReturnType<typeof DeviceEventEmitter.addListener>[]>([]);
  const actionExecuted = useRef(false);

  const cleanupListeners = useCallback(() => {
    subscriptions.current.forEach(sub => sub.remove());
    subscriptions.current = [];
  }, []);

  const executeAction = useCallback(() => {
    if (actionExecuted.current) return;
    actionExecuted.current = true;
    cleanupListeners();
    setOverlay({ visible: false, duration: FALLBACK_BYPASS, label: '' });
    const fn = pendingAction.current;
    pendingAction.current = null;
    if (fn) fn();
  }, [cleanupListeners]);

  const dismiss = useCallback(() => {
    executeAction();
  }, [executeAction]);

  const gateAction = useCallback(
    (config: AdGateConfig, action: () => void, label = 'Loading Ad...') => {
      if (!adsEnabled || !config.enabled || !config.unitId || !EliteAdMob) {
        action();
        return;
      }

      actionExecuted.current = false;
      pendingAction.current  = action;
      cleanupListeners();

      const bypassSecs = config.duration > 0 ? config.duration : FALLBACK_BYPASS;
      setOverlay({ visible: true, duration: bypassSecs, label });

      const onLoaded = DeviceEventEmitter.addListener('EliteAdMob:loaded', () => {
        try { EliteAdMob.showAd(); } catch (_) { executeAction(); }
      });

      const onClosed = DeviceEventEmitter.addListener('EliteAdMob:closed', () => {
        executeAction();
      });

      const onRewarded = DeviceEventEmitter.addListener('EliteAdMob:rewarded', () => {
        // closed event will fire right after for rewarded, but we handle it there
      });

      const onFailed = DeviceEventEmitter.addListener('EliteAdMob:failed', () => {
        // Overlay remains so the bypass countdown can run.
        // User presses Continue after the countdown expires.
      });

      subscriptions.current = [onLoaded, onClosed, onRewarded, onFailed];

      try {
        EliteAdMob.loadAd(config.unitId, config.type);
      } catch (_) {
        executeAction();
      }
    },
    [adsEnabled, cleanupListeners, executeAction],
  );

  return { gateAction, overlay, dismiss };
}
