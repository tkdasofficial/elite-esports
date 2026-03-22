import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { TrendingUp, Minus, Crown, Trophy } from 'lucide-react';
import { usePlatformStore } from '@/src/store/platformStore';
import { useMatchStore } from '@/src/store/matchStore';

const FILTERS = ['Rankings', 'Tournaments'] as const;
type Filter = typeof FILTERS[number];

const podiumOrder = [
  { pos: 1, ring: 'border-brand-gold',   medal: '#FFD60A', crown: true,  h: 'h-20 sm:h-24 md:h-28', avatarSz: 'w-16 h-16 sm:w-20 sm:h-20 text-2xl' },
  { pos: 2, ring: 'border-app-elevated', medal: '#8E8E93', crown: false, h: 'h-16 sm:h-20 md:h-24', avatarSz: 'w-14 h-14 sm:w-16 sm:h-16 text-xl' },
  { pos: 3, ring: 'border-[#FF9F0A]',    medal: '#FF9F0A', crown: false, h: 'h-12 sm:h-16 md:h-20', avatarSz: 'w-12 h-12 sm:w-14 sm:h-14 text-lg' },
];

const RANK_COLORS = ['', '#FFD60A', '#8E8E93', '#FF9F0A'] as const;
const RANK_BG    = ['', '#FFD60A15', '#8E8E9315', '#FF9F0A15'] as const;
const RANK_EMOJI = ['', '🥇', '🥈', '🥉'] as const;

export default function Leaderboard() {
  const { registeredUsers } = usePlatformStore();
  const { completedMatches } = useMatchStore();
  const [filter, setFilter] = useState<Filter>('Tournaments');

  const sorted = [...registeredUsers]
    .filter(u => u.status === 'active')
    .sort((a, b) => b.coins - a.coins);

  const top3 = sorted.slice(0, 3);
  const rest  = sorted.slice(3);

  const matchesWithWinners = completedMatches
    .filter(m => m.winners && Object.keys(m.winners).length > 0)
    .sort((a, b) => {
      const aTime = a.completed_at ?? a.start_time;
      const bTime = b.completed_at ?? b.start_time;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pb-28 space-y-5">

        {/* Page Title */}
        <div className="pt-5 pb-1">
          <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary tracking-tight">Leaderboard</h1>
          <p className="text-[13px] sm:text-[14px] text-text-muted mt-0.5">Top players &amp; tournament results</p>
        </div>

        {/* Filter Toggle */}
        <div className="bg-app-elevated rounded-full p-1 flex">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                'flex-1 py-2.5 rounded-full text-[14px] sm:text-[15px] font-medium transition-all duration-200 active:opacity-70',
                filter === f ? 'bg-app-card text-text-primary shadow-sm' : 'text-text-muted'
              )}>
              {f}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {filter === 'Rankings' && (
            <motion.div
              key="rankings"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              {sorted.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-app-card rounded-[28px] flex items-center justify-center">
                    <Trophy size={36} className="text-text-muted" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[17px] sm:text-[19px] font-semibold text-text-primary">No Rankings Yet</p>
                    <p className="text-[14px] sm:text-[15px] text-text-secondary font-normal max-w-xs">Leaderboard will update as players compete</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Podium — full 3 players */}
                  {top3.length >= 3 && (
                    <section className="pt-6 pb-2">
                      <div className="flex items-end justify-center gap-3 sm:gap-6 md:gap-10">
                        {[podiumOrder[1], podiumOrder[0], podiumOrder[2]].map((cfg, idx) => {
                          const player = top3[cfg.pos - 1];
                          if (!player) return null;
                          return (
                            <motion.div key={cfg.pos}
                              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                              className="flex flex-col items-center gap-2 flex-1 max-w-[110px] sm:max-w-[140px]">
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
                              <div className="text-center w-full px-1">
                                <p className="text-[12px] sm:text-[13px] font-medium text-text-primary truncate leading-tight">{player.username}</p>
                                <p className="text-[11px] sm:text-[12px] text-text-muted tabular font-normal">₹{player.coins.toLocaleString()}</p>
                              </div>
                              <div className={cn('w-full rounded-t-[12px] flex items-center justify-center', cfg.h)}
                                style={{ background: `${cfg.medal}15`, border: `1px solid ${cfg.medal}30` }}>
                                <span className="text-[13px] sm:text-[14px] font-semibold" style={{ color: cfg.medal }}>#{cfg.pos}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Partial top list (< 3 players) */}
                  {top3.length > 0 && top3.length < 3 && (
                    <section className="pt-4">
                      <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
                        {top3.map((player, i) => (
                          <motion.div key={player.id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-4 px-4 py-3.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-black shrink-0"
                              style={{ background: RANK_BG[i + 1], color: RANK_COLORS[i + 1] }}>
                              {i + 1}
                            </div>
                            <LetterAvatar name={player.username} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[16px] font-normal text-text-primary truncate">{player.username}</p>
                              <p className="text-[13px] text-text-muted font-normal tabular">₹{player.coins.toLocaleString()} coins</p>
                            </div>
                            <TrendingUp size={14} className="text-brand-success shrink-0" />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Rest of players */}
                  {rest.length > 0 && (
                    <section>
                      <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
                        <AnimatePresence>
                          {rest.map((player, i) => (
                            <motion.div key={player.id}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                              className="flex items-center gap-4 px-4 py-3.5 active:bg-app-elevated transition-colors">
                              <span className="w-7 text-[15px] font-medium text-text-muted text-center tabular shrink-0">{i + 4}</span>
                              <LetterAvatar name={player.username} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[16px] font-normal text-text-primary truncate">{player.username}</p>
                                <p className="text-[13px] text-text-muted font-normal tabular">₹{player.coins.toLocaleString()} coins</p>
                              </div>
                              <Minus size={14} className="text-text-muted shrink-0" />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </section>
                  )}
                </>
              )}
            </motion.div>
          )}

          {filter === 'Tournaments' && (
            <motion.div
              key="tournaments"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {matchesWithWinners.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-app-card rounded-[28px] flex items-center justify-center">
                    <Trophy size={36} className="text-text-muted" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[17px] sm:text-[19px] font-semibold text-text-primary">No Results Yet</p>
                    <p className="text-[14px] sm:text-[15px] text-text-secondary font-normal px-6 max-w-xs">Tournament winners will appear here once matches are completed</p>
                  </div>
                </div>
              ) : (
                matchesWithWinners.map((match, mi) => {
                  const w = match.winners!;
                  const podium = [
                    { pos: 2, player: w.second, color: '#8E8E93', bg: '#8E8E9315', h: 'h-[60px] sm:h-[72px]', sz: 'w-12 h-12 sm:w-14 sm:h-14', ring: 'border-[#8E8E93]' },
                    { pos: 1, player: w.first,  color: '#FFD60A', bg: '#FFD60A15', h: 'h-[80px] sm:h-[96px]', sz: 'w-14 h-14 sm:w-16 sm:h-16', ring: 'border-brand-gold', crown: true },
                    { pos: 3, player: w.third,  color: '#FF9F0A', bg: '#FF9F0A15', h: 'h-[44px] sm:h-[56px]', sz: 'w-11 h-11 sm:w-12 sm:h-12', ring: 'border-[#FF9F0A]' },
                  ];
                  return (
                    <motion.div
                      key={match.match_id}
                      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mi * 0.08 }}
                      className="bg-app-card rounded-[20px] overflow-hidden"
                    >
                      {/* Banner */}
                      <div className="relative h-[88px] sm:h-[110px] overflow-hidden">
                        <img src={match.banner_image} alt={match.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
                        <div className="absolute inset-0 px-4 flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-brand-primary/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <Trophy size={16} className="text-brand-primary-light" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] sm:text-[16px] font-semibold text-white truncate leading-tight">{match.title}</p>
                            <p className="text-[12px] sm:text-[13px] text-white/60 font-normal">{match.game_name} · {match.mode}</p>
                          </div>
                          <span className="px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[11px] sm:text-[12px] font-medium text-white/80 shrink-0">
                            {match.prize}
                          </span>
                        </div>
                      </div>

                      {/* Mini Podium */}
                      <div className="px-4 pb-5 pt-5 flex items-end justify-center gap-4 sm:gap-8">
                        {podium.map(({ pos, player, color, bg, h, sz, ring, crown }) => {
                          if (!player) {
                            return (
                              <div key={pos} className="flex flex-col items-center gap-2 opacity-30 flex-1 max-w-[80px] sm:max-w-[100px]">
                                <div className={cn('rounded-full border-2 border-dashed border-app-border bg-app-elevated flex items-center justify-center text-text-muted', sz)}>
                                  <span className="text-[11px]">?</span>
                                </div>
                                <p className="text-[11px] text-text-muted">#{pos}</p>
                                <div className={cn('w-full rounded-t-[10px]', h)} style={{ background: '#ffffff08' }} />
                              </div>
                            );
                          }
                          return (
                            <motion.div
                              key={pos}
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mi * 0.08 + pos * 0.06 }}
                              className="flex flex-col items-center gap-1.5 flex-1 max-w-[80px] sm:max-w-[100px]"
                            >
                              <div className="relative">
                                {crown && (
                                  <Crown size={18} fill="#FFD60A" className="absolute -top-6 left-1/2 -translate-x-1/2 text-brand-gold" />
                                )}
                                <div className={cn('rounded-full border-2 overflow-hidden', sz, ring)}>
                                  <LetterAvatar name={player.username} size={pos === 1 ? 'md' : 'sm'} className="w-full h-full" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-app-card shadow-sm text-black"
                                  style={{ background: color }}>
                                  {pos}
                                </div>
                              </div>
                              <p className="text-[11px] sm:text-[12px] font-medium text-text-primary truncate w-full text-center leading-tight">{player.username}</p>
                              <div className={cn('w-full rounded-t-[10px] flex items-center justify-center', h)}
                                style={{ background: bg, border: `1px solid ${color}30` }}>
                                <span className="text-[12px] font-semibold" style={{ color }}>{RANK_EMOJI[pos]}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
