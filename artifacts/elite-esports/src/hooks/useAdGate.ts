import { useCallback, useRef, useState } from 'react';
import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { AdGateConfig, useAds } from '@/store/AdContext';

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
  const { adsEnabled, setActionAdActive } = useAds();

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
    setActionAdActive(false);
    setOverlay({ visible: false, duration: FALLBACK_BYPASS, label: '' });
    const fn = pendingAction.current;
    pendingAction.current = null;
    if (fn) fn();
  }, [cleanupListeners, setActionAdActive]);

  const dismiss = useCallback(() => {
    executeAction();
  }, [executeAction]);

  const gateAction = useCallback(
    (config: AdGateConfig, action: () => void, label = 'Loading Ad...') => {
      // Skip ad entirely if disabled, no unit ID, or native module unavailable
      if (!adsEnabled || !config.enabled || !config.unitId || !EliteAdMob) {
        action();
        return;
      }

      actionExecuted.current = false;
      pendingAction.current  = action;
      cleanupListeners();

      // Signal to AdProvider: an action ad is starting — hold off timer ads
      setActionAdActive(true);

      const bypassSecs = config.duration > 0 ? config.duration : FALLBACK_BYPASS;
      setOverlay({ visible: true, duration: bypassSecs, label });

      // When native module signals ad is loaded → show it immediately
      const onLoaded = DeviceEventEmitter.addListener('EliteAdMob:loaded', () => {
        try { EliteAdMob.showAd(); } catch (_) { executeAction(); }
      });

      // Ad dismissed → run the originally gated action
      const onClosed = DeviceEventEmitter.addListener('EliteAdMob:closed', () => {
        executeAction();
      });

      // Rewarded ad finished earning — closed fires right after; handled there
      const onRewarded = DeviceEventEmitter.addListener('EliteAdMob:rewarded', () => {});

      // Ad failed to load — overlay stays so bypass countdown can run
      const onFailed = DeviceEventEmitter.addListener('EliteAdMob:failed', () => {
        // Do nothing: countdown timer in AdLoadingOverlay allows user to Continue
      });

      subscriptions.current = [onLoaded, onClosed, onRewarded, onFailed];

      try {
        EliteAdMob.loadAd(config.unitId, config.type);
      } catch (_) {
        executeAction();
      }
    },
    [adsEnabled, cleanupListeners, executeAction, setActionAdActive],
  );

  return { gateAction, overlay, dismiss };
}
