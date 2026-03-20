import React from 'react';
import { motion } from 'motion/react';
import { Users, Trophy, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/utils/helpers';
import { Match, MatchStatus } from '@/src/types';

interface MatchCardProps {
  match: Match;
}

const StatusBadge = ({ status }: { status: MatchStatus }) => {
  const cfg = {
    live: {
      label: 'LIVE',
      cls: 'bg-brand-live/15 text-brand-live border-brand-live/30',
      dot: 'bg-brand-live animate-pulse',
    },
    upcoming: {
      label: 'UPCOMING',
      cls: 'bg-brand-warning/15 text-brand-warning border-brand-warning/30',
      dot: 'bg-brand-warning',
    },
    completed: {
      label: 'ENDED',
      cls: 'bg-text-muted/10 text-text-secondary border-text-muted/20',
      dot: 'bg-text-muted',
    },
  };
  const c = cfg[status];
  return (
    <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-md', c.cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  );
};

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const navigate = useNavigate();
  const slotsLeft = match.slots_total - match.slots_filled;
  const isFull = slotsLeft <= 0;
  const fillPct = Math.min((match.slots_filled / match.slots_total) * 100, 100);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.005 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="cursor-pointer group"
      onClick={() => navigate(`/match/${match.match_id}`)}
    >
      <div className="rounded-2xl overflow-hidden border border-app-border bg-app-card hover:border-brand-primary/30 transition-colors duration-300 shadow-lg shadow-black/30">
        {/* Banner */}
        <div className="relative aspect-[16/8] overflow-hidden">
          <img
            src={match.banner_image}
            alt={match.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-app-card via-app-card/30 to-transparent" />

          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-brand-primary/90 backdrop-blur-md text-white text-[10px] font-bold rounded-lg border border-brand-primary/50">
              {match.game_name}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <StatusBadge status={match.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-[15px] font-bold text-text-primary leading-snug line-clamp-1 -mt-1">
              {match.title}
            </h3>
            <p className="text-xs text-text-muted font-medium mt-0.5">{match.mode}</p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-brand-success font-semibold">
              <Trophy size={12} />
              <span>{match.prize}</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary font-medium">
              <Clock size={12} />
              <span>{match.start_time}</span>
            </div>
          </div>

          {/* Slots progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users size={11} className="text-text-muted" />
                <span className={cn('text-[11px] font-semibold', isFull ? 'text-brand-live' : 'text-text-secondary')}>
                  {isFull ? 'Slots Full' : `${slotsLeft} slots left`}
                </span>
              </div>
              <span className="text-[11px] font-medium text-text-muted">
                {match.slots_filled}/{match.slots_total}
              </span>
            </div>
            <div className="h-1 bg-app-elevated rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  isFull
                    ? 'bg-brand-live'
                    : fillPct > 75
                    ? 'bg-brand-warning'
                    : 'bg-brand-primary'
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted font-medium">Entry:</span>
              <span className="text-[13px] font-bold text-text-primary">{match.entry_fee}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/match/${match.match_id}`); }}
              className="px-4 py-1.5 bg-brand-primary/15 hover:bg-brand-primary text-brand-primary-light hover:text-white text-[11px] font-semibold rounded-xl border border-brand-primary/30 hover:border-brand-primary transition-all duration-200"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
