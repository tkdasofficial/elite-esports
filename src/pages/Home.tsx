import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { BannerCarousel } from '@/src/components/home/BannerCarousel';
import { cn } from '@/src/utils/helpers';
import { motion } from 'motion/react';
import { Radio, Zap, CheckCircle2 } from 'lucide-react';

const GAMES = ['All', 'BGMI', 'Valorant', 'Free Fire', 'COD', 'PUBG'];

export default function Home() {
  const { liveMatches, upcomingMatches, completedMatches, searchQuery } = useMatchStore();
  const now = new Date();

  const filterMatches = (matches: any[]) =>
    matches.filter(m => {
      if (m.delete_at && new Date(m.delete_at) < now) return false;
      if (m.status === 'completed' && m.show_until && new Date(m.show_until) < now) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.title.toLowerCase().includes(q) || m.game_name.toLowerCase().includes(q) || m.prize.toLowerCase().includes(q);
      }
      return true;
    });

  const live = filterMatches(liveMatches);
  const upcoming = filterMatches(upcomingMatches);
  const completed = filterMatches(completedMatches);
  const activeFilter = searchQuery || 'All';

  const SectionHeader = ({ icon, label, count, badge }: { icon?: React.ReactNode; label: string; count?: number; badge?: string }) => (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-[17px] font-semibold text-text-primary tracking-[-0.3px]">{label}</h2>
        {count !== undefined && (
          <span className="px-[7px] py-[1px] bg-brand-live rounded-full text-[11px] font-semibold text-white tabular">{count}</span>
        )}
      </div>
      {badge && <span className="text-[15px] text-brand-primary font-normal">{badge}</span>}
    </div>
  );

  return (
    <div className="space-y-6 px-4 pb-24 pt-3">
      {/* Banner */}
      {!searchQuery && (
        <section><BannerCarousel /></section>
      )}

      {/* Game filter chips */}
      <section>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {GAMES.map(g => {
            const isActive = g === 'All' ? !searchQuery : activeFilter === g;
            return (
              <button
                key={g}
                onClick={() => useMatchStore.getState().setSearchQuery(g === 'All' ? '' : g)}
                className={cn(
                  'px-4 py-[7px] rounded-full text-[14px] font-medium whitespace-nowrap transition-all duration-150 active:opacity-60 shrink-0',
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                    : 'bg-app-elevated text-text-secondary'
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </section>

      {/* Search result context */}
      {searchQuery && (
        <div className="flex items-center justify-between">
          <p className="text-[14px] text-text-secondary">
            Results for <span className="text-text-primary font-medium">"{searchQuery}"</span>
          </p>
          <button onClick={() => useMatchStore.getState().setSearchQuery('')}
            className="text-[14px] text-brand-primary font-normal">Clear</button>
        </div>
      )}

      {/* No results */}
      {searchQuery && !live.length && !upcoming.length && !completed.length && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="py-20 flex flex-col items-center gap-3">
          <p className="text-[17px] font-semibold text-text-primary">No results</p>
          <p className="text-[15px] text-text-secondary text-center">Try a different game or tournament name</p>
        </motion.div>
      )}

      {/* Live Now */}
      {live.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<div className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-live opacity-60"/><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-live"/></div>}
            label="Live Now" count={live.length} badge="See All"
          />
          <div className="space-y-4">
            {live.map((m, i) => (
              <motion.div key={m.match_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <SectionHeader icon={<Zap size={16} className="text-brand-warning fill-brand-warning" />} label="Upcoming" badge="View All" />
          <div className="space-y-4">
            {upcoming.map((m, i) => (
              <motion.div key={m.match_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="space-y-4">
          <SectionHeader icon={<CheckCircle2 size={16} className="text-text-muted" />} label="Recently Finished" badge="History" />
          <div className="space-y-4 opacity-70">
            {completed.map((m, i) => (
              <motion.div key={m.match_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
