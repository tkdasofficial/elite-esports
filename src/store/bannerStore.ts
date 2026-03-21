import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Banner } from '../types';

interface BannerState {
  banners: Banner[];
  autoRotate: boolean;
  mobileOnly: boolean;
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;
  reorderBanner: (id: string, direction: 'up' | 'down') => void;
  setAutoRotate: (val: boolean) => void;
  setMobileOnly: (val: boolean) => void;
}

export const useBannerStore = create<BannerState>()(
  persist(
    (set) => ({
      banners: [],
      autoRotate: true,
      mobileOnly: false,

      addBanner: (banner) =>
        set((state) => ({
          banners: [
            ...state.banners,
            { ...banner, id: Math.random().toString(36).substr(2, 9) },
          ],
        })),

      updateBanner: (id, updated) =>
        set((state) => ({
          banners: state.banners.map(b =>
            b.id === id ? { ...b, ...updated } : b
          ),
        })),

      deleteBanner: (id) =>
        set((state) => ({
          banners: state.banners.filter(b => b.id !== id),
        })),

      toggleBannerStatus: (id) =>
        set((state) => ({
          banners: state.banners.map(b =>
            b.id === id ? { ...b, isActive: !b.isActive } : b
          ),
        })),

      reorderBanner: (id, direction) =>
        set((state) => {
          const index = state.banners.findIndex(b => b.id === id);
          if (index < 0) return state;
          const newBanners = [...state.banners];
          const swapIdx = direction === 'up' ? index - 1 : index + 1;
          if (swapIdx < 0 || swapIdx >= newBanners.length) return state;
          [newBanners[index], newBanners[swapIdx]] = [
            newBanners[swapIdx],
            newBanners[index],
          ];
          return { banners: newBanners };
        }),

      setAutoRotate: (val) => set({ autoRotate: val }),
      setMobileOnly: (val) => set({ mobileOnly: val }),
    }),
    {
      name: 'elite-banners-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
