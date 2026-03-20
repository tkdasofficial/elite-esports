import React from 'react';
import { motion } from 'motion/react';
import { Users, Trophy, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/utils/helpers';
import { Match, MatchStatus } from '@/src/types';

interface MatchCardProps { match: Match; }

const StatusBadge = ({ status }: { status: MatchStatus }) => {
  const cfg = {
    live:      { label: '● LIVE',     cls: 'text-brand-live',    bg: 'bg-brand-live/15' },
    upcoming:  { label: 'UPCOMING',   cls: 'text-brand-warning', bg: 'bg-brand-warning/12' },
    completed: { label: 'ENDED',      cls: 'text-text-muted',    bg: 'bg-ios-fill' },
  };
  const c = cfg[status];
  return (
    <span className={cn('px-2 py-[3px] rounded-[6px] text-[11px] font-semibold', c.cls, c.bg)}>
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
      whileTap={{ scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="cursor-pointer"
      onClick={() => navigate(`/match/${match.match_id}`)}
    >
      <div className="rounded-[18px] overflow-hidden bg-app-card">
        {/* Banner image */}
        <div className="relative aspect-[16/8] overflow-hidden">
          <img
            src={match.banner_image}
            alt={match.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Game badge */}
          <div className="absolute top-2.5 left-3">
            <span className="px-2 py-[3px] rounded-[7px] bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/15">
              {match.game_name}
            </span>
          </div>

          {/* Status badge */}
          <div className="absolute top-2.5 right-3">
            <StatusBadge status={match.status} />
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <h3 className="text-[16px] font-semibold text-white leading-tight line-clamp-1 tracking-[-0.3px]">
              {match.title}
            </h3>
            <p className="text-[12px] text-white/55 mt-0.5 font-medium">{match.mode}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-3 space-y-3">
          {/* Meta row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Trophy size={13} className="text-brand-success" />
              <span className="text-[13px] font-semibold text-brand-success">{match.prize}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-text-muted" />
              <span className="text-[13px] text-text-secondary font-medium">{match.start_time}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Users size={12} className="text-text-muted" />
              <span className={cn('text-[12px] font-medium', isFull ? 'text-brand-live' : 'text-text-secondary')}>
                {isFull ? 'Full' : `${slotsLeft} left`}
              </span>
            </div>
          </div>

          {/* Slot progress */}
          <div className="space-y-1">
            <div className="h-1 bg-app-elevated rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className={cn('h-full rounded-full', isFull ? 'bg-brand-live' : fillPct > 75 ? 'bg-brand-warning' : 'bg-brand-primary')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-muted font-medium">Entry {match.entry_fee}</span>
              <span className="text-[11px] text-text-muted font-medium">{match.slots_filled}/{match.slots_total} joined</span>
            </div>
          </div>

          {/* Footer CTA */}
          <button
            onClick={e => { e.stopPropagation(); navigate(`/match/${match.match_id}`); }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] bg-brand-primary/12 active:opacity-60 transition-opacity"
          >
            <span className="text-[14px] font-semibold text-brand-primary-light">View Details</span>
            <ChevronRight size={14} className="text-brand-primary-light" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
