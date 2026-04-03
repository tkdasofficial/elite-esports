import React, {
  createContext, useCallback, useContext, useEffect,
  useRef, useState, ReactNode,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { EliteAdMobNative, admobEmitter, AD_EVENTS, IS_ADMOB_AVAILABLE } from '@/utils/admob';
import { useAdConfig, AdConfig } from '@/hooks/useAdConfig';

const IS_NATIVE = Platform.OS === 'android' || Platform.OS === 'ios';
const CAN_SHOW_ADS = IS_NATIVE && IS_ADMOB_AVAILABLE;

interface AdContextValue {
  showInterstitial: (onDone: () => void, trigger?: 'join_match' | 'leave_match') => void;
  showRewarded:     (onRewarded: () => void, onDone: () => void) => void;
  adBusy:           boolean;
}

const AdCtx = createContext<AdContextValue>({
  showInterstitial: (onDone) => onDone(),
  showRewarded:     (_onRewarded, onDone) => onDone(),
  adBusy:           false,
});

export function useAds() { return useContext(AdCtx); }

interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  const adConfig  = useAdConfig();
  const configRef = useRef<AdConfig>(adConfig);

  // Keep configRef always up-to-date so callbacks never capture stale values
  useEffect(() => { configRef.current = adConfig; }, [adConfig]);

  const [adBusy, setAdBusy] = useState(false);

  const lastAppOpenShownAt = useRef<number>(0);
  const appOpenLoadingRef  = useRef(false);
  const adBusyRef          = useRef(false);
  const appStateRef        = useRef<AppStateStatus>(AppState.currentState);

  const pendingCallbackRef = useRef<{
    type:       'interstitial' | 'rewarded' | 'app_open';
    onDone:     () => void;
    onRewarded: (() => void) | null;
  } | null>(null);

  const markBusy = (v: boolean) => { adBusyRef.current = v; setAdBusy(v); };

  // ── AdMob native event listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!CAN_SHOW_ADS) return;

    const subs = [
      admobEmitter.addListener(AD_EVENTS.LOADED, () => {
        EliteAdMobNative?.showAd();
        if (pendingCallbackRef.current?.type === 'app_open') {
          appOpenLoadingRef.current = false;
        }
      }),

      admobEmitter.addListener(AD_EVENTS.REWARDED, () => {
        pendingCallbackRef.current?.onRewarded?.();
      }),

      admobEmitter.addListener(AD_EVENTS.CLOSED, () => {
        const cb = pendingCallbackRef.current;
        if (cb?.type === 'app_open') {
          lastAppOpenShownAt.current = Date.now();
          pendingCallbackRef.current = null;
          markBusy(false);
          return;
        }
        const done = cb?.onDone;
        pendingCallbackRef.current = null;
        markBusy(false);
        done?.();
      }),

      admobEmitter.addListener(AD_EVENTS.FAILED, () => {
        const cb = pendingCallbackRef.current;
        if (cb?.type === 'app_open') {
          appOpenLoadingRef.current = false;
          pendingCallbackRef.current = null;
          markBusy(false);
          return;
        }
        const done = cb?.onDone;
        pendingCallbackRef.current = null;
        markBusy(false);
        done?.();
      }),
    ];

    return () => { subs.forEach(s => s.remove()); };
  }, []);

  // ── App-open ad ───────────────────────────────────────────────────────────
  const tryShowAppOpen = useCallback(() => {
    if (!CAN_SHOW_ADS) return;

    const cfg = configRef.current;
    if (!cfg.ready)                      return;
    if (!cfg.adsEnabled)                 return;

    const triggerCfg = cfg.triggers.app_open;
    if (!triggerCfg.enabled)             return;

    // Resolve unit ID: prefer trigger-specific assignment, fall back to type map
    const unitId = triggerCfg.unitId ?? cfg.unitIds.app_open;
    if (!unitId)                         return;

    if (adBusyRef.current)               return;
    if (appOpenLoadingRef.current)       return;

    const cooldownMs = triggerCfg.cooldownSeconds * 1000;
    const elapsed    = Date.now() - lastAppOpenShownAt.current;
    if (elapsed < cooldownMs && lastAppOpenShownAt.current > 0) return;

    appOpenLoadingRef.current  = true;
    pendingCallbackRef.current = { type: 'app_open', onDone: () => {}, onRewarded: null };
    markBusy(true);
    EliteAdMobNative?.loadAd(unitId, 'app_open');
  }, []);

  // Re-attempt app-open whenever config becomes ready (initial load) or
  // whenever the app returns to foreground
  useEffect(() => {
    if (!CAN_SHOW_ADS) return;
    if (!adConfig.ready) return;

    tryShowAppOpen();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev !== 'active' && next === 'active') {
        tryShowAppOpen();
      }
    });
    return () => sub.remove();
  }, [adConfig.ready, tryShowAppOpen]);

  // ── Interstitial ──────────────────────────────────────────────────────────
  const showInterstitial = useCallback(
    (onDone: () => void, trigger: 'join_match' | 'leave_match' = 'join_match') => {
      if (!CAN_SHOW_ADS) { onDone(); return; }

      const cfg = configRef.current;
      if (!cfg.ready || !cfg.adsEnabled) { onDone(); return; }

      const triggerCfg = cfg.triggers[trigger];
      if (!triggerCfg.enabled) { onDone(); return; }

      const unitId = triggerCfg.unitId ?? cfg.unitIds.interstitial;
      if (!unitId) { onDone(); return; }

      if (adBusyRef.current) { onDone(); return; }

      pendingCallbackRef.current = { type: 'interstitial', onDone, onRewarded: null };
      markBusy(true);
      EliteAdMobNative?.loadAd(unitId, 'interstitial');
    },
    [],
  );

  // ── Rewarded ──────────────────────────────────────────────────────────────
  const showRewarded = useCallback(
    (onRewarded: () => void, onDone: () => void) => {
      if (!CAN_SHOW_ADS) { onDone(); return; }

      const cfg = configRef.current;
      if (!cfg.ready || !cfg.adsEnabled) { onDone(); return; }

      const triggerCfg = cfg.triggers.reward_claim;
      if (!triggerCfg.enabled) { onDone(); return; }

      const unitId = triggerCfg.unitId ?? cfg.unitIds.rewarded;
      if (!unitId) { onDone(); return; }

      if (adBusyRef.current) { onDone(); return; }

      pendingCallbackRef.current = { type: 'rewarded', onDone, onRewarded };
      markBusy(true);
      EliteAdMobNative?.loadAd(unitId, 'rewarded');
    },
    [],
  );

  return (
    <AdCtx.Provider value={{ showInterstitial, showRewarded, adBusy }}>
      {children}
    </AdCtx.Provider>
  );
}
