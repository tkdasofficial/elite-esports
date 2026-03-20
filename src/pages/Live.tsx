import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { motion } from 'motion/react';
import { Radio, Play } from 'lucide-react';

export default function Live() {
  const { liveMatches } = useMatchStore();

  return (
    <div className="px-4 pb-24 space-y-6 pt-3">
      {/* Hero stream card */}
      <section>
        <div className="relative rounded-[20px] overflow-hidden cursor-pointer active:opacity-90 transition-opacity"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"
            alt="Live Stream"
            className="w-full h-48 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-xl">
              <Play size={26} fill="white" className="text-white ml-1" />
            </div>
          </div>

          {/* LIVE badge */}
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-live rounded-[8px] text-white text-[12px] font-semibold shadow-lg">
              <span className="w-[6px] h-[6px] rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-[17px] font-semibold text-white tracking-[-0.3px]">Watch Live Streams</h3>
            <p className="text-[13px] text-white/55 font-normal mt-0.5">Experience the action in real-time</p>
          </div>
        </div>
      </section>

      {/* Active tournaments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-brand-live" />
            <h3 className="text-[17px] font-semibold text-text-primary tracking-[-0.3px]">Active Tournaments</h3>
          </div>
          {liveMatches.length > 0 && (
            <span className="px-2.5 py-[3px] bg-brand-live/15 text-brand-live rounded-full text-[13px] font-medium">
              {liveMatches.length} live
            </span>
          )}
        </div>

        <div className="space-y-4">
          {liveMatches.map((match, i) => (
            <motion.div key={match.match_id}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }}>
              <MatchCard match={match} />
            </motion.div>
          ))}
        </div>

        {liveMatches.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-[88px] h-[88px] bg-app-card rounded-[28px] flex items-center justify-center">
              <Radio size={36} className="text-text-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-[17px] font-semibold text-text-primary">No Live Matches</p>
              <p className="text-[15px] text-text-secondary font-normal">Check back during tournament hours</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
