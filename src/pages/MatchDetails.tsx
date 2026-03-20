import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Users, Clock, Coins, ShieldCheck, Share2, Info, UserCheck } from 'lucide-react';
import { useMatchStore } from '@/src/store/matchStore';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { cn } from '@/src/utils/helpers';

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMatchById } = useMatchStore();
  const { user, joinedMatchIds, joinMatch, leaveMatch } = useUserStore();
  
  const match = getMatchById(id || '');
  const isJoined = joinedMatchIds.includes(id || '');

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4 px-6">
        <p className="text-slate-500 font-bold text-center">Match not found or has been removed.</p>
        <Button onClick={() => navigate('/')}>Go Back Home</Button>
      </div>
    );
  }

  const isJoinable = match.status !== 'completed';
  const slotsLeft = match.slots_total - match.slots_filled;
  const isFull = slotsLeft <= 0;

  const handleAction = () => {
    if (isJoined) {
      leaveMatch(match.match_id);
    } else {
      joinMatch(match.match_id);
    }
  };

  // Mock joined players
  const mockPlayers = [
    { id: '2', username: 'GamerX', rank: 'Platinum' },
    { id: '3', username: 'ShadowNinja', rank: 'Gold' },
    { id: '4', username: 'AcePlayer', rank: 'Diamond' },
  ];

  const allJoinedPlayers = isJoined ? [user, ...mockPlayers] : mockPlayers;

  const matchTerms = [
    "Participants must be at least 16 years old.",
    "Stable internet connection is required for competitive play.",
    "Match results must be screenshotted and uploaded within 15 minutes of completion.",
    "Any form of toxicity or unsportsmanlike behavior will lead to disqualification.",
    "Tournament organizers' decisions are final in all disputes."
  ];

  return (
    <div className="pb-32">
      {/* Header Image - Responsive Aspect Ratio */}
      <div className="relative w-full aspect-video sm:aspect-[21/9] max-h-[400px] overflow-hidden">
        <img 
          src={match.banner_image} 
          alt={match.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent" />
        
        {/* Top Controls */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex justify-between items-center">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white hover:bg-black/60 transition-colors">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Content Container - Responsive Padding */}
      <div className="px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-10 space-y-6 max-w-4xl mx-auto">
        <Card className="p-5 sm:p-8 bg-brand-card border-white/5 shadow-2xl space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 h-[12px] flex items-center justify-center bg-brand-blue text-white text-[8px] font-black rounded uppercase tracking-tighter shadow-lg shadow-brand-blue/20 leading-none">
                {match.game_name}
              </span>
              <span className="px-2 h-[12px] flex items-center justify-center bg-brand-yellow text-black text-[8px] font-black rounded uppercase tracking-tighter shadow-lg shadow-brand-yellow/20 leading-none">
                {match.mode}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {match.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bold">
              Organized by Elite Esports • Verified Tournament
            </p>
          </div>

          {/* Stats Grid - Responsive Columns */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 py-6 border-y border-white/5">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Trophy size={18} className="text-brand-green sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prize Pool</span>
              <span className="text-xs sm:text-lg font-black text-brand-green">{match.prize}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 border-x border-white/5 text-center">
              <Coins size={18} className="text-brand-yellow sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry Fee</span>
              <span className="text-xs sm:text-lg font-black">{match.entry_fee}</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Clock size={18} className="text-brand-blue sm:w-6 sm:h-6" />
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Time</span>
              <span className="text-xs sm:text-lg font-black">{match.start_time}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {allJoinedPlayers.slice(0, 4).map((p, i) => (
                  <LetterAvatar 
                    key={p?.id || i}
                    name={p?.username || 'P'}
                    size="sm"
                    variant={i % 2 === 0 ? 'blue' : 'green'}
                    className="border-2 border-brand-card"
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                {match.slots_filled + (isJoined ? 1 : 0)} players already joined
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className={cn(
                "text-[8px] sm:text-[9px] font-black uppercase tracking-tighter px-2 h-[12px] flex items-center justify-center rounded transition-all leading-none",
                isFull && !isJoined 
                  ? "bg-brand-red text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                  : "bg-brand-green text-white shadow-[0_0_10px_rgba(34,197,94,0.2)]"
              )}>
                {isFull && !isJoined ? 'Tournament Full' : `${slotsLeft - (isJoined ? -1 : 0)} Slots Remaining`}
              </span>
            </div>
          </div>
        </Card>

        {/* Joined Players Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">JOINED PLAYERS</h2>
            <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{allJoinedPlayers.length} / {match.slots_total}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allJoinedPlayers.map((p) => (
              <Card key={p?.id} className="p-3 bg-brand-card/40 border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LetterAvatar name={p?.username || 'P'} size="sm" variant="slate" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-white">{p?.username}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{p?.rank}</p>
                  </div>
                </div>
                {p?.id === user?.id && (
                  <div className="px-2 py-1 bg-brand-blue/10 rounded-lg flex items-center gap-1.5">
                    <UserCheck size={10} className="text-brand-blue" />
                    <span className="text-[8px] font-black text-brand-blue uppercase tracking-widest">You</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Terms Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase px-1">TOURNAMENT TERMS</h2>
          <Card className="p-6 bg-brand-card/40 border-white/5 space-y-4 rounded-[32px]">
            {matchTerms.map((term, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-slate-500">{i + 1}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{term}</p>
              </div>
            ))}
          </Card>
        </section>

        {/* Rules Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase px-1">GENERAL RULES</h2>
          <Card className="p-6 sm:p-8 bg-brand-card/40 border-white/5 space-y-6 rounded-[32px]">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-brand-blue" size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-white">Anti-Cheat System</p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  We use advanced detection. Any use of hacks, scripts, or third-party tools will result in an immediate permanent ban and forfeiture of all prizes.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center shrink-0">
                <Users className="text-brand-green" size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-white">Match Format & Scoring</p>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Best of 3 series. Points will be awarded based on placement and kills as per official tournament guidelines. Results will be updated within 30 mins.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* Bottom Action Bar - Responsive Width */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-brand-dark/90 backdrop-blur-xl border-t border-white/5 z-[60]">
        <div className="max-w-4xl mx-auto flex items-center gap-4 sm:gap-8">
          <div className="flex flex-col justify-center shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entry Fee</span>
            <span className="text-lg sm:text-2xl font-black text-white">{match.entry_fee}</span>
          </div>
          <Button 
            variant={isJoined ? "secondary" : "primary"} 
            className={cn(
              "flex-1 h-14 sm:h-16 text-xs sm:text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all active:scale-95",
              isJoined 
                ? "bg-brand-red hover:bg-brand-red/90 text-white shadow-brand-red/20" 
                : "bg-brand-green hover:bg-brand-green/90 text-white shadow-brand-green/20",
              (!isJoinable || (isFull && !isJoined)) && "opacity-50 grayscale cursor-not-allowed shadow-none"
            )}
            disabled={!isJoinable || (isFull && !isJoined)}
            onClick={handleAction}
          >
            {match.status === 'completed' 
              ? 'Match Finished' 
              : isJoined 
                ? 'Leave' 
                : isFull 
                  ? 'Tournament Full' 
                  : 'Join'}
          </Button>
        </div>
      </div>
    </div>
  );
}
