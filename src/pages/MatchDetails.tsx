import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft, Trophy, Users, Clock, Coins,
  ShieldCheck, Share2, UserCheck, CheckCircle
} from 'lucide-react';
import { useMatchStore } from '@/src/store/matchStore';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
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
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-6">
        <p className="text-text-secondary font-semibold">Match not found or removed.</p>
        <Button onClick={() => navigate('/')}>Go Back Home</Button>
      </div>
    );
  }

  const isJoinable = match.status !== 'completed';
  const slotsLeft = match.slots_total - match.slots_filled;
  const isFull = slotsLeft <= 0;
  const fillPct = Math.min((match.slots_filled / match.slots_total) * 100, 100);

  const mockPlayers = [
    { id:'2', username:'GamerX',     rank:'Platinum' },
    { id:'3', username:'ShadowNinja',rank:'Gold' },
    { id:'4', username:'AcePlayer',  rank:'Diamond' },
  ];
  const allPlayers = isJoined ? [user, ...mockPlayers] : mockPlayers;

  const terms = [
    'Participants must be at least 16 years old.',
    'Stable internet connection required for competitive play.',
    'Results must be screenshotted within 15 minutes of match end.',
    'Unsportsmanlike behavior leads to immediate disqualification.',
    'Organiser decisions are final in all disputes.',
  ];

  const statusCfg = {
    live:      { cls:'bg-brand-live/15 text-brand-live border-brand-live/30',       label:'LIVE' },
    upcoming:  { cls:'bg-brand-warning/15 text-brand-warning border-brand-warning/30', label:'UPCOMING' },
    completed: { cls:'bg-text-muted/10 text-text-secondary border-text-muted/20',    label:'ENDED' },
  };
  const sc = statusCfg[match.status];

  return (
    <div className="pb-32">
      {/* Hero image */}
      <div className="relative aspect-[16/9] max-h-[300px] overflow-hidden">
        <img src={match.banner_image} alt={match.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/20 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl glass-dark flex items-center justify-center text-white border border-white/15 active:scale-90 transition-transform">
            <ArrowLeft size={20} />
          </button>
          <button className="w-10 h-10 rounded-2xl glass-dark flex items-center justify-center text-white border border-white/15 active:scale-90 transition-transform">
            <Share2 size={18} />
          </button>
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md', sc.cls)}>
            {match.status==='live' && <span className="w-1.5 h-1.5 rounded-full bg-brand-live animate-pulse" />}
            {sc.label}
          </span>
        </div>
      </div>

      <div className="px-4 -mt-5 relative z-10 space-y-5">
        {/* Title card */}
        <div className="bg-app-card border border-app-border rounded-3xl p-5 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-brand-primary/15 text-brand-primary-light text-[10px] font-bold rounded-lg border border-brand-primary/25">
                {match.game_name}
              </span>
              <span className="px-2.5 py-1 bg-brand-warning/15 text-brand-warning text-[10px] font-bold rounded-lg border border-brand-warning/25">
                {match.mode}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-text-primary leading-tight">{match.title}</h1>
            <p className="text-xs text-text-muted font-medium flex items-center gap-1.5">
              <CheckCircle size={12} className="text-brand-success" />
              Organised by Elite Esports · Verified Tournament
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Trophy, label:'Prize Pool', value:match.prize,      color:'text-brand-success', bg:'bg-brand-success/8' },
              { icon: Coins,  label:'Entry Fee',  value:match.entry_fee,  color:'text-brand-warning', bg:'bg-brand-warning/8' },
              { icon: Clock,  label:'Start Time', value:match.start_time, color:'text-brand-primary-light', bg:'bg-brand-primary/8' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center', s.bg)}>
                <s.icon size={16} className={s.color} />
                <p className="text-[9px] font-semibold text-text-muted uppercase tracking-wide">{s.label}</p>
                <p className={cn('text-sm font-extrabold', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-text-muted">Participants</span>
              <span className={isFull ? 'text-brand-live' : 'text-text-secondary'}>
                {isFull ? 'Tournament Full' : `${slotsLeft} slots left`}
              </span>
            </div>
            <div className="h-1.5 bg-app-elevated rounded-full overflow-hidden">
              <motion.div
                initial={{ width:0 }}
                animate={{ width:`${fillPct}%` }}
                transition={{ duration:0.9, ease:'easeOut' }}
                className={cn('h-full rounded-full', isFull?'bg-brand-live':fillPct>75?'bg-brand-warning':'bg-brand-primary')}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted font-medium">
              <div className="flex -space-x-2">
                {allPlayers.slice(0,5).map((p,i)=>(
                  <LetterAvatar key={p?.id||i} name={p?.username||'P'} size="sm"
                    variant={i%2===0?'blue':'green'}
                    className="border-2 border-app-card" />
                ))}
              </div>
              <span>{match.slots_filled}/{match.slots_total} joined</span>
            </div>
          </div>
        </div>

        {/* Joined players */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-text-primary">Joined Players</h2>
            <span className="text-xs font-semibold text-brand-primary-light">{allPlayers.length}/{match.slots_total}</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {allPlayers.map(p => (
              <div key={p?.id} className="flex items-center justify-between bg-app-card border border-app-border rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <LetterAvatar name={p?.username||'P'} size="sm" variant="slate" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{p?.username}</p>
                    <p className="text-xs text-text-muted font-medium">{p?.rank}</p>
                  </div>
                </div>
                {p?.id===user?.id && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-brand-primary/15 rounded-lg text-[10px] font-bold text-brand-primary-light border border-brand-primary/25">
                    <UserCheck size={10} /> You
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-text-primary px-1">Tournament Rules</h2>
          <div className="bg-app-card border border-app-border rounded-3xl p-5 space-y-4">
            {[
              { icon: ShieldCheck, color:'text-brand-primary-light', bg:'bg-brand-primary/8', title:'Anti-Cheat', text:'Advanced detection active. Any hacks or scripts = permanent ban.' },
              { icon: Users,       color:'text-brand-success',       bg:'bg-brand-success/8',  title:'Match Format', text:'Best of 3 series. Points based on placement & kills per official guidelines.' },
            ].map(r=>(
              <div key={r.title} className="flex gap-3.5">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', r.bg)}>
                  <r.icon size={18} className={r.color} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-text-primary">{r.title}</p>
                  <p className="text-xs text-text-muted font-medium leading-relaxed">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-text-primary px-1">Terms & Conditions</h2>
          <div className="bg-app-card border border-app-border rounded-3xl p-5 space-y-3.5">
            {terms.map((t,i)=>(
              <div key={i} className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-app-elevated flex items-center justify-center shrink-0 text-[10px] font-bold text-text-muted mt-0.5">{i+1}</span>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">{t}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-dark border-t border-app-border z-[60]">
        <div className="max-w-[768px] mx-auto flex items-center gap-4">
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Entry Fee</p>
            <p className="text-xl font-extrabold text-text-primary">{match.entry_fee}</p>
          </div>
          <Button
            onClick={() => isJoined ? leaveMatch(match.match_id) : joinMatch(match.match_id)}
            disabled={!isJoinable || (isFull && !isJoined)}
            className={cn(
              'flex-1 h-14 text-sm font-bold rounded-2xl transition-all active:scale-95',
              isJoined
                ? 'bg-brand-live hover:opacity-90 shadow-lg shadow-brand-live/25'
                : 'bg-brand-success hover:opacity-90 shadow-lg shadow-brand-success/25',
              (!isJoinable || (isFull && !isJoined)) && 'opacity-40 cursor-not-allowed shadow-none'
            )}
          >
            {match.status==='completed' ? 'Match Ended'
              : isJoined ? 'Leave Tournament'
              : isFull   ? 'Tournament Full'
              : 'Join Tournament'}
          </Button>
        </div>
      </div>
    </div>
  );
}
