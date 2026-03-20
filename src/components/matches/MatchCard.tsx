import React from 'react';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/utils/helpers';
import { Match, MatchStatus } from '@/src/types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface MatchCardProps {
  match: Match;
}

const StatusTag = ({ status }: { status: MatchStatus }) => {
  const configs = {
    live: {
      label: 'Live',
      className: 'bg-brand-red text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      dot: 'bg-white animate-pulse'
    },
    upcoming: {
      label: 'Upcoming',
      className: 'bg-brand-yellow text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]',
      dot: 'bg-black'
    },
    completed: {
      label: 'Completed',
      className: 'bg-slate-600 text-white',
      dot: 'bg-slate-300'
    }
  };

  const config = configs[status];

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 h-[17px] rounded-md text-[10px] font-black uppercase tracking-tighter transition-all duration-300 leading-none",
      config.className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </div>
  );
};

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const navigate = useNavigate();
  const slotsLeft = match.slots_total - match.slots_filled;
  const isFull = slotsLeft <= 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative group cursor-pointer"
      onClick={() => navigate(`/match/${match.match_id}`)}
    >
      <Card className="overflow-hidden bg-brand-card/40 border-white/5 shadow-2xl hover:shadow-brand-blue/10 transition-all duration-300">
        {/* Banner Image (16:9) */}
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={match.banner_image} 
            alt={match.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent opacity-90" />
          
          {/* Top Left: Game Name */}
          <div className="absolute top-[5px] left-[5px] flex items-center gap-2">
            <div className="px-3 h-[17px] flex items-center bg-brand-blue text-white rounded-md shadow-lg shadow-brand-blue/20">
              <span className="text-[10px] font-black uppercase tracking-tighter leading-none">{match.game_name}</span>
            </div>
          </div>

          {/* Top Right: Status Tag */}
          <div className="absolute top-[5px] right-[5px]">
            <StatusTag status={match.status} />
          </div>
        </div>

        {/* Card Content Overlay */}
        <div className="p-5 space-y-4 relative -mt-12">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight text-white line-clamp-1 drop-shadow-md">
              {match.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Users size={12} />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isFull ? "text-brand-red" : "text-brand-green"
                )}>
                  {isFull ? 'Slots Full' : `${slotsLeft} Slots Available`}
                </span>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                className="px-4 h-8 text-[9px] font-black uppercase tracking-widest rounded-lg bg-white/5 border-white/5 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/match/${match.match_id}`);
                }}
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
