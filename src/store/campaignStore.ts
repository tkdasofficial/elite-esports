import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CampaignAdType = 'Image' | 'Video' | 'Banner';
export type CampaignTrigger = 'Welcome' | 'Join' | 'Leave' | 'Reward' | 'Timer';

export interface Campaign {
  id: string;
  name: string;
  adType: CampaignAdType;
  triggerType: CampaignTrigger;
  mediaUrl: string;
  duration: number;
  isSkippable: boolean;
  skipAfter: number;
  intervalMinutes: number;
  priority: number;
  status: 'active' | 'inactive';
  title?: string;
  description?: string;
  buttonText?: string;
  linkUrl?: string;
  createdAt: string;
}

interface CampaignState {
  campaigns: Campaign[];
  lastWelcomeAdDate: string | null;
  lastTimerAdAt: number | null;

  addCampaign: (c: Omit<Campaign, 'id' | 'createdAt'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  toggleStatus: (id: string) => void;

  getActiveCampaignForTrigger: (trigger: CampaignTrigger) => Campaign | null;
  getActiveBanners: () => Campaign[];

  recordWelcomeAd: () => void;
  recordTimerAd: () => void;
  shouldShowWelcomeAd: () => boolean;
  shouldShowTimerAd: () => boolean;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      lastWelcomeAdDate: null,
      lastTimerAdAt: null,

      addCampaign: (c) =>
        set((state) => ({
          campaigns: [
            ...state.campaigns,
            {
              ...c,
              id: Math.random().toString(36).slice(2, 10),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateCampaign: (id, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        })),

      toggleStatus: (id) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id
              ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
              : c
          ),
        })),

      getActiveCampaignForTrigger: (trigger) => {
        const { campaigns } = get();
        const matches = campaigns
          .filter((c) => c.status === 'active' && c.triggerType === trigger && c.adType !== 'Banner')
          .sort((a, b) => b.priority - a.priority);
        return matches[0] ?? null;
      },

      getActiveBanners: () => {
        const { campaigns } = get();
        return campaigns
          .filter((c) => c.status === 'active' && c.adType === 'Banner')
          .sort((a, b) => b.priority - a.priority);
      },

      recordWelcomeAd: () =>
        set({ lastWelcomeAdDate: new Date().toISOString().slice(0, 10) }),

      recordTimerAd: () =>
        set({ lastTimerAdAt: Date.now() }),

      shouldShowWelcomeAd: () => {
        const { lastWelcomeAdDate, campaigns } = get();
        const hasActiveCampaign = campaigns.some(
          (c) => c.status === 'active' && c.triggerType === 'Welcome' && c.adType !== 'Banner'
        );
        if (!hasActiveCampaign) return false;
        const today = new Date().toISOString().slice(0, 10);
        return lastWelcomeAdDate !== today;
      },

      shouldShowTimerAd: () => {
        const { lastTimerAdAt, campaigns } = get();
        const timerCampaign = campaigns
          .filter((c) => c.status === 'active' && c.triggerType === 'Timer' && c.adType !== 'Banner')
          .sort((a, b) => b.priority - a.priority)[0];
        if (!timerCampaign) return false;
        if (!lastTimerAdAt) return true;
        const elapsedMs = Date.now() - lastTimerAdAt;
        return elapsedMs >= timerCampaign.intervalMinutes * 60 * 1000;
      },
    }),
    {
      name: 'elite-campaigns-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
