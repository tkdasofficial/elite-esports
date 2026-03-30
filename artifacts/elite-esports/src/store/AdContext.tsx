/**
 * AdContext — remote config sync + global recurring timer ad
 *
 * On mount, fetches from Supabase:
 *   • ad_settings   — global ads_enabled flag, default_cooldown
 *   • ad_units      — individual ad unit IDs
 *   • ad_triggers   — maps trigger names → ad units + cooldowns
 *
 * Provides:
 *   • adConfig       — per-gate config (unit ID + duration)
 *   • adsEnabled     — global kill-switch
 *   • isInLiveMatch  — true while user is in an ongoing match (suppresses timer ad)
 *   • setInLiveMatch — call from match screen
 *   • triggerTimerAd — manually fire a timer ad (called internally by the interval)
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';
import {
  IS_TESTING,
  TEST_UNIT_IDS,
  nativeAdsAvailable,
  preloadInterstitial,
  showInterstitialAd,
  resolveUnitId,
} from '@/services/AdMobService';

// ── Types ────────────────────────────────────────────────────────────────────
export interface AdGateConfig {
  unitId: string;
  duration: number;  // bypass-after seconds
  enabled: boolean;
  type: 'interstitial' | 'rewarded';
}

export interface AdConfig {
  join:     AdGateConfig;
  leave:    AdGateConfig;
  reward:   AdGateConfig;
  withdraw: AdGateConfig;
  timer:    AdGateConfig & { intervalSeconds: number };
}

const DEFAULT_CONFIG: AdConfig = {
  join:     { unitId: TEST_UNIT_IDS.INTERSTITIAL, duration: 5,  enabled: false, type: 'interstitial' },
  leave:    { unitId: TEST_UNIT_IDS.INTERSTITIAL, duration: 5,  enabled: false, type: 'interstitial' },
  reward:   { unitId: TEST_UNIT_IDS.REWARDED,     duration: 60, enabled: false, type: 'rewarded'     },
  withdraw: { unitId: TEST_UNIT_IDS.REWARDED,     duration: 10, enabled: false, type: 'rewarded'     },
  timer:    { unitId: TEST_UNIT_IDS.INTERSTITIAL, duration: 5,  enabled: false, type: 'interstitial', intervalSeconds: 120 },
};

interface AdContextValue {
  adConfig:       AdConfig;
  adsEnabled:     boolean;
  configLoaded:   boolean;
  isInLiveMatch:  boolean;
  setInLiveMatch: (v: boolean) => void;
  /** Imperative trigger for a timer ad — called internally; exposed for testing */
  triggerTimerAd: () => void;
}

const AdCtx = createContext<AdContextValue>({
  adConfig:       DEFAULT_CONFIG,
  adsEnabled:     false,
  configLoaded:   false,
  isInLiveMatch:  false,
  setInLiveMatch: () => {},
  triggerTimerAd: () => {},
});

export function useAds() {
  return useContext(AdCtx);
}

// ── Provider ─────────────────────────────────────────────────────────────────
interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  const [adConfig,      setAdConfig]      = useState<AdConfig>(DEFAULT_CONFIG);
  const [adsEnabled,    setAdsEnabled]    = useState(false);
  const [configLoaded,  setConfigLoaded]  = useState(false);
  const [isInLiveMatch, setInLiveMatch]   = useState(false);
  const timerRef                          = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef                       = useRef<AppStateStatus>(AppState.currentState);

  // ── Fetch remote ad config from Supabase ──────────────────────────────────
  const loadConfig = useCallback(async () => {
    try {
      const [settingsRes, unitsRes, triggersRes] = await Promise.all([
        supabase.from('ad_settings').select('*').limit(1).maybeSingle(),
        supabase.from('ad_units').select('*').eq('status', 'active'),
        supabase.from('ad_triggers').select('*').eq('enabled', true),
      ]);

      const settings  = settingsRes.data;
      const units     = unitsRes.data   ?? [];
      const triggers  = triggersRes.data ?? [];

      const globalEnabled = settings?.ads_enabled ?? false;
      const defaultCool   = settings?.default_cooldown ?? 60;
      setAdsEnabled(globalEnabled);

      // Helper: find trigger by name and its linked ad unit
      const getTrigger = (name: string) => {
        const trig = triggers.find(
          (t: any) => (t.trigger ?? t.trigger_type ?? '').toLowerCase().includes(name),
        );
        const unit = trig
          ? units.find((u: any) => u.id === trig.ad_unit_id)
          : null;
        return { trigger: trig, unit };
      };

      const buildGate = (
        name: string,
        defaultType: 'interstitial' | 'rewarded',
        defaultDuration: number,
        testId: string,
      ): AdGateConfig => {
        const { trigger, unit } = getTrigger(name);
        const rawId = unit?.ad_unit_id ?? unit?.unit_id ?? '';
        return {
          unitId:   resolveUnitId(rawId, defaultType),
          duration: trigger?.cooldown_seconds ?? defaultDuration,
          enabled:  globalEnabled && !!trigger,
          type:     defaultType,
        };
      };

      const join     = buildGate('join',     'interstitial', 5,   TEST_UNIT_IDS.INTERSTITIAL);
      const leave    = buildGate('leave',    'interstitial', 5,   TEST_UNIT_IDS.INTERSTITIAL);
      const reward   = buildGate('reward',   'rewarded',     60,  TEST_UNIT_IDS.REWARDED);
      const withdraw = buildGate('withdraw', 'rewarded',     10,  TEST_UNIT_IDS.REWARDED);
      const timerTrig = getTrigger('timer');
      const timerUnit = timerTrig.unit;
      const rawTimerId = timerUnit?.ad_unit_id ?? timerUnit?.unit_id ?? '';
      const timer: AdConfig['timer'] = {
        unitId:          resolveUnitId(rawTimerId, 'interstitial'),
        duration:        timerTrig.trigger?.cooldown_seconds ?? 5,
        enabled:         globalEnabled && !!timerTrig.trigger,
        type:            'interstitial',
        intervalSeconds: defaultCool,
      };

      const config: AdConfig = { join, leave, reward, withdraw, timer };
      setAdConfig(config);

      // Preload interstitials in background
      if (nativeAdsAvailable && globalEnabled) {
        preloadInterstitial(join.unitId);
        preloadInterstitial(leave.unitId);
        preloadInterstitial(timer.unitId);
      }
    } catch {}
    finally {
      setConfigLoaded(true);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  // ── Global recurring timer ad ─────────────────────────────────────────────
  const triggerTimerAd = useCallback(() => {
    if (!adsEnabled || !adConfig.timer.enabled || isInLiveMatch) return;
    if (!nativeAdsAvailable) return;
    showInterstitialAd(adConfig.timer.unitId).catch(() => {});
  }, [adsEnabled, adConfig.timer, isInLiveMatch]);

  // Start / restart interval whenever interval seconds or enabled state changes
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!adsEnabled || !adConfig.timer.enabled) return;

    const secs = Math.max(30, adConfig.timer.intervalSeconds);
    timerRef.current = setInterval(triggerTimerAd, secs * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [adsEnabled, adConfig.timer.enabled, adConfig.timer.intervalSeconds, triggerTimerAd]);

  // Pause timer when app is backgrounded, resume when foregrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (next === 'active' && prev !== 'active') {
        loadConfig(); // re-sync config when app comes back to foreground
      }
    });
    return () => sub.remove();
  }, [loadConfig]);

  const value = useMemo<AdContextValue>(() => ({
    adConfig,
    adsEnabled,
    configLoaded,
    isInLiveMatch,
    setInLiveMatch,
    triggerTimerAd,
  }), [adConfig, adsEnabled, configLoaded, isInLiveMatch, triggerTimerAd]);

  return <AdCtx.Provider value={value}>{children}</AdCtx.Provider>;
}
