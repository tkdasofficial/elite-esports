import { useUserStore } from '@/src/store/userStore';
import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { motion } from 'motion/react';
import { ChevronLeft, Swords } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function MyMatches() {
  const { joinedMatchIds } = useUserStore();
  const { liveMatches, upcomingMatches, completedMatches } = useMatchStore();
  const navigate = useNavigate();

  const all = [...liveMatches, ...upcomingMatches, ...completedMatches];
  const mine = all.filter(m => joinedMatchIds.includes(m.match_id));

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center bg-app-bg/90 backdrop-blur-md border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="text-[17px] text-brand-primary font-normal mr-auto">‹ Account</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">My Matches</h1>
        {mine.length > 0 && (
          <span className="ml-auto px-2 py-[2px] bg-brand-primary rounded-full text-[12px] font-medium text-white tabular">
            {mine.length}
          </span>
        )}
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 pb-10">
        {mine.length > 0 ? (
          <div className="space-y-4">
            {mine.map((match, i) => (
              <motion.div key={match.match_id}
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }}>
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 text-center">
            <div className="w-[88px] h-[88px] bg-app-card rounded-[28px] flex items-center justify-center">
              <Swords size={40} className="text-text-muted" />
            </div>
            <div className="space-y-2">
              <p className="text-[20px] font-semibold text-text-primary tracking-[-0.4px]">No Matches Yet</p>
              <p className="text-[15px] text-text-secondary font-normal max-w-[220px] leading-relaxed mx-auto">
                Join tournaments to track your competitive journey
              </p>
            </div>
            <button onClick={() => navigate('/')}
              className="px-8 py-4 bg-brand-primary rounded-[14px] text-white text-[17px] font-semibold active:opacity-75 transition-opacity shadow-lg shadow-brand-primary/25">
              Browse Tournaments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
