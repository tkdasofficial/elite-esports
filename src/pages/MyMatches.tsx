import { useUserStore } from '@/src/store/userStore';
import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { motion } from 'motion/react';
import { Trophy, ChevronLeft, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyMatches() {
  const { joinedMatchIds } = useUserStore();
  const { liveMatches, upcomingMatches, completedMatches } = useMatchStore();

  const all = [...liveMatches, ...upcomingMatches, ...completedMatches];
  const mine = all.filter(m => joinedMatchIds.includes(m.match_id));

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[60px] px-5 flex items-center gap-3 glass-dark border-b border-app-border sticky top-0 z-50">
        <Link
          to="/profile"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-transform"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[17px] font-bold text-text-primary flex-1">My Matches</h1>
        {mine.length > 0 && (
          <span className="px-2.5 py-1 bg-brand-primary/15 text-brand-primary-light text-xs font-semibold rounded-lg border border-brand-primary/25">
            {mine.length}
          </span>
        )}
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 pb-10">
        {mine.length > 0 ? (
          <div className="space-y-4">
            {mine.map((match, i) => (
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
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div className="w-24 h-24 bg-app-card border border-app-border rounded-[28px] flex items-center justify-center shadow-xl">
              <Swords size={36} className="text-text-muted" />
            </div>
            <div className="space-y-1.5">
              <p className="text-lg font-bold text-text-primary">No Matches Joined</p>
              <p className="text-sm text-text-muted font-medium max-w-[200px] mx-auto leading-relaxed">
                Join tournaments to track your progress
              </p>
            </div>
            <Link to="/">
              <button className="px-8 py-3.5 bg-brand-primary text-white rounded-2xl text-sm font-semibold shadow-lg shadow-brand-primary/25 active:scale-95 transition-all">
                Explore Matches
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
