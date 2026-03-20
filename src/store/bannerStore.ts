import { create } from 'zustand';
import { Banner } from '../types';

interface BannerState {
  banners: Banner[];
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (id: string, banner: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleBannerStatus: (id: string) => void;
}

export const useBannerStore = create<BannerState>((set) => ({
  banners: [
    {
      id: '1',
      image: 'https://picsum.photos/seed/esports1/1600/900',
      title: 'ELITE PRO SERIES S4',
      description: 'The biggest tournament of the month with ₹1,00,000 prize pool.',
      buttonText: 'Register Now',
      link: '/match/1',
      isActive: true,
    },
    {
      id: '2',
      image: 'https://picsum.photos/seed/gaming2/1600/900',
      title: 'VALORANT CHAMPIONS',
      description: 'Join the ultimate tactical shooter showdown.',
      buttonText: 'Join Now',
      link: '/match/2',
      isActive: true,
    },
    {
      id: '3',
      image: 'https://picsum.photos/seed/battle3/1600/900',
      title: 'BGMI BATTLEGROUNDS',
      description: 'Drop in, loot up, and survive the circle.',
      buttonText: 'Play Now',
      link: '/match/3',
      isActive: true,
    },
    {
      id: '4',
      image: 'https://picsum.photos/seed/action4/1600/900',
      title: 'FREE FIRE MAX CUP',
      description: 'Fast-paced battle royale action awaits you.',
      buttonText: 'Enter Now',
      link: '/match/4',
      isActive: true,
    },
    {
      id: '5',
      image: 'https://picsum.photos/seed/speed5/1600/900',
      title: 'ASPHALT 9 LEGENDS',
      description: 'Race against the best in the world.',
      buttonText: 'Start Race',
      link: '/match/5',
      isActive: true,
    },
    {
      id: '6',
      image: 'https://picsum.photos/seed/strategy6/1600/900',
      title: 'CLASH ROYALE OPEN',
      description: 'Master your deck and dominate the arena.',
      buttonText: 'Battle Now',
      link: '/match/6',
      isActive: true,
    },
    {
      id: '7',
      image: 'https://picsum.photos/seed/sports7/1600/900',
      title: 'FIFA 24 MOBILE',
      description: 'Build your ultimate team and score big.',
      buttonText: 'Kick Off',
      link: '/match/7',
      isActive: true,
    },
    {
      id: '8',
      image: 'https://picsum.photos/seed/fantasy8/1600/900',
      title: 'GENSHIN IMPACT QUEST',
      description: 'Explore Teyvat and uncover hidden treasures.',
      buttonText: 'Explore',
      link: '/match/8',
      isActive: true,
    },
    {
      id: '9',
      image: 'https://picsum.photos/seed/moba9/1600/900',
      title: 'MOBILE LEGENDS BANG BANG',
      description: 'Team up for 5v5 MOBA action.',
      buttonText: 'Fight Now',
      link: '/match/9',
      isActive: true,
    },
    {
      id: '10',
      image: 'https://picsum.photos/seed/horror10/1600/900',
      title: 'DEAD BY DAYLIGHT',
      description: 'Survive the night or hunt your prey.',
      buttonText: 'Survive',
      link: '/match/10',
      isActive: true,
    },
  ],
  addBanner: (banner) => set((state) => ({
    banners: [...state.banners, { ...banner, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateBanner: (id, updatedBanner) => set((state) => ({
    banners: state.banners.map(b => b.id === id ? { ...b, ...updatedBanner } : b)
  })),
  deleteBanner: (id) => set((state) => ({
    banners: state.banners.filter(b => b.id !== id)
  })),
  toggleBannerStatus: (id) => set((state) => ({
    banners: state.banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b)
  })),
}));
