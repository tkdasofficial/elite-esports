import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AdType = 'AdMob' | 'AdSense' | 'Custom Script' | 'URL Redirect';
export type AdPlatform = 'Web' | 'Android' | 'iOS' | 'All';
export type AdPlacement =
  | 'join_button_ad'
  | 'leave_button_ad'
  | 'welcome_ad'
  | 'get_reward_ad'
  | 'timer_ad';
export type TriggerType = 'On Load' | 'On Click' | 'Timed';
export type ScriptLoadMode = 'async' | 'defer' | 'sync';
export type FallbackBehavior = 'hide' | 'placeholder' | 'house-ad';

export interface AdTag {
  id: string;
  name: string;
  type: AdType;
  platform: AdPlatform;
  placement: AdPlacement;
  code: string;
  triggerType: TriggerType;
  delay: number;
  priority: number;
  frequencyLimit: string;
  status: 'active' | 'inactive';
  updatedAt: string;
}

interface TagState {
  tags: AdTag[];

  killSwitch: boolean;
  testMode: boolean;
  safeBrowsing: boolean;
  adBlockDetection: boolean;
  adBlockMessage: string;

  lazyLoad: boolean;
  scriptLoadMode: ScriptLoadMode;
  fallbackBehavior: FallbackBehavior;

  frequencyCap: number;
  sessionResetHours: number;

  enabledPlacements: Record<AdPlacement, boolean>;

  addTag: (tag: Omit<AdTag, 'id' | 'updatedAt'>) => void;
  updateTag: (id: string, updates: Partial<Omit<AdTag, 'id'>>) => void;
  deleteTag: (id: string) => void;
  toggleStatus: (id: string) => void;

  setKillSwitch: (v: boolean) => void;
  setTestMode: (v: boolean) => void;
  setSafeBrowsing: (v: boolean) => void;
  setAdBlockDetection: (v: boolean) => void;
  setAdBlockMessage: (v: string) => void;

  setLazyLoad: (v: boolean) => void;
  setScriptLoadMode: (v: ScriptLoadMode) => void;
  setFallbackBehavior: (v: FallbackBehavior) => void;

  setFrequencyCap: (v: number) => void;
  setSessionResetHours: (v: number) => void;

  setPlacementEnabled: (placement: AdPlacement, enabled: boolean) => void;
}

const DEFAULT_PLACEMENTS: Record<AdPlacement, boolean> = {
  join_button_ad:  true,
  leave_button_ad: true,
  welcome_ad:      true,
  get_reward_ad:   true,
  timer_ad:        true,
};

export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [],

      killSwitch: false,
      testMode: false,
      safeBrowsing: true,
      adBlockDetection: false,
      adBlockMessage: 'Please disable your ad blocker to support Elite Esports.',

      lazyLoad: true,
      scriptLoadMode: 'async',
      fallbackBehavior: 'hide',

      frequencyCap: 3,
      sessionResetHours: 24,

      enabledPlacements: { ...DEFAULT_PLACEMENTS },

      addTag: (tag) =>
        set((state) => ({
          tags: [
            ...state.tags,
            { ...tag, id: Math.random().toString(36).slice(2, 10), updatedAt: new Date().toISOString() },
          ],
        })),

      updateTag: (id, updates) =>
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTag: (id) =>
        set((state) => ({ tags: state.tags.filter((t) => t.id !== id) })),

      toggleStatus: (id) =>
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
              : t
          ),
        })),

      setKillSwitch: (v) => set({ killSwitch: v }),
      setTestMode: (v) => set({ testMode: v }),
      setSafeBrowsing: (v) => set({ safeBrowsing: v }),
      setAdBlockDetection: (v) => set({ adBlockDetection: v }),
      setAdBlockMessage: (v) => set({ adBlockMessage: v }),

      setLazyLoad: (v) => set({ lazyLoad: v }),
      setScriptLoadMode: (v) => set({ scriptLoadMode: v }),
      setFallbackBehavior: (v) => set({ fallbackBehavior: v }),

      setFrequencyCap: (v) => set({ frequencyCap: v }),
      setSessionResetHours: (v) => set({ sessionResetHours: v }),

      setPlacementEnabled: (placement, enabled) =>
        set((state) => ({
          enabledPlacements: { ...state.enabledPlacements, [placement]: enabled },
        })),
    }),
    {
      name: 'elite-tags-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
