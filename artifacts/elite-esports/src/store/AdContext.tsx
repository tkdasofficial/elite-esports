import React, {
  createContext, useCallback, useContext, useEffect,
  useRef, useState, ReactNode,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import {
  mobileAds,
  InterstitialAd,
  AdEventType,
} from '@/utils/admob';

/* ─── Public types ─────────────────────────────────────────────────────── */

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

export function useAds() { return useContext(AdCtx); }

/* ─── Supabase config types ────────────────────────────────────────────── */

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

function resolveUnitId(u: RawAdUnit)   { return (u.unit_id ?? u.ad_unit_id ?? '').trim(); }
function isUnitActive(u: RawAdUnit)    { return typeof u.enabled === 'boolean' ? u.enabled : (u.status ? u.status === 'active' : true); }
function resolveTriggerType(t: RawTrigger) { return (t.trigger_type ?? t.trigger ?? '').trim(); }

function buildConfig(triggers: RawTrigger[], defaultCooldown: number): AdConfig {
  const cfg: AdConfig = { ...DEFAULT_CONFIG };
  for (const trigger of triggers) {
    if (!trigger.enabled) continue;
    const raw = Array.isArray(trigger.ad_units) ? trigger.ad_units[0] : trigger.ad_units;
    if (!raw || !isUnitActive(raw)) continue;
    const unitId = resolveUnitId(raw);
    if (!unitId) continue;
    const adType   = raw.type === 'rewarded' ? 'rewarded' : 'interstitial';
    const duration = trigger.cooldown_seconds > 0 ? trigger.cooldown_seconds : defaultCooldown;
    const gate: AdGateConfig = { unitId, duration, enabled: true, type: adType };
    switch (resolveTriggerType(trigger)) {
      case 'join_match':   cfg.join     = gate; break;
      case 'leave_match':  cfg.leave    = gate; break;
      case 'reward_claim': cfg.reward   = gate; break;
      case 'withdraw':     cfg.withdraw = gate; break;
      case 'timer':
      case 'app_open': {
        const intervalSeconds = trigger.cooldown_seconds > 0 ? trigger.cooldown_seconds : 120;
        cfg.timer = { ...gate, intervalSeconds };
        break;
      }
    }
  }
  return cfg;
}

/* ─── Provider ─────────────────────────────────────────────────────────── */

interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  const [adConfig,           setAdConfig]           = useState<AdConfig>(DEFAULT_CONFIG);
  const [adsEnabled,         setAdsEnabled]         = useState(false);
  const [configLoaded,       setConfigLoaded]       = useState(false);
  const [isInLiveMatch,      setIsInLiveMatch]      = useState(false);
  const [actionAdInProgress, setActionAdInProgress] = useState(false);

  const adConfigRef       = useRef<AdConfig>(DEFAULT_CONFIG);
  const adsEnabledRef     = useRef(false);
  const isInMatchRef      = useRef(false);
  const actionAdActiveRef = useRef(false);

  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerFiringRef    = useRef(false);
  const appStateRef       = useRef<AppStateStatus>(AppState.currentState);
  const foregroundElapsed = useRef(0);
  const lastTickRef       = useRef<number>(Date.now());

  useEffect(() => { adConfigRef.current     = adConfig;       }, [adConfig]);
  useEffect(() => { adsEnabledRef.current   = adsEnabled;     }, [adsEnabled]);
  useEffect(() => { isInMatchRef.current    = isInLiveMatch;  }, [isInLiveMatch]);
  useEffect(() => { actionAdActiveRef.current = actionAdInProgress; }, [actionAdInProgress]);

  const setActionAdActive = useCallback((v: boolean) => {
    actionAdActiveRef.current = v;
    setActionAdInProgress(v);
  }, []);

  const setInLiveMatch = useCallback((v: boolean) => setIsInLiveMatch(v), []);

  /* ─── SDK init ──────────────────────────────────────────────────────── */
  useEffect(() => {
    // Only initialise on native platforms — AdMob doesn't run in Expo web/Go tunnel
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      mobileAds()
        .initialize()
        .catch(() => { /* silently degrade */ });
    }
  }, []);

  /* ─── Timer ad logic ────────────────────────────────────────────────── */
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const fireTimerAd = useCallback(() => {
    if (timerFiringRef.current)    return;
    if (actionAdActiveRef.current) return;
    if (isInMatchRef.current)      return;
    if (!adsEnabledRef.current)    return;
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

    const cfg = adConfigRef.current.timer;
    if (!cfg.enabled || !cfg.unitId) return;

    timerFiringRef.current = true;

    // Always use interstitial for timer ads (rewarded needs user intent)
    const ad = InterstitialAd.createForAdRequest(cfg.unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const onLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      onLoaded();
      ad.show().catch(() => { timerFiringRef.current = false; scheduleNext(); });
    });
    const onClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      onClosed();
      timerFiringRef.current = false;
      scheduleNext();
    });
    const onError = ad.addAdEventListener(AdEventType.ERROR, () => {
      onError();
      timerFiringRef.current = false;
      scheduleNext();
    });

    ad.load();

    function scheduleNext() {
      const delay = (cfg.intervalSeconds > 0 ? cfg.intervalSeconds : 120) * 1000;
      foregroundElapsed.current = 0;
      lastTickRef.current = Date.now();
      timerRef.current = setTimeout(() => fireTimerAd(), delay);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleNextTimerAd = useCallback((afterMs?: number) => {
    stopTimer();
    const cfg = adConfigRef.current.timer;
    if (!cfg.enabled || !cfg.unitId || !adsEnabledRef.current) return;
    const delay = afterMs !== undefined
      ? afterMs
      : (cfg.intervalSeconds > 0 ? cfg.intervalSeconds : 120) * 1000;
    foregroundElapsed.current = 0;
    lastTickRef.current = Date.now();
    timerRef.current = setTimeout(() => fireTimerAd(), delay);
  }, [stopTimer, fireTimerAd]);

  const triggerTimerAd = useCallback(() => { fireTimerAd(); }, [fireTimerAd]);

  // Start / restart timer whenever config or enabled flag changes
  useEffect(() => {
    if (configLoaded) scheduleNextTimerAd();
    return () => stopTimer();
  }, [adConfig, adsEnabled, configLoaded, scheduleNextTimerAd, stopTimer]);

  // Pause/resume timer when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev === 'active' && next !== 'active') {
        foregroundElapsed.current += Date.now() - lastTickRef.current;
        stopTimer();
      } else if (prev !== 'active' && next === 'active') {
        lastTickRef.current = Date.now();
        const cfg     = adConfigRef.current.timer;
        const totalMs = (cfg.intervalSeconds > 0 ? cfg.intervalSeconds : 120) * 1000;
        const remaining = totalMs - foregroundElapsed.current;
        if (remaining <= 0) { fireTimerAd(); } else { scheduleNextTimerAd(remaining); }
      }
    });
    return () => sub.remove();
  }, [stopTimer, fireTimerAd, scheduleNextTimerAd]);

  /* ─── Supabase config fetch + realtime ──────────────────────────────── */
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
          .select('*, ad_units(*)')
          .eq('enabled', true);

        if (!active) return;

        const builtConfig = buildConfig((triggers as RawTrigger[]) ?? [], defaultCooldown);
        setAdConfig(builtConfig);
        setAdsEnabled(true);
      } catch {
        // silently degrade — ads stay disabled
      } finally {
        if (active) setConfigLoaded(true);
      }
    }

    load();

    const ch1 = supabase.channel('ad_settings_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_settings' }, load)
      .subscribe();
    const ch2 = supabase.channel('ad_triggers_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_triggers' }, load)
      .subscribe();
    const ch3 = supabase.channel('ad_units_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_units' }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
    };
  }, []);

  return (
    <AdCtx.Provider value={{
      adConfig, adsEnabled, configLoaded,
      isInLiveMatch, actionAdInProgress,
      setInLiveMatch, setActionAdActive, triggerTimerAd,
    }}>
      {children}
    </AdCtx.Provider>
  );
}
