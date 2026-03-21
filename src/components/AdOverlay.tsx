import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Campaign } from '@/src/store/campaignStore';

interface AdOverlayProps {
  campaign: Campaign;
  onComplete: () => void;
}

export function AdOverlay({ campaign, onComplete }: AdOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const total = campaign.duration || 5;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (campaign.isSkippable && next >= campaign.skipAfter) setCanSkip(true);
        if (next >= total) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
        }
        return Math.min(next, total);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [total, campaign.isSkippable, campaign.skipAfter, onComplete]);

  const progress = Math.min((elapsed / total) * 100, 100);
  const remaining = Math.max(total - elapsed, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9000] bg-black flex flex-col"
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
          <motion.div
            className="h-full bg-[#FF4500]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
          <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
            Ad
          </span>
          <div className="flex items-center gap-2">
            {campaign.adType === 'Video' && (
              <button
                onClick={() => {
                  setMuted((m) => {
                    if (videoRef.current) videoRef.current.muted = !m;
                    return !m;
                  });
                }}
                className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm text-white/70 active:opacity-70"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
            {canSkip ? (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onComplete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-[12px] font-bold rounded-full border border-white/20 active:opacity-70"
              >
                <X size={12} /> Skip Ad
              </motion.button>
            ) : (
              <div className="px-3 py-1.5 bg-black/40 backdrop-blur-sm text-white/60 text-[12px] font-bold rounded-full">
                {remaining}s
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="flex-1 relative overflow-hidden">
          {campaign.adType === 'Video' ? (
            <video
              ref={videoRef}
              src={campaign.mediaUrl}
              autoPlay
              muted={muted}
              playsInline
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={campaign.mediaUrl}
              alt={campaign.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Bottom info */}
          {(campaign.title || campaign.description) && (
            <div className="absolute bottom-6 left-5 right-5 space-y-2">
              {campaign.title && (
                <h2 className="text-white text-[20px] font-bold leading-tight drop-shadow">
                  {campaign.title}
                </h2>
              )}
              {campaign.description && (
                <p className="text-white/70 text-[13px] leading-relaxed">{campaign.description}</p>
              )}
              {campaign.buttonText && campaign.linkUrl && (
                <a
                  href={campaign.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-1 px-5 py-2.5 bg-[#FF4500] text-white text-[14px] font-semibold rounded-xl shadow-lg shadow-orange-600/30 active:opacity-80"
                >
                  {campaign.buttonText}
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
