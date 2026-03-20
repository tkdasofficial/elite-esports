import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { motion } from 'motion/react';
import { ArrowLeft, Radio, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/src/utils/helpers';

type Filter = 'live' | 'upcoming' | 'completed' | 'all';

const FILTER_CONFIG = {
  all:       { label: 'All',       icon: null },
  live:      { label: 'Live',      icon: Radio },
  upcoming:  { label: 'Upcoming',  icon: Zap },
  completed: { label: 'Completed', icon: CheckCircle2 },
};

export default function TournamentsAll() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = (searchParams.get('filter') || 'all') as Filter;

  const { liveMatches, upcomingMatches, completedMatches } = useMatchStore();

  const now = new Date();
  const filterMatches = (matches: any[]) =>
    matches.filter(m => {
      if (m.delete_at && new Date(m.delete_at) < now) return false;
      if (m.status === 'completed' && m.show_until && new Date(m.show_until) < now) return false;
      return true;
    });

  const live      = filterMatches(liveMatches);
  const upcoming  = filterMatches(upcomingMatches);
  const completed = filterMatches(completedMatches);

  const displayMatches = () => {
    if (activeFilter === 'live')      return live;
    if (activeFilter === 'upcoming')  return upcoming;
    if (activeFilter === 'completed') return completed;
    return [...live, ...upcoming, ...completed];
  };

  const matches = displayMatches();

  const setFilter = (f: Filter) => setSearchParams({ filter: f });

  const statusBadge = (status: string) => {
    if (status === 'live') return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-live/15 text-brand-live text-[11px] font-semibold rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-live animate-pulse" /> LIVE
      </span>
    );
    if (status === 'upcoming') return (
      <span className="px-2 py-0.5 bg-brand-warning/15 text-brand-warning text-[11px] font-semibold rounded-full">UPCOMING</span>
    );
    return (
      <span className="px-2 py-0.5 bg-app-fill text-text-muted text-[11px] font-semibold rounded-full">ENDED</span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Tournaments</h1>
        <span className="ml-auto px-2.5 py-[3px] bg-brand-primary/15 text-brand-primary rounded-full text-[13px] font-medium tabular">
          {matches.length}
        </span>
      </header>

      <div className="flex-1 scrollable-content px-4 pt-4 pb-10 space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(Object.keys(FILTER_CONFIG) as Filter[]).map(f => {
            const cfg = FILTER_CONFIG[f];
            const count = f === 'all' ? live.length + upcoming.length + completed.length
              : f === 'live' ? live.length
              : f === 'upcoming' ? upcoming.length
              : completed.length;

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[14px] font-medium whitespace-nowrap transition-all duration-150 active:opacity-60 shrink-0',
                  activeFilter === f
                    ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                    : 'bg-app-elevated text-text-secondary'
                )}
              >
                {cfg.label}
                <span className={cn(
                  'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                  activeFilter === f ? 'bg-white/20 text-white' : 'bg-app-border text-text-muted'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {matches.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-[88px] h-[88px] bg-app-card rounded-[28px] flex items-center justify-center">
              <Radio size={36} className="text-text-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-[17px] font-semibold text-text-primary">No Tournaments</p>
              <p className="text-[15px] text-text-secondary font-normal">
                {activeFilter === 'live' ? 'No live matches right now' :
                 activeFilter === 'upcoming' ? 'No upcoming matches' :
                 activeFilter === 'completed' ? 'No completed matches' :
                 'No tournaments available'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => (
              <motion.div key={match.match_id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={match.status === 'completed' ? 'opacity-75' : ''}>
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
