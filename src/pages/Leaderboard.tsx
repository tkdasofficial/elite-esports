import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { TrendingUp, Minus, Crown, Trophy } from 'lucide-react';
import { usePlatformStore } from '@/src/store/platformStore';

const FILTERS = ['Daily', 'Weekly', 'All-Time'] as const;
type Filter = typeof FILTERS[number];

const podiumOrder = [
  { pos: 1, ring: 'border-brand-gold',   medal: '#FFD60A', crown: true,  h: 'h-[88px]', avatarSz: 'w-[68px] h-[68px] text-2xl' },
  { pos: 2, ring: 'border-app-elevated', medal: '#8E8E93', crown: false, h: 'h-[68px]', avatarSz: 'w-[56px] h-[56px] text-xl' },
  { pos: 3, ring: 'border-[#FF9F0A]',    medal: '#FF9F0A', crown: false, h: 'h-[52px]', avatarSz: 'w-[48px] h-[48px] text-lg' },
];

export default function Leaderboard() {
  const { registeredUsers } = usePlatformStore();
  const [filter, setFilter] = useState<Filter>('All-Time');

  const sorted = [...registeredUsers]
    .filter(u => u.status === 'active')
    .sort((a, b) => b.coins - a.coins);

  const top3 = sorted.slice(0, 3);
  const rest  = sorted.slice(3);

  if (sorted.length === 0) {
    return (
      <div className="px-4 pb-24 pt-8">
        <div className="flex gap-2 mb-6 bg-app-elevated rounded-full p-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('flex-1 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 active:opacity-70',
                filter === f ? 'bg-app-card text-text-primary shadow-sm' : 'text-text-muted')}>
              {f}
            </button>
          ))}
        </div>
        <div className="py-20 flex flex-col items-center gap-4 text-center">
          <div className="w-[88px] h-[88px] bg-app-card rounded-[28px] flex items-center justify-center">
            <Trophy size={36} className="text-text-muted" />
          </div>
          <div className="space-y-1">
            <p className="text-[17px] font-semibold text-text-primary">No Rankings Yet</p>
            <p className="text-[15px] text-text-secondary font-normal">Leaderboard will update as players compete</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 space-y-6">
      {top3.length >= 3 && (
        <section className="pt-8 flex items-end justify-center gap-4">
          {[podiumOrder[1], podiumOrder[0], podiumOrder[2]].map((cfg, idx) => {
            const player = top3[cfg.pos - 1];
            if (!player) return null;
            return (
              <motion.div key={cfg.pos}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-2">
                <div className="relative">
                  {cfg.crown && (
                    <Crown size={22} fill="#FFD60A" className="absolute -top-7 left-1/2 -translate-x-1/2 text-brand-gold" />
                  )}
                  <div className={cn('rounded-full border-2 overflow-hidden flex items-center justify-center', cfg.ring, cfg.avatarSz)}>
                    <LetterAvatar name={player.username} size={cfg.pos === 1 ? 'lg' : 'md'} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-app-bg text-black shadow-md"
                    style={{ background: cfg.medal }}>
                    {cfg.pos}
                  </div>
                </div>
                <div className="text-center max-w-[72px]">
                  <p className="text-[12px] font-medium text-text-primary truncate leading-tight">{player.username}</p>
                  <p className="text-[11px] text-text-muted tabular font-normal">₹{player.coins.toLocaleString()}</p>
                </div>
                <div className={cn('w-full rounded-t-[12px] flex items-center justify-center', cfg.h)}
                  style={{ background: `${cfg.medal}15`, border: `1px solid ${cfg.medal}30` }}>
                  <span className="text-[13px] font-semibold" style={{ color: cfg.medal }}>
                    #{cfg.pos}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </section>
      )}

      {top3.length > 0 && top3.length < 3 && (
        <section className="pt-4">
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            {top3.map((player, i) => (
              <motion.div key={player.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-black"
                  style={{ background: [, '#FFD60A15', '#8E8E9315', '#FF9F0A15'][i + 1], color: [, '#FFD60A', '#8E8E93', '#FF9F0A'][i + 1] }}>
                  {i + 1}
                </div>
                <LetterAvatar name={player.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-normal text-text-primary truncate">{player.username}</p>
                  <p className="text-[13px] text-text-muted font-normal tabular">₹{player.coins.toLocaleString()} coins</p>
                </div>
                <TrendingUp size={14} className="text-brand-success" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-app-elevated rounded-full p-1 flex">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('flex-1 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 active:opacity-70',
              filter === f ? 'bg-app-card text-text-primary shadow-sm' : 'text-text-muted')}>
            {f}
          </button>
        ))}
      </div>

      {rest.length > 0 && (
        <section>
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <AnimatePresence>
              {rest.map((player, i) => (
                <motion.div key={player.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors">
                  <span className="w-6 text-[15px] font-medium text-text-muted text-center tabular shrink-0">{i + 4}</span>
                  <LetterAvatar name={player.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-normal text-text-primary truncate">{player.username}</p>
                    <p className="text-[13px] text-text-muted font-normal tabular">₹{player.coins.toLocaleString()} coins</p>
                  </div>
                  <Minus size={14} className="text-text-muted" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}
    </div>
  );
}
