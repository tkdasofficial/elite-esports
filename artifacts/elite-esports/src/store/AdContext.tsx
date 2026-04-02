import React, {
  createContext, useCallback, useContext, useEffect,
  useRef, useState, ReactNode,
} from 'react';
import { AppState, AppStateStatus, DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { supabase } from '@/services/supabase';

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

const DISABLED_GATE: AdGateConfig = {
  unitId: '', duration: 15, enabled: false, type: 'interstitial',
};

const DEFAULT_CONFIG: AdConfig = {
  join:     { ...DISABLED_GATE },
  leave:    { ...DISABLED_GATE },
  reward:   { ...DISABLED_GATE, type: 'rewarded' },
  withdraw: { ...DISABLED_GATE, type: 'rewarded' },
  timer:    { ...DISABLED_GATE, intervalSeconds: 120 },
};

interface AdContextValue {
  adConfig:           AdConfig;
  adsEnabled:         boolean;
  configLoaded:       boolean;
  isInLiveMatch:      boolean;
  actionAdInProgress: boolean;
  setInLiveMatch:     (v: boolean) => void;
  setActionAdActive:  (v: boolean) => void;
  triggerTimerAd:     () => void;
}

const AdCtx = createContext<AdContextValue>({
  adConfig:           DEFAULT_CONFIG,
  adsEnabled:         false,
  configLoaded:       false,
  isInLiveMatch:      false,
  actionAdInProgress: false,
  setInLiveMatch:     () => {},
  setActionAdActive:  () => {},
  triggerTimerAd:     () => {},
});

export function useAds() {
  return useContext(AdCtx);
}

interface RawAdUnit {
  type:        string;
  unit_id?:    string;
  ad_unit_id?: string;
  enabled?:    boolean;
  status?:     string;
}

interface RawTrigger {
  trigger_type?:    string;
  trigger?:         string;
  enabled:          boolean;
  cooldown_seconds: number;
  ad_units:         RawAdUnit | RawAdUnit[] | null;
}

function resolveUnitId(unit: RawAdUnit): string {
  return (unit.unit_id ?? unit.ad_unit_id ?? '').trim();
}

function isUnitActive(unit: RawAdUnit): boolean {
  if (typeof unit.enabled === 'boolean') return unit.enabled;
  if (unit.status) return unit.status === 'active';
  return true;
}

function resolveTriggerType(trigger: RawTrigger): string {
  return (trigger.trigger_type ?? trigger.trigger ?? '').trim();
}

function buildConfig(triggers: RawTrigger[], defaultCooldown: number): AdConfig {
  const config: AdConfig = { ...DEFAULT_CONFIG };

  for (const trigger of triggers) {
    if (!trigger.enabled) continue;

    const raw = Array.isArray(trigger.ad_units)
      ? trigger.ad_units[0]
      : trigger.ad_units;

    if (!raw || !isUnitActive(raw)) continue;

    const unitId = resolveUnitId(raw);
    if (!unitId) continue;

    const adType   = raw.type === 'rewarded' ? 'rewarded' : 'interstitial';
    const duration = trigger.cooldown_seconds > 0
      ? trigger.cooldown_seconds
      : defaultCooldown;

    const gate: AdGateConfig = { unitId, duration, enabled: true, type: adType };

    switch (resolveTriggerType(trigger)) {
      case 'join_match':   config.join     = gate; break;
      case 'leave_match':  config.leave    = gate; break;
      case 'reward_claim': config.reward   = gate; break;
      case 'withdraw':     config.withdraw = gate; break;
      case 'timer':
      case 'app_open': {
        const intervalSeconds = trigger.cooldown_seconds > 0
          ? trigger.cooldown_seconds
          : 120;
        config.timer = { ...gate, intervalSeconds };
        break;
      }
    }
  }

  return config;
}

const EliteAdMob: {
  loadAd: (unitId: string, type: string) => void;
  showAd: () => void;
} | null = Platform.OS === 'android' ? (NativeModules.EliteAdMob ?? null) : null;

interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  const [adConfig,           setAdConfig]           = useState<AdConfig>(DEFAULT_CONFIG);
  const [adsEnabled,         setAdsEnabled]         = useState(false);
  const [configLoaded,       setConfigLoaded]       = useState(false);
  const [isInLiveMatch,      setIsInLiveMatch]      = useState(false);
  const [actionAdInProgress, setActionAdInProgress] = useState(false);

  // Refs so callbacks always see fresh values without re-subscribing
  const adConfigRef         = useRef<AdConfig>(DEFAULT_CONFIG);
  const adsEnabledRef       = useRef(false);
  const isInMatchRef        = useRef(false);
  const actionAdActiveRef   = useRef(false);
  const timerAdFiringRef    = useRef(false);   // true only while a TIMER ad is loading/showing
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef         = useRef<AppStateStatus>(AppState.currentState);
  const foregroundElapsed   = useRef(0);
  const lastTickRef         = useRef<number>(Date.now());

  useEffect(() => { adConfigRef.current     = adConfig;    }, [adConfig]);
  useEffect(() => { adsEnabledRef.current   = adsEnabled;  }, [adsEnabled]);
  useEffect(() => { isInMatchRef.current    = isInLiveMatch; }, [isInLiveMatch]);
  useEffect(() => { actionAdActiveRef.current = actionAdInProgress; }, [actionAdInProgress]);

  // ── Expose setter for useAdGate so it can block timer ads ──────────────────
  const setActionAdActive = useCallback((v: boolean) => {
    actionAdActiveRef.current = v;
    setActionAdInProgress(v);
  }, []);

  // ── Timer loop helpers ──────────────────────────────────────────────────────
  const stopTimerLoop = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNextTimerAd = useCallback((afterMs?: number) => {
    stopTimerLoop();
    const cfg = adConfigRef.current.timer;
    if (!cfg.enabled || !cfg.unitId || !adsEnabledRef.current || !EliteAdMob) return;

    const delay = afterMs !== undefined
      ? afterMs
      : (cfg.intervalSeconds > 0 ? cfg.intervalSeconds : 120) * 1000;

    foregroundElapsed.current = 0;
    lastTickRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      fireTimerAd();
    }, delay);
  }, [stopTimerLoop]); // eslint-disable-line react-hooks/exhaustive-deps

  const fireTimerAd = useCallback(() => {
    if (!EliteAdMob) return;
    if (timerAdFiringRef.current) return;    // already firing
    if (actionAdActiveRef.current) return;   // action ad in progress
    if (isInMatchRef.current) return;        // inside a live match
    if (!adsEnabledRef.current) return;

    const cfg = adConfigRef.current.timer;
    if (!cfg.enabled || !cfg.unitId) return;

    timerAdFiringRef.current = true;
    try {
      EliteAdMob.loadAd(cfg.unitId, cfg.type);
    } catch (_) {
      timerAdFiringRef.current = false;
      scheduleNextTimerAd();
    }
  }, [scheduleNextTimerAd]);

  // ── Listen to native ad events for TIMER ads only ─────────────────────────
  useEffect(() => {
    const onLoaded = DeviceEventEmitter.addListener('EliteAdMob:loaded', () => {
      if (!timerAdFiringRef.current) return; // this was an action ad — ignore
      try {
        EliteAdMob?.showAd();
      } catch (_) {
        timerAdFiringRef.current = false;
        scheduleNextTimerAd();
      }
    });

    const onClosed = DeviceEventEmitter.addListener('EliteAdMob:closed', () => {
      if (!timerAdFiringRef.current) return;
      timerAdFiringRef.current = false;
      scheduleNextTimerAd();
    });

    const onFailed = DeviceEventEmitter.addListener('EliteAdMob:failed', () => {
      if (!timerAdFiringRef.current) return;
      timerAdFiringRef.current = false;
      scheduleNextTimerAd();
    });

    const onRewarded = DeviceEventEmitter.addListener('EliteAdMob:rewarded', () => {
      // rewarded timer ads: onClosed fires after this — handled there
    });

    return () => {
      onLoaded.remove();
      onClosed.remove();
      onFailed.remove();
      onRewarded.remove();
    };
  }, [scheduleNextTimerAd]);

  // Restart timer whenever config/enabled changes
  useEffect(() => {
    if (configLoaded) {
      scheduleNextTimerAd();
    }
    return () => stopTimerLoop();
  }, [adConfig, adsEnabled, configLoaded, scheduleNextTimerAd, stopTimerLoop]);

  // Pause timer when app goes to background; resume with remaining time
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev === 'active' && nextState !== 'active') {
        foregroundElapsed.current += Date.now() - lastTickRef.current;
        stopTimerLoop();
      } else if (prev !== 'active' && nextState === 'active') {
        lastTickRef.current = Date.now();
        const cfg       = adConfigRef.current.timer;
        const totalMs   = (cfg.intervalSeconds > 0 ? cfg.intervalSeconds : 120) * 1000;
        const remaining = totalMs - foregroundElapsed.current;

        if (remaining <= 0) {
          fireTimerAd();
        } else {
          scheduleNextTimerAd(remaining);
        }
      }
    });
    return () => subscription.remove();
  }, [stopTimerLoop, fireTimerAd, scheduleNextTimerAd]);

  // ── Manual trigger (for external callers) ──────────────────────────────────
  const triggerTimerAd = useCallback(() => { fireTimerAd(); }, [fireTimerAd]);

  // ── Supabase data fetch + realtime ─────────────────────────────────────────
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data: settings } = await supabase
          .from('ad_settings')
          .select('ads_enabled, default_cooldown')
          .limit(1)
          .maybeSingle();

        if (!active) return;

        if (!settings?.ads_enabled) {
          setAdsEnabled(false);
          setConfigLoaded(true);
          return;
        }

        const defaultCooldown: number = settings.default_cooldown ?? 15;

        const { data: triggers } = await supabase
          .from('ad_triggers')
          .select(`
            trigger_type,
            trigger,
            enabled,
            cooldown_seconds,
            ad_units (
              type,
              unit_id,
              ad_unit_id,
              enabled,
              status
            )
          `)
          .eq('enabled', true);

        if (!active) return;

        const builtConfig = buildConfig(
          (triggers as RawTrigger[]) ?? [],
          defaultCooldown,
        );

        setAdConfig(builtConfig);
        setAdsEnabled(true);
      } catch (_err) {
        // silently degrade — ads stay disabled
      } finally {
        if (active) setConfigLoaded(true);
      }
    }

    load();

    const settingsChannel = supabase
      .channel('ad_settings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_settings' },
        () => { load(); })
      .subscribe();

    const triggersChannel = supabase
      .channel('ad_triggers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_triggers' },
        () => { load(); })
      .subscribe();

    const unitsChannel = supabase
      .channel('ad_units_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_units' },
        () => { load(); })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(triggersChannel);
      supabase.removeChannel(unitsChannel);
    };
  }, []);

  const setInLiveMatch = useCallback((v: boolean) => setIsInLiveMatch(v), []);

  return (
    <AdCtx.Provider value={{
      adConfig,
      adsEnabled,
      configLoaded,
      isInLiveMatch,
      actionAdInProgress,
      setInLiveMatch,
      setActionAdActive,
      triggerTimerAd,
    }}>
      {children}
    </AdCtx.Provider>
  );
}
