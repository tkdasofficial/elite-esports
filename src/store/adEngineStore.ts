import { create } from 'zustand';
import { Campaign, CampaignTrigger, useCampaignStore } from './campaignStore';

interface AdEngineState {
  activeCampaign: Campaign | null;
  onComplete: (() => void) | null;

  triggerAd: (trigger: CampaignTrigger) => Promise<void>;
  completeAd: () => void;
}

export const useAdEngineStore = create<AdEngineState>()((set, get) => ({
  activeCampaign: null,
  onComplete: null,

  triggerAd: (trigger: CampaignTrigger): Promise<void> => {
    return new Promise((resolve) => {
      const campaign = useCampaignStore.getState().getActiveCampaignForTrigger(trigger);
      if (!campaign) {
        resolve();
        return;
      }
      set({ activeCampaign: campaign, onComplete: resolve });
    });
  },

  completeAd: () => {
    const { onComplete } = get();
    onComplete?.();
    set({ activeCampaign: null, onComplete: null });
  },
}));
