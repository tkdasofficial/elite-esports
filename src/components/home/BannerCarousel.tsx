import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBannerStore } from '@/src/store/bannerStore';
import { useNavigate } from 'react-router-dom';

export function BannerCarousel() {
  const { banners, autoRotate, mobileOnly } = useBannerStore();
  const active = banners.filter(b => b.isActive);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const navigate = useNavigate();

  const go = useCallback((n: number) => {
    setDir(n);
    setIndex(p => (p + n + active.length) % active.length);
  }, [active.length]);

  useEffect(() => {
    if (!autoRotate) return;
    const t = setInterval(() => go(1), 4500);
    return () => clearInterval(t);
  }, [go, autoRotate]);

  if (!active.length) return null;
  if (mobileOnly && typeof window !== 'undefined' && window.innerWidth >= 768) return null;

  const banner = active[Math.min(index, active.length - 1)];

  return (
    <div className="relative w-full rounded-[20px] overflow-hidden"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>

      <div className="aspect-[16/9] relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.img
            key={banner.id}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d * 40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit:  (d: number) => ({ x: d * -40, opacity: 0 }),
            }}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.32, ease: [0.32, 0, 0.67, 0] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, { offset, velocity }) => {
              const s = Math.abs(offset.x) * velocity.x;
              if (s < -6000) go(1); else if (s > 6000) go(-1);
            }}
            src={banner.image}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent pointer-events-none" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 gap-2.5">
          <div>
            <motion.h2
              key={`t-${banner.id}`}
              initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.28 }}
              className="text-[18px] font-bold text-white leading-tight tracking-[-0.3px] drop-shadow-sm"
            >
              {banner.title}
            </motion.h2>
            <motion.p
              key={`d-${banner.id}`}
              initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.14, duration: 0.28 }}
              className="text-[12px] text-white/60 font-medium mt-0.5 line-clamp-1"
            >
              {banner.description}
            </motion.p>
          </div>

          <motion.button
            key={`b-${banner.id}`}
            initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.28 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => navigate(banner.link)}
            className="self-start px-4 py-2 bg-brand-primary rounded-[12px] text-white text-[13px] font-semibold shadow-lg shadow-brand-primary/30"
          >
            {banner.buttonText}
          </motion.button>
        </div>

        <div className="absolute bottom-3 right-4 flex items-center gap-1">
          {active.map((_, i) => (
            <button key={i}
              onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }}
              className={`rounded-full transition-all duration-300 ${i === index ? 'w-4 h-[5px] bg-white' : 'w-[5px] h-[5px] bg-white/35'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
