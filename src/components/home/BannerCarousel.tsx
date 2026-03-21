import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCampaignStore } from '@/src/store/campaignStore';
import { useNavigate } from 'react-router-dom';

export function BannerCarousel() {
  const { getActiveBanners } = useCampaignStore();
  const active = getActiveBanners();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const navigate = useNavigate();

  const go = useCallback((n: number) => {
    setDir(n);
    setIndex(p => (p + n + active.length) % active.length);
  }, [active.length]);

  useEffect(() => {
    const t = setInterval(() => go(1), 4500);
    return () => clearInterval(t);
  }, [go]);

  if (!active.length) return null;

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
            src={banner.mediaUrl}
            alt={banner.title || banner.name}
            className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=60'; }}
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
              {banner.title || banner.name}
            </motion.h2>
            {banner.description && (
              <motion.p
                key={`d-${banner.id}`}
                initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.28 }}
                className="text-[12px] text-white/60 font-medium mt-0.5 line-clamp-1"
              >
                {banner.description}
              </motion.p>
            )}
          </div>

          {banner.buttonText && (
            <motion.button
              key={`b-${banner.id}`}
              initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.28 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => banner.linkUrl && navigate(banner.linkUrl)}
              className="self-start px-4 py-2 bg-brand-primary rounded-[12px] text-white text-[13px] font-semibold shadow-lg shadow-brand-primary/30"
            >
              {banner.buttonText}
            </motion.button>
          )}
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
