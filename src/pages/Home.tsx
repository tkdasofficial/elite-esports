import { useMatchStore } from '@/src/store/matchStore';
import { MatchCard } from '@/src/components/matches/MatchCard';
import { BannerCarousel } from '@/src/components/home/BannerCarousel';
import { Tag } from '@/src/components/ui/Tag';
import { cn } from '@/src/utils/helpers';
import { Search } from 'lucide-react';

export default function Home() {
  const { liveMatches, upcomingMatches, completedMatches, searchQuery } = useMatchStore();
  const now = new Date();

  // Filter logic for admin-controlled visibility and search
  const filterMatches = (matches: any[]) => matches.filter(match => {
    // Admin visibility filters
    if (match.delete_at && new Date(match.delete_at) < now) return false;
    if (match.status === 'completed' && match.show_until && new Date(match.show_until) < now) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        match.title.toLowerCase().includes(query) ||
        match.game_name.toLowerCase().includes(query) ||
        match.prize.toLowerCase().includes(query) ||
        match.mode.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    return true;
  });

  const visibleLive = filterMatches(liveMatches);
  const visibleUpcoming = filterMatches(upcomingMatches);
  const visibleCompleted = filterMatches(completedMatches);

  const hasResults = visibleLive.length > 0 || visibleUpcoming.length > 0 || visibleCompleted.length > 0;

  return (
    <div className="space-y-8 px-6 pb-24">
      {/* Banner Section - Hide when searching */}
      {!searchQuery && (
        <section className="pt-2">
          <BannerCarousel />
        </section>
      )}

      {/* Categories / Quick Actions */}
      <section className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {['All Games', 'PUBG', 'BGMI', 'Free Fire', 'COD', 'Valorant'].map((cat, i) => (
          <button 
            key={cat} 
            onClick={() => {
              if (cat === 'All Games') useMatchStore.getState().setSearchQuery('');
              else useMatchStore.getState().setSearchQuery(cat);
            }}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95",
              (searchQuery === cat || (cat === 'All Games' && !searchQuery)) 
                ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/30" 
                : "bg-brand-card text-slate-400 border border-white/5"
            )}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Results for "{searchQuery}"
          </p>
          <button 
            onClick={() => useMatchStore.getState().setSearchQuery('')}
            className="text-[10px] font-black text-brand-red uppercase tracking-widest"
          >
            Clear
          </button>
        </div>
      )}

      {/* No Results */}
      {searchQuery && !hasResults && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-600">
            <Search size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-lg">No matches found</h3>
            <p className="text-xs text-slate-500 font-bold">Try searching for a different game or mode</p>
          </div>
        </div>
      )}

      {/* Live Matches */}
      {visibleLive.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-xl tracking-tight flex items-center gap-2">
              LIVE NOW
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-red"></span>
              </span>
            </h2>
            <button className="text-xs text-brand-blue font-bold tracking-widest uppercase">See All</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleLive.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {visibleUpcoming.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-xl tracking-tight">UPCOMING</h2>
            <button className="text-xs text-brand-blue font-bold tracking-widest uppercase">Filter</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleUpcoming.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Matches */}
      {visibleCompleted.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-xl tracking-tight text-slate-500">RECENTLY FINISHED</h2>
            <button className="text-xs text-slate-500 font-bold tracking-widest uppercase">History</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-80">
            {visibleCompleted.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

