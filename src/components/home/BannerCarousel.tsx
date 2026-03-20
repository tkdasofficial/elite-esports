import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBannerStore } from '@/src/store/bannerStore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function BannerCarousel() {
  const { banners } = useBannerStore();
  const activeBanners = banners.filter((b) => b.isActive);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const next = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[index];

  return (
    <div className="relative w-full rounded-[22px] overflow-hidden shadow-2xl shadow-black/50 group">
      {/* Image */}
      <div className="aspect-[16/8] relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.img
            key={banner.id}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -8000) next();
              else if (swipe > 8000) prev();
            }}
            src={banner.image}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/40 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end gap-3">
          <div className="space-y-1">
            <motion.h2
              key={`title-${banner.id}`}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg"
            >
              {banner.title}
            </motion.h2>
            <motion.p
              key={`desc-${banner.id}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.3 }}
              className="text-xs font-medium text-white/60 line-clamp-1 max-w-[260px]"
            >
              {banner.description}
            </motion.p>
          </div>
          <motion.button
            key={`btn-${banner.id}`}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.24, duration: 0.3 }}
            onClick={() => navigate(banner.link)}
            className="self-start px-5 py-2 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-primary/40 transition-colors active:scale-95"
          >
            {banner.buttonText}
          </motion.button>
        </div>
      </div>

      {/* Nav arrows (hover) */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="pointer-events-auto w-8 h-8 rounded-xl glass-dark flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="pointer-events-auto w-8 h-8 rounded-xl glass-dark flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
        {activeBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            className={`rounded-full transition-all duration-300 ${
              i === index ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/35'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
