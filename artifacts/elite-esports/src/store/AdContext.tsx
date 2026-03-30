import React, { createContext, useContext, ReactNode } from 'react';

export interface AdGateConfig {
  unitId: string;
  duration: number;
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

const DISABLED_GATE: AdGateConfig = {
  unitId: '', duration: 0, enabled: false, type: 'interstitial',
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
  configLoaded:   true,
  isInLiveMatch:  false,
  setInLiveMatch: () => {},
  triggerTimerAd: () => {},
});

export function useAds() {
  return useContext(AdCtx);
}

interface Props { children: ReactNode }

export function AdProvider({ children }: Props) {
  return (
    <AdCtx.Provider value={{
      adConfig:       DEFAULT_CONFIG,
      adsEnabled:     false,
      configLoaded:   true,
      isInLiveMatch:  false,
      setInLiveMatch: () => {},
      triggerTimerAd: () => {},
    }}>
      {children}
    </AdCtx.Provider>
  );
}
