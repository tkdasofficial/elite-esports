import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AdType = 'AdMob' | 'AdSense' | 'Custom Script' | 'URL Redirect';
export type AdPlatform = 'Web' | 'Android' | 'iOS' | 'All';
export type AdPlacement = 'Splash Screen' | 'Home Banner' | 'Match Details' | 'Reward Button' | 'Interstitial';
export type TriggerType = 'On Load' | 'On Click' | 'Timed';

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
  adBlockDetection: boolean;
  frequencyCap: number;
  addTag: (tag: Omit<AdTag, 'id' | 'updatedAt'>) => void;
  updateTag: (id: string, updates: Partial<Omit<AdTag, 'id'>>) => void;
  deleteTag: (id: string) => void;
  toggleStatus: (id: string) => void;
  setKillSwitch: (v: boolean) => void;
  setAdBlockDetection: (v: boolean) => void;
  setFrequencyCap: (v: number) => void;
}

export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [],
      killSwitch: false,
      adBlockDetection: false,
      frequencyCap: 3,

      addTag: (tag) =>
        set((state) => ({
          tags: [
            ...state.tags,
            {
              ...tag,
              id: Math.random().toString(36).slice(2, 10),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateTag: (id, updates) =>
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
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
      setAdBlockDetection: (v) => set({ adBlockDetection: v }),
      setFrequencyCap: (v) => set({ frequencyCap: v }),
    }),
    {
      name: 'elite-tags-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
