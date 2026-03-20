import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { motion } from 'motion/react';
import { Radio } from 'lucide-react';

export default function Live() {
  const { liveMatches } = useMatchStore();

  return (
    <div className="px-4 pb-28 space-y-6">
      {/* Hero */}
      <section className="pt-3">
        <div className="relative rounded-2xl overflow-hidden bg-app-card border border-app-border group cursor-pointer shadow-xl">
          <img
            src="https://picsum.photos/seed/gaming/800/400"
            className="w-full h-44 object-cover opacity-30 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-app-bg/90 via-transparent to-transparent" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full glass-dark flex items-center justify-center border border-white/15 shadow-2xl group-hover:scale-105 transition-transform">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-text-primary">Watch Live Streams</h3>
              <p className="text-xs text-text-muted font-medium mt-0.5">Experience the action in real-time</p>
            </div>
          </div>

          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-live/90 text-white text-[10px] font-bold rounded-lg shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE NOW
            </span>
          </div>
        </div>
      </section>

      {/* List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={15} className="text-brand-live" />
            <h3 className="text-[15px] font-bold text-text-primary">Active Tournaments</h3>
          </div>
          <span className="px-2.5 py-1 bg-brand-primary/15 text-brand-primary-light text-xs font-semibold rounded-lg border border-brand-primary/25">
            {liveMatches.length} live
          </span>
        </div>

        <div className="space-y-4">
          {liveMatches.map((match, i) => (
            <motion.div
              key={match.match_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <MatchCard match={match} />
            </motion.div>
          ))}
        </div>

        {liveMatches.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-app-card border border-app-border rounded-3xl flex items-center justify-center">
              <Radio size={32} className="text-text-muted" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-base text-text-primary">No Live Matches</p>
              <p className="text-sm text-text-muted font-medium">Check back during tournament hours</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
