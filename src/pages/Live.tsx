import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { motion } from 'motion/react';

export default function Live() {
  const { liveMatches } = useMatchStore();

  return (
    <div className="px-6 space-y-8 pb-24">
      {/* Live Hero Banner */}
      <section className="pt-4">
        <div className="relative h-48 rounded-[32px] overflow-hidden bg-brand-card flex items-center justify-center group cursor-pointer shadow-2xl">
          <img 
            src="https://picsum.photos/seed/gaming/800/400" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Watch Live Streams</h3>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Experience the action in real-time</p>
            </div>
          </div>

          <div className="absolute top-[5px] right-[5px] bg-brand-red px-2 h-[12px] rounded flex items-center gap-1 shadow-lg shadow-brand-red/30">
            <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
            <span className="text-[7px] font-black text-white uppercase tracking-tighter leading-none">Live Now</span>
          </div>
        </div>
      </section>

      {/* Live Matches List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Active Tournaments</h3>
          <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{liveMatches.length} Matches</span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {liveMatches.map((match, index) => (
            <motion.div
              key={match.match_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MatchCard match={match} />
            </motion.div>
          ))}
        </div>

        {liveMatches.length === 0 && (
          <div className="text-center py-24 space-y-6">
            <div className="w-20 h-20 bg-brand-card/50 backdrop-blur-md rounded-[24px] flex items-center justify-center mx-auto border border-white/5">
              <div className="w-8 h-8 border-4 border-slate-700 rounded-full border-t-brand-blue animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black text-white uppercase tracking-tight">No Live Matches</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Check back during tournament hours</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

