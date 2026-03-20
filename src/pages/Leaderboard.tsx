import { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Tag } from '@/src/components/ui/Tag';
import { motion } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';

export default function Leaderboard() {
  const [activeFilter, setActiveFilter] = useState<'Daily' | 'Weekly' | 'All-Time'>('Daily');

  const getRankings = () => {
    const baseRankings = [
      { id: '1', username: 'ShadowSlayer', rank: '1', points: '12,450', avatar: 'https://picsum.photos/seed/1/100', trend: 'up' },
      { id: '2', username: 'EsportsPro', rank: '2', points: '11,200', avatar: 'https://picsum.photos/seed/avatar/100', trend: 'down' },
      { id: '3', username: 'NinjaX', rank: '3', points: '10,800', avatar: 'https://picsum.photos/seed/3/100', trend: 'up' },
      { id: '4', username: 'GhostRider', rank: '4', points: '9,500', avatar: 'https://picsum.photos/seed/4/100', trend: 'stable' },
      { id: '5', username: 'ViperKing', rank: '5', points: '8,900', avatar: 'https://picsum.photos/seed/5/100', trend: 'up' },
      { id: '6', username: 'AceHunter', rank: '6', points: '8,200', avatar: 'https://picsum.photos/seed/6/100', trend: 'down' },
    ];

    if (activeFilter === 'Weekly') {
      return baseRankings.map(r => ({
        ...r,
        points: (parseInt(r.points.replace(',', '')) * 7).toLocaleString(),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }));
    }

    if (activeFilter === 'All-Time') {
      return baseRankings.map(r => ({
        ...r,
        points: (parseInt(r.points.replace(',', '')) * 30).toLocaleString(),
        trend: 'stable'
      }));
    }

    return baseRankings;
  };

  const rankings = getRankings();
  const filters = ['Daily', 'Weekly', 'All-Time'] as const;

  return (
    <div className="px-4 sm:px-6 space-y-8 pb-24">
      {/* Top 3 Podium */}
      <section className="pt-12 flex items-end justify-center gap-2 sm:gap-4 min-h-[280px]">
        {/* Rank 2 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <LetterAvatar name={rankings[1].username} size="lg" className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-slate-400 shadow-xl" />
            <div className="absolute -bottom-1 -right-1 bg-slate-400 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">2</div>
          </div>
          <div className="bg-slate-400/10 w-16 h-20 sm:w-20 sm:h-24 rounded-t-3xl flex items-center justify-center border-t border-x border-white/5">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">2nd</span>
          </div>
        </div>

        {/* Rank 1 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <LetterAvatar name={rankings[0].username} size="xl" className="w-20 h-20 sm:w-28 sm:h-28 border-4 border-brand-yellow shadow-2xl shadow-brand-yellow/20" />
            <div className="absolute -bottom-1 -right-1 bg-brand-yellow text-black w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg">1</div>
          </div>
          <div className="bg-brand-yellow/10 w-20 h-28 sm:w-24 sm:h-36 rounded-t-3xl flex items-center justify-center border-t border-x border-white/5">
            <span className="text-xs sm:text-sm font-black text-brand-yellow uppercase tracking-widest">1st</span>
          </div>
        </div>

        {/* Rank 3 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <LetterAvatar name={rankings[2].username} size="lg" className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-orange-600 shadow-xl" />
            <div className="absolute -bottom-1 -right-1 bg-orange-600 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">3</div>
          </div>
          <div className="bg-orange-600/10 w-16 h-16 sm:w-20 sm:h-20 rounded-t-3xl flex items-center justify-center border-t border-x border-white/5">
            <span className="text-[10px] sm:text-xs font-black text-orange-600 uppercase tracking-widest">3rd</span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "flex-1 text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl transition-all active:scale-95",
              activeFilter === filter 
                ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                : "bg-brand-card text-slate-500 border border-white/5"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* List */}
      <section className="space-y-3">
        {rankings.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4 flex items-center justify-between bg-brand-card/40 border-none shadow-lg">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-slate-600 w-5">{player.rank}</span>
                <LetterAvatar name={player.username} size="md" className="rounded-2xl" />
                <div>
                  <p className="text-sm font-black tracking-tight">{player.username}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{player.points} Points</p>
                </div>
              </div>
              <div className={cn(
                "text-[10px] font-black px-3 py-1 rounded-xl",
                player.trend === 'up' ? "text-brand-green bg-brand-green/10" : 
                player.trend === 'down' ? "text-brand-red bg-brand-red/10" : "text-slate-500 bg-slate-500/10"
              )}>
                {player.trend === 'up' ? '▲' : player.trend === 'down' ? '▼' : '●'}
              </div>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
}

