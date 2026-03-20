import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBannerStore } from '@/src/store/bannerStore';
import { Button } from '@/src/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function BannerCarousel() {
  const { banners } = useBannerStore();
  const activeBanners = banners.filter(b => b.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000); // Auto-scroll every 5 seconds
    return () => clearInterval(timer);
  }, [nextSlide]);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  if (activeBanners.length === 0) return null;

  return (
    <div className="relative w-full aspect-video sm:aspect-[21/9] max-h-[400px] rounded-3xl overflow-hidden group shadow-2xl shadow-brand-blue/10 touch-none">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={activeBanners[currentIndex].id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              nextSlide();
            } else if (swipe > swipeConfidenceThreshold) {
              prevSlide();
            }
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ 
            opacity: { duration: 0.3 },
            scale: { duration: 0.4, ease: "easeOut" }
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img
            src={activeBanners[currentIndex].image}
            alt={activeBanners[currentIndex].title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
          
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end space-y-2 sm:space-y-4">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tighter uppercase italic"
            >
              {activeBanners[currentIndex].title}
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] sm:text-xs font-bold text-white/70 max-w-md line-clamp-2 uppercase tracking-widest"
            >
              {activeBanners[currentIndex].description}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={() => navigate(activeBanners[currentIndex].link)}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs px-6 py-2 sm:py-3 rounded-xl shadow-xl shadow-brand-blue/20"
              >
                {activeBanners[currentIndex].buttonText}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

    </div>
  );
}
