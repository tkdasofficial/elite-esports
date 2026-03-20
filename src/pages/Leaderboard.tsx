import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react';

const BASE = [
  { id:'1', username:'ShadowSlayer', points:12450, trend:'up'   as const },
  { id:'2', username:'EsportsPro',   points:11200, trend:'down' as const },
  { id:'3', username:'NinjaX',       points:10800, trend:'up'   as const },
  { id:'4', username:'GhostRider',   points:9500,  trend:'neutral' as const },
  { id:'5', username:'ViperKing',    points:8900,  trend:'up'   as const },
  { id:'6', username:'AceHunter',    points:8200,  trend:'down' as const },
  { id:'7', username:'DarkPhoenix',  points:7600,  trend:'up'   as const },
  { id:'8', username:'StormBreaker', points:7100,  trend:'neutral' as const },
];

const FILTERS = ['Daily','Weekly','All-Time'] as const;
type Filter = typeof FILTERS[number];

const multiplier: Record<Filter, number> = { Daily:1, Weekly:7, 'All-Time':30 };

export default function Leaderboard() {
  const [filter, setFilter] = useState<Filter>('Daily');

  const rankings = BASE.map(p => ({
    ...p,
    points: Math.round(p.points * multiplier[filter]),
  })).sort((a,b) => b.points - a.points);

  const top3 = rankings.slice(0,3);
  const rest  = rankings.slice(3);

  const TrendIcon = ({ t }: { t: 'up'|'down'|'neutral' }) =>
    t==='up'   ? <TrendingUp  size={13} className="text-brand-success" /> :
    t==='down' ? <TrendingDown size={13} className="text-brand-live"    /> :
                 <Minus        size={13} className="text-text-muted"    />;

  const podiumCfg = [
    { pos:1, size:'w-20 h-20', barH:'h-[90px]', ring:'ring-brand-gold', barBg:'bg-brand-gold/12', label:'1st', labelColor:'text-brand-gold', crown:true },
    { pos:2, size:'w-16 h-16', barH:'h-[68px]', ring:'ring-slate-400',  barBg:'bg-slate-400/10',  label:'2nd', labelColor:'text-slate-400', crown:false },
    { pos:3, size:'w-14 h-14', barH:'h-[52px]', ring:'ring-orange-500', barBg:'bg-orange-500/10', label:'3rd', labelColor:'text-orange-500', crown:false },
  ];

  const order = [podiumCfg[1], podiumCfg[0], podiumCfg[2]];

  return (
    <div className="px-4 pb-28 space-y-7">
      {/* Podium */}
      <section className="pt-8 flex items-end justify-center gap-3">
        {order.map((cfg, idx) => {
          const player = rankings[cfg.pos - 1];
          if (!player) return null;
          return (
            <motion.div
              key={cfg.pos}
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: idx*0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="relative">
                {cfg.crown && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-brand-gold">
                    <Crown size={18} fill="currentColor" />
                  </div>
                )}
                <LetterAvatar
                  name={player.username}
                  size="lg"
                  className={cn(cfg.size, `ring-2 ${cfg.ring} shadow-xl`)}
                />
                <div className={cn('absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow',
                  cfg.pos===1 ? 'bg-brand-gold' : cfg.pos===2 ? 'bg-slate-400' : 'bg-orange-500')}>
                  {cfg.pos}
                </div>
              </div>
              <div className="text-center w-full max-w-[72px]">
                <p className="text-[11px] font-bold text-text-primary leading-tight truncate">{player.username}</p>
                <p className="text-[10px] font-semibold text-text-muted">{player.points.toLocaleString()}</p>
              </div>
              <div className={cn('w-full rounded-t-2xl flex items-center justify-center border border-white/5', cfg.barH, cfg.barBg)}>
                <span className={cn('text-xs font-black', cfg.labelColor)}>{cfg.label}</span>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Filters */}
      <div className="flex gap-2.5 bg-app-card border border-app-border rounded-2xl p-1.5">
        {FILTERS.map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            className={cn('flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200',
              filter===f ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25' : 'text-text-secondary hover:text-text-primary')}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <section className="space-y-2.5">
        <AnimatePresence>
          {rest.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity:0, x:-12 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i*0.05 }}
              className="flex items-center gap-4 bg-app-card border border-app-border rounded-2xl p-4"
            >
              <span className="w-7 text-sm font-bold text-text-muted text-center">{i+4}</span>
              <LetterAvatar name={player.username} size="md" className="rounded-xl" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{player.username}</p>
                <p className="text-xs text-text-muted font-medium">{player.points.toLocaleString()} pts</p>
              </div>
              <TrendIcon t={player.trend} />
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </div>
  );
}
