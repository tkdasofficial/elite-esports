import React, {
  createContext, useContext, useEffect, useRef, useState, ReactNode,
} from 'react';
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
  adConfig:       AdConfig;
  adsEnabled:     boolean;
  configLoaded:   boolean;
  isInLiveMatch:  boolean;
  setInLiveMatch: (v: boolean) => void;
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

    const adType = raw.type === 'rewarded' ? 'rewarded' : 'interstitial';
    const duration = trigger.cooldown_seconds > 0
      ? trigger.cooldown_seconds
      : defaultCooldown;

    const gate: AdGateConfig = {
      unitId,
      duration,
      enabled: true,
      type: adType,
    };

    switch (resolveTriggerType(trigger)) {
      case 'join_match':
        config.join = gate;
        break;
      case 'leave_match':
        config.leave = gate;
        break;
      case 'reward_claim':
        config.reward = gate;
        break;
      case 'withdraw':
        config.withdraw = gate;
        break;
      case 'timer':
      case 'app_open':
        config.timer = {
          ...gate,
          intervalSeconds: trigger.cooldown_seconds > 0
            ? trigger.cooldown_seconds
            : 120,
        };
        break;
    }
  }

  return config;
}

interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  const [adConfig,      setAdConfig]      = useState<AdConfig>(DEFAULT_CONFIG);
  const [adsEnabled,    setAdsEnabled]    = useState(false);
  const [configLoaded,  setConfigLoaded]  = useState(false);
  const [isInLiveMatch, setIsInLiveMatch] = useState(false);
  const timerAdRef = useRef<(() => void) | null>(null);

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ad_settings' },
        () => { load(); },
      )
      .subscribe();

    const triggersChannel = supabase
      .channel('ad_triggers_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ad_triggers' },
        () => { load(); },
      )
      .subscribe();

    const unitsChannel = supabase
      .channel('ad_units_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ad_units' },
        () => { load(); },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(triggersChannel);
      supabase.removeChannel(unitsChannel);
    };
  }, []);

  const setInLiveMatch = (v: boolean) => setIsInLiveMatch(v);

  const triggerTimerAd = () => {
    if (timerAdRef.current) timerAdRef.current();
  };

  return (
    <AdCtx.Provider value={{
      adConfig,
      adsEnabled,
      configLoaded,
      isInLiveMatch,
      setInLiveMatch,
      triggerTimerAd,
    }}>
      {children}
    </AdCtx.Provider>
  );
}
