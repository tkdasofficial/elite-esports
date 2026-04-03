import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TriggerConfig {
  enabled:         boolean;
  cooldownSeconds: number;
  unitId:          string | null;
}

export interface AdConfig {
  ready:           boolean;
  adsEnabled:      boolean;
  defaultCooldown: number;
  unitIds: {
    app_open:     string | null;
    interstitial: string | null;
    rewarded:     string | null;
  };
  triggers: {
    app_open:     TriggerConfig;
    join_match:   TriggerConfig;
    leave_match:  TriggerConfig;
    reward_claim: TriggerConfig;
  };
}

// ─── Defaults (safe fallback until backend responds) ─────────────────────────

const DEFAULT_TRIGGER: TriggerConfig = {
  enabled:         false,
  cooldownSeconds: 3600,
  unitId:          null,
};

const INITIAL: AdConfig = {
  ready:           false,
  adsEnabled:      false,
  defaultCooldown: 60,
  unitIds:         { app_open: null, interstitial: null, rewarded: null },
  triggers: {
    app_open:     DEFAULT_TRIGGER,
    join_match:   DEFAULT_TRIGGER,
    leave_match:  DEFAULT_TRIGGER,
    reward_claim: DEFAULT_TRIGGER,
  },
};

type TriggerKey = keyof AdConfig['triggers'];
const TRIGGER_KEYS: TriggerKey[] = ['app_open', 'join_match', 'leave_match', 'reward_claim'];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdConfig(): AdConfig {
  const [config, setConfig] = useState<AdConfig>(INITIAL);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    (async () => {
      try {
        // 1. ad_settings — global switch + default cooldown
        const { data: settingsRow } = await supabase
          .from('ad_settings')
          .select('ads_enabled, default_cooldown')
          .limit(1)
          .maybeSingle();

        // 2. ad_units — active units by type (gives us the Google unit ID string)
        const { data: unitsRows } = await supabase
          .from('ad_units')
          .select('type, ad_unit_id')
          .eq('status', 'active');

        // 3. ad_triggers — per-trigger config joined with their linked ad_unit
        //    The select uses a PostgREST foreign-key join: ad_units(ad_unit_id)
        const { data: triggersRows } = await supabase
          .from('ad_triggers')
          .select('trigger_type, enabled, cooldown_seconds, ad_units(ad_unit_id)');

        if (!activeRef.current) return;

        // ── Build unitIds map (type → Google AdMob unit ID string) ──
        const unitIds: AdConfig['unitIds'] = {
          app_open:     null,
          interstitial: null,
          rewarded:     null,
        };
        for (const row of (unitsRows ?? [])) {
          if (row.type === 'app_open')     unitIds.app_open     = row.ad_unit_id;
          if (row.type === 'interstitial') unitIds.interstitial = row.ad_unit_id;
          if (row.type === 'rewarded')     unitIds.rewarded     = row.ad_unit_id;
        }

        // ── Build triggers map ──
        const defaultCooldown = settingsRow?.default_cooldown ?? 60;
        const triggers: AdConfig['triggers'] = {
          app_open:     { ...DEFAULT_TRIGGER, cooldownSeconds: defaultCooldown },
          join_match:   { ...DEFAULT_TRIGGER, cooldownSeconds: defaultCooldown },
          leave_match:  { ...DEFAULT_TRIGGER, cooldownSeconds: defaultCooldown },
          reward_claim: { ...DEFAULT_TRIGGER, cooldownSeconds: defaultCooldown },
        };

        for (const row of (triggersRows ?? [])) {
          const key = row.trigger_type as TriggerKey;
          if (!TRIGGER_KEYS.includes(key)) continue;
          const linkedUnit = Array.isArray(row.ad_units)
            ? (row.ad_units[0] as { ad_unit_id: string } | undefined)
            : (row.ad_units as { ad_unit_id: string } | null);
          triggers[key] = {
            enabled:         row.enabled ?? false,
            cooldownSeconds: row.cooldown_seconds ?? defaultCooldown,
            unitId:          linkedUnit?.ad_unit_id ?? null,
          };
        }

        setConfig({
          ready:           true,
          adsEnabled:      settingsRow?.ads_enabled ?? false,
          defaultCooldown,
          unitIds,
          triggers,
        });
      } catch {
        if (activeRef.current) {
          setConfig(prev => ({ ...prev, ready: true, adsEnabled: false }));
        }
      }
    })();

    return () => { activeRef.current = false; };
  }, []);

  return config;
}
