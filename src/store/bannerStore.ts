import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';
import { Banner } from '../types';

interface BannerState {
  banners: Banner[];
  autoRotate: boolean;
  mobileOnly: boolean;
  loading: boolean;
  fetchBanners: () => Promise<void>;
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (id: string, banner: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  toggleBannerStatus: (id: string) => Promise<void>;
  reorderBanner: (id: string, direction: 'up' | 'down') => Promise<void>;
  setAutoRotate: (val: boolean) => void;
  setMobileOnly: (val: boolean) => void;
}

function rowToBanner(row: any): Banner {
  return {
    id:          row.id,
    image:       row.image ?? '',
    title:       row.title ?? '',
    description: row.description ?? '',
    buttonText:  row.button_text ?? '',
    link:        row.link ?? '',
    isActive:    row.is_active ?? true,
  };
}

export const useBannerStore = create<BannerState>()((set, get) => ({
  banners: [],
  autoRotate: true,
  mobileOnly: false,
  loading: false,

  fetchBanners: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      set({ banners: (data ?? []).map(rowToBanner) });
    } catch (e) {
      console.error('fetchBanners error:', e);
    } finally {
      set({ loading: false });
    }
  },

  addBanner: async (banner) => {
    const sort_order = get().banners.length;
    const { data, error } = await supabase
      .from('banners')
      .insert({
        image:       banner.image,
        title:       banner.title,
        description: banner.description,
        button_text: banner.buttonText,
        link:        banner.link,
        is_active:   banner.isActive,
        sort_order,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    set((s) => ({ banners: [...s.banners, rowToBanner(data)] }));
  },

  updateBanner: async (id, updated) => {
    const dbFields: any = {};
    if (updated.image       !== undefined) dbFields.image       = updated.image;
    if (updated.title       !== undefined) dbFields.title       = updated.title;
    if (updated.description !== undefined) dbFields.description = updated.description;
    if (updated.buttonText  !== undefined) dbFields.button_text = updated.buttonText;
    if (updated.link        !== undefined) dbFields.link        = updated.link;
    if (updated.isActive    !== undefined) dbFields.is_active   = updated.isActive;
    const { error } = await supabase.from('banners').update(dbFields).eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({
      banners: s.banners.map((b) => (b.id === id ? { ...b, ...updated } : b)),
    }));
  },

  deleteBanner: async (id) => {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw new Error(error.message);
    set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }));
  },

  toggleBannerStatus: async (id) => {
    const banner = get().banners.find((b) => b.id === id);
    if (!banner) return;
    await get().updateBanner(id, { isActive: !banner.isActive });
  },

  reorderBanner: async (id, direction) => {
    const banners = [...get().banners];
    const index = banners.findIndex((b) => b.id === id);
    if (index < 0) return;
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    [banners[index], banners[swapIdx]] = [banners[swapIdx], banners[index]];
    set({ banners });
    await Promise.all([
      supabase.from('banners').update({ sort_order: swapIdx }).eq('id', banners[index].id),
      supabase.from('banners').update({ sort_order: index   }).eq('id', banners[swapIdx].id),
    ]);
  },

  setAutoRotate: (val) => set({ autoRotate: val }),
  setMobileOnly: (val) => set({ mobileOnly: val }),
}));
