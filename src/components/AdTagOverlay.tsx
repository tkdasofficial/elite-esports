import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AdTag } from '@/src/store/adTagStore';
import { AdTagRenderer } from './AdTagRenderer';

interface AdTagOverlayProps {
  tag: AdTag;
  onComplete: () => void;
}

const SKIP_DELAY_SECONDS = 5;

export function AdTagOverlay({ tag, onComplete }: AdTagOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const canSkip = elapsed >= SKIP_DELAY_SECONDS;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(SKIP_DELAY_SECONDS - elapsed, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9000] bg-black flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-10 pb-3 z-10 shrink-0">
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
            Ad
          </span>
          {canSkip ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-[12px] font-bold rounded-full border border-white/20 active:opacity-70"
            >
              <X size={12} /> Close
            </motion.button>
          ) : (
            <div className="px-3 py-1.5 bg-white/10 text-white/60 text-[12px] font-bold rounded-full">
              {remaining}s
            </div>
          )}
        </div>

        {/* Ad content */}
        <div className="flex-1 overflow-auto px-4 pb-8">
          <AdTagRenderer tag={tag} height={window.innerHeight - 120} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
