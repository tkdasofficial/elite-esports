import { useUserStore } from '@/src/store/userStore';
import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { motion } from 'motion/react';
import { Trophy, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyMatches() {
  const { joinedMatchIds } = useUserStore();
  const { liveMatches, upcomingMatches, completedMatches } = useMatchStore();

  const allMatches = [...liveMatches, ...upcomingMatches, ...completedMatches];
  const myMatches = allMatches.filter(m => joinedMatchIds.includes(m.match_id));

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 px-6 flex items-center gap-4 bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link to="/profile" className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">My Matches</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-10">
        {myMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 pb-8">
            {myMatches.map((match, index) => (
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
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-24 h-24 bg-brand-card/50 backdrop-blur-md rounded-[32px] flex items-center justify-center mx-auto border border-white/5 shadow-2xl">
              <Trophy size={40} className="text-slate-700" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-white uppercase tracking-tight">No Matches Joined</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Join tournaments to see your progress here</p>
            </div>
            <Link to="/">
              <button className="px-10 py-4 bg-brand-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-blue/20 active:scale-95 transition-all mt-4">
                Explore Matches
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
