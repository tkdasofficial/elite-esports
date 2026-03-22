import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';

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
  loading: boolean;

  fetchCampaigns: () => Promise<void>;
  addCampaign: (c: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;

  getActiveCampaignForTrigger: (trigger: CampaignTrigger) => Campaign | null;
  getActiveBanners: () => Campaign[];

  recordWelcomeAd: () => void;
  recordTimerAd: () => void;
  shouldShowWelcomeAd: () => boolean;
  shouldShowTimerAd: () => boolean;
}

function rowToCampaign(row: any): Campaign {
  return {
    id:              row.id,
    name:            row.name,
    adType:          row.ad_type,
    triggerType:     row.trigger_type,
    mediaUrl:        row.media_url ?? '',
    duration:        row.duration ?? 5,
    isSkippable:     row.is_skippable ?? true,
    skipAfter:       row.skip_after ?? 3,
    intervalMinutes: row.interval_minutes ?? 5,
    priority:        row.priority ?? 0,
    status:          row.status ?? 'active',
    title:           row.title ?? '',
    description:     row.description ?? '',
    buttonText:      row.button_text ?? '',
    linkUrl:         row.link_url ?? '',
    createdAt:       row.created_at,
  };
}

export const useCampaignStore = create<CampaignState>()((set, get) => ({
  campaigns: [],
  lastWelcomeAdDate: null,
  lastTimerAdAt: null,
  loading: false,

  fetchCampaigns: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('priority', { ascending: false });
      if (error) throw error;
      set({ campaigns: (data ?? []).map(rowToCampaign) });
    } catch (e) {
      console.error('fetchCampaigns error:', e);
    } finally {
      set({ loading: false });
    }
  },

  addCampaign: async (c) => {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name:             c.name,
        ad_type:          c.adType,
        trigger_type:     c.triggerType,
        media_url:        c.mediaUrl,
        duration:         c.duration,
        is_skippable:     c.isSkippable,
        skip_after:       c.skipAfter,
        interval_minutes: c.intervalMinutes,
        priority:         c.priority,
        status:           c.status,
        title:            c.title ?? '',
        description:      c.description ?? '',
        button_text:      c.buttonText ?? '',
        link_url:         c.linkUrl ?? '',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    set((s) => ({ campaigns: [rowToCampaign(data), ...s.campaigns] }));
  },

  updateCampaign: async (id, updates) => {
    const dbFields: any = {};
    if (updates.name            !== undefined) dbFields.name             = updates.name;
    if (updates.adType          !== undefined) dbFields.ad_type          = updates.adType;
    if (updates.triggerType     !== undefined) dbFields.trigger_type     = updates.triggerType;
    if (updates.mediaUrl        !== undefined) dbFields.media_url        = updates.mediaUrl;
    if (updates.duration        !== undefined) dbFields.duration         = updates.duration;
    if (updates.isSkippable     !== undefined) dbFields.is_skippable     = updates.isSkippable;
    if (updates.skipAfter       !== undefined) dbFields.skip_after       = updates.skipAfter;
    if (updates.intervalMinutes !== undefined) dbFields.interval_minutes = updates.intervalMinutes;
    if (updates.priority        !== undefined) dbFields.priority         = updates.priority;
    if (updates.status          !== undefined) dbFields.status           = updates.status;
    if (updates.title           !== undefined) dbFields.title            = updates.title;
    if (updates.description     !== undefined) dbFields.description      = updates.description;
    if (updates.buttonText      !== undefined) dbFields.button_text      = updates.buttonText;
    if (updates.linkUrl         !== undefined) dbFields.link_url         = updates.linkUrl;

    const { error } = await supabase.from('campaigns').update(dbFields).eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  deleteCampaign: async (id) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
  },

  toggleStatus: async (id) => {
    const c = get().campaigns.find((c) => c.id === id);
    if (!c) return;
    await get().updateCampaign(id, { status: c.status === 'active' ? 'inactive' : 'active' });
  },

  getActiveCampaignForTrigger: (trigger) => {
    const { campaigns } = get();
    const matched = campaigns
      .filter((c) => c.status === 'active' && c.triggerType === trigger && c.adType !== 'Banner')
      .sort((a, b) => b.priority - a.priority);
    return matched[0] ?? null;
  },

  getActiveBanners: () =>
    get()
      .campaigns
      .filter((c) => c.status === 'active' && c.adType === 'Banner')
      .sort((a, b) => b.priority - a.priority),

  recordWelcomeAd: () =>
    set({ lastWelcomeAdDate: new Date().toISOString().slice(0, 10) }),

  recordTimerAd: () => set({ lastTimerAdAt: Date.now() }),

  shouldShowWelcomeAd: () => {
    const { lastWelcomeAdDate, campaigns } = get();
    const hasActive = campaigns.some(
      (c) => c.status === 'active' && c.triggerType === 'Welcome' && c.adType !== 'Banner'
    );
    if (!hasActive) return false;
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
    return Date.now() - lastTimerAdAt >= timerCampaign.intervalMinutes * 60 * 1000;
  },
}));
