import React, {
  createContext, useCallback, useContext, useEffect,
  useRef, useState, ReactNode,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { EliteAdMobNative, admobEmitter, AD_EVENTS, AD_UNITS } from '@/utils/admob';

const IS_NATIVE = Platform.OS === 'android' || Platform.OS === 'ios';
const ONE_HOUR_MS = 60 * 60 * 1000;

interface AdContextValue {
  showInterstitial: (onDone: () => void) => void;
  showRewarded: (onRewarded: () => void, onDone: () => void) => void;
  adBusy: boolean;
}

const AdCtx = createContext<AdContextValue>({
  showInterstitial: (onDone) => onDone(),
  showRewarded:     (_onRewarded, onDone) => onDone(),
  adBusy:           false,
});

export function useAds() { return useContext(AdCtx); }

interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  const [adBusy, setAdBusy] = useState(false);

  const lastAppOpenShownAt  = useRef<number>(0);
  const appOpenLoadingRef   = useRef(false);
  const appOpenReadyRef     = useRef(false);
  const adBusyRef           = useRef(false);
  const appStateRef         = useRef<AppStateStatus>(AppState.currentState);

  const pendingCallbackRef  = useRef<{
    type: 'interstitial' | 'rewarded' | 'app_open';
    onDone:     () => void;
    onRewarded: (() => void) | null;
  } | null>(null);

  const markBusy  = (v: boolean) => { adBusyRef.current = v; setAdBusy(v); };

  useEffect(() => {
    if (!IS_NATIVE) return;

    const subs = [
      admobEmitter.addListener(AD_EVENTS.LOADED, () => {
        const cb = pendingCallbackRef.current;
        if (cb?.type === 'app_open') {
          appOpenReadyRef.current     = true;
          appOpenLoadingRef.current   = false;
          EliteAdMobNative.showAd();
          return;
        }
        EliteAdMobNative.showAd();
      }),

      admobEmitter.addListener(AD_EVENTS.REWARDED, () => {
        pendingCallbackRef.current?.onRewarded?.();
      }),

      admobEmitter.addListener(AD_EVENTS.CLOSED, () => {
        const cb = pendingCallbackRef.current;
        if (cb?.type === 'app_open') {
          appOpenReadyRef.current   = false;
          appOpenLoadingRef.current = false;
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
          appOpenReadyRef.current   = false;
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

  const tryShowAppOpen = useCallback(() => {
    if (!IS_NATIVE)                              return;
    if (adBusyRef.current)                       return;
    if (appOpenLoadingRef.current)               return;
    const elapsed = Date.now() - lastAppOpenShownAt.current;
    if (elapsed < ONE_HOUR_MS && lastAppOpenShownAt.current > 0) return;

    appOpenLoadingRef.current  = true;
    appOpenReadyRef.current    = false;
    pendingCallbackRef.current = { type: 'app_open', onDone: () => {}, onRewarded: null };
    markBusy(true);
    EliteAdMobNative.loadAd(AD_UNITS.APP_OPEN, 'app_open');
  }, []);

  useEffect(() => {
    if (!IS_NATIVE) return;
    tryShowAppOpen();
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev !== 'active' && next === 'active') {
        tryShowAppOpen();
      }
    });
    return () => sub.remove();
  }, [tryShowAppOpen]);

  const showInterstitial = useCallback((onDone: () => void) => {
    if (!IS_NATIVE) { onDone(); return; }
    if (adBusyRef.current) { onDone(); return; }
    pendingCallbackRef.current = { type: 'interstitial', onDone, onRewarded: null };
    markBusy(true);
    EliteAdMobNative.loadAd(AD_UNITS.INTERSTITIAL, 'interstitial');
  }, []);

  const showRewarded = useCallback((onRewarded: () => void, onDone: () => void) => {
    if (!IS_NATIVE) { onDone(); return; }
    if (adBusyRef.current) { onDone(); return; }
    pendingCallbackRef.current = { type: 'rewarded', onDone, onRewarded };
    markBusy(true);
    EliteAdMobNative.loadAd(AD_UNITS.REWARDED, 'rewarded');
  }, []);

  return (
    <AdCtx.Provider value={{ showInterstitial, showRewarded, adBusy }}>
      {children}
    </AdCtx.Provider>
  );
}
