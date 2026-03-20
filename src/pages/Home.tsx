import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { BannerCarousel } from '@/src/components/home/BannerCarousel';
import { cn } from '@/src/utils/helpers';
import { Search, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const GAMES = ['All', 'PUBG', 'BGMI', 'Free Fire', 'COD', 'Valorant'];

export default function Home() {
  const { liveMatches, upcomingMatches, completedMatches, searchQuery } = useMatchStore();
  const now = new Date();

  const filterMatches = (matches: any[]) =>
    matches.filter((m) => {
      if (m.delete_at && new Date(m.delete_at) < now) return false;
      if (m.status === 'completed' && m.show_until && new Date(m.show_until) < now) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.game_name.toLowerCase().includes(q) ||
          m.prize.toLowerCase().includes(q) ||
          m.mode.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const live = filterMatches(liveMatches);
  const upcoming = filterMatches(upcomingMatches);
  const completed = filterMatches(completedMatches);
  const hasResults = live.length + upcoming.length + completed.length > 0;

  const activeFilter = searchQuery || 'All';

  return (
    <div className="space-y-7 px-4 pb-28">
      {/* Banner */}
      {!searchQuery && (
        <section className="pt-3">
          <BannerCarousel />
        </section>
      )}

      {/* Game filters */}
      <section>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {GAMES.map((g) => {
            const isActive = activeFilter === g || (g === 'All' && !searchQuery);
            return (
              <button
                key={g}
                onClick={() => useMatchStore.getState().setSearchQuery(g === 'All' ? '' : g)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95',
                  isActive
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30'
                    : 'bg-app-card border border-app-border text-text-secondary hover:border-brand-primary/30 hover:text-text-primary'
                )}
              >
                {g}
              </button>
            );
          })}
        </div>
      </section>

      {/* Search context */}
      {searchQuery && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-text-muted">
            Results for <span className="text-text-primary font-semibold">"{searchQuery}"</span>
          </p>
          <button
            onClick={() => useMatchStore.getState().setSearchQuery('')}
            className="text-xs font-semibold text-brand-primary-light hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Empty search */}
      {searchQuery && !hasResults && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-app-card border border-app-border rounded-2xl flex items-center justify-center text-text-muted">
            <Search size={28} />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-base text-text-primary">No results found</p>
            <p className="text-sm text-text-muted font-medium">Try a different game or keyword</p>
          </div>
        </motion.div>
      )}

      {/* Live Now */}
      {live.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-live opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-live" />
              </div>
              <h2 className="text-[15px] font-bold text-text-primary">Live Now</h2>
              <span className="px-2 py-0.5 bg-brand-live/15 text-brand-live text-[10px] font-bold rounded-lg border border-brand-live/25">
                {live.length}
              </span>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-brand-primary-light hover:underline">
              See All <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {live.map((m, i) => (
              <motion.div
                key={m.match_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-brand-warning fill-brand-warning" />
              <h2 className="text-[15px] font-bold text-text-primary">Upcoming</h2>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-brand-primary-light hover:underline">
              Filter <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {upcoming.map((m, i) => (
              <motion.div
                key={m.match_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-text-secondary">Recently Finished</h2>
            <button className="flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text-secondary hover:underline">
              History <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 opacity-75">
            {completed.map((m, i) => (
              <motion.div
                key={m.match_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <MatchCard match={m} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
