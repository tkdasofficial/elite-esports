import { create } from 'zustand';
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

export const useBannerStore = create<BannerState>((set) => ({
  banners: [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=85',
      title: 'Elite Pro Series S4',
      description: '₹1,00,000 prize pool · 100 squads · Starts tonight',
      buttonText: 'Register Now',
      link: '/match/1',
      isActive: true,
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=85',
      title: 'Valorant Champions Cup',
      description: 'Ultimate tactical showdown · ₹12,000 prize',
      buttonText: 'Join Now',
      link: '/match/2',
      isActive: true,
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&q=85',
      title: 'BGMI Battlegrounds',
      description: 'Squad up · Drop in · Win big',
      buttonText: 'Play Now',
      link: '/match/1',
      isActive: true,
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1200&q=85',
      title: 'Free Fire Max Cup',
      description: 'Fast-paced battle royale · 48 players',
      buttonText: 'Enter Now',
      link: '/match/3',
      isActive: true,
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1200&q=85',
      title: 'COD Mobile Invitational',
      description: 'Elite squads only · ₹25,000 winner takes all',
      buttonText: 'Apply Now',
      link: '/match/2',
      isActive: true,
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=1200&q=85',
      title: 'Season 12 Kickoff',
      description: 'New season, new champions. Are you ready?',
      buttonText: 'View Schedule',
      link: '/',
      isActive: true,
    },
  ],
  autoRotate: true,
  mobileOnly: false,
  addBanner: (banner) => set((state) => ({
    banners: [...state.banners, { ...banner, id: Math.random().toString(36).substr(2, 9) }],
  })),
  updateBanner: (id, updated) => set((state) => ({
    banners: state.banners.map(b => b.id === id ? { ...b, ...updated } : b),
  })),
  deleteBanner: (id) => set((state) => ({
    banners: state.banners.filter(b => b.id !== id),
  })),
  toggleBannerStatus: (id) => set((state) => ({
    banners: state.banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b),
  })),
  reorderBanner: (id, direction) => set((state) => {
    const index = state.banners.findIndex(b => b.id === id);
    if (index < 0) return state;
    const newBanners = [...state.banners];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newBanners.length) return state;
    [newBanners[index], newBanners[swapIdx]] = [newBanners[swapIdx], newBanners[index]];
    return { banners: newBanners };
  }),
  setAutoRotate: (val) => set({ autoRotate: val }),
  setMobileOnly: (val) => set({ mobileOnly: val }),
}));
