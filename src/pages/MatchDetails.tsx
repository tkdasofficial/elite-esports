import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Users, Clock, Coins, ShieldCheck, Share2, UserCheck, CheckCircle } from 'lucide-react';
import { useMatchStore } from '@/src/store/matchStore';
import { useUserStore } from '@/src/store/userStore';
import { useAdEngineStore } from '@/src/store/adEngineStore';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { cn } from '@/src/utils/helpers';

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMatchById } = useMatchStore();
  const { user, joinedMatchIds, joinMatch, leaveMatch } = useUserStore();
  const { triggerAd } = useAdEngineStore();

  const match = getMatchById(id || '');
  const isJoined = joinedMatchIds.includes(id || '');

  const handleJoinLeave = async () => {
    if (!match) return;
    if (isJoined) {
      await triggerAd('Leave');
      leaveMatch(match.match_id);
    } else {
      await triggerAd('Join');
      joinMatch(match.match_id);
    }
  };

  if (!match) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-5 px-6">
      <p className="text-[17px] text-text-secondary font-normal">Match not found.</p>
      <button onClick={() => navigate('/')}
        className="px-6 py-3 bg-brand-primary rounded-[14px] text-white text-[16px] font-semibold active:opacity-75 transition-opacity shadow-lg shadow-brand-primary/25">
        Go Back
      </button>
    </div>
  );

  const isJoinable = match.status !== 'completed';
  const slotsLeft  = match.slots_total - match.slots_filled;
  const isFull     = slotsLeft <= 0;
  const fillPct    = Math.min((match.slots_filled / match.slots_total) * 100, 100);

  const joinedPlayers = isJoined && user ? [user] : [];

  const statusCfg = {
    live:      { cls: 'bg-brand-live/15 text-brand-live',       dot: true,  label: 'LIVE' },
    upcoming:  { cls: 'bg-brand-warning/15 text-brand-warning', dot: false, label: 'UPCOMING' },
    completed: { cls: 'bg-app-fill text-text-muted',            dot: false, label: 'ENDED' },
  };
  const sc = statusCfg[match.status];

  const terms = [
    'Participants must be at least 16 years old.',
    'Stable internet connection required.',
    'Screenshot results within 15 minutes of match end.',
    'Unsportsmanlike behavior leads to disqualification.',
    'Organiser decisions are final in all disputes.',
  ];

  return (
    <div className="pb-28 bg-app-bg">
      <div className="relative h-[260px] overflow-hidden">
        <img src={match.banner_image} alt={match.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/30 to-transparent"/>

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/15 active:opacity-70">
            <ArrowLeft size={20}/>
          </button>
          <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold backdrop-blur-md', sc.cls)}>
            {sc.dot && <span className="w-1.5 h-1.5 rounded-full bg-brand-live animate-pulse"/>}
            {sc.label}
          </span>
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white border border-white/15 active:opacity-70">
            <Share2 size={18}/>
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10 space-y-4">
        <div className="bg-app-card rounded-[20px] p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-[4px] bg-brand-primary/15 text-brand-primary-light text-[12px] font-medium rounded-full border border-brand-primary/20">
                {match.game_name}
              </span>
              <span className="px-2.5 py-[4px] bg-brand-warning/15 text-brand-warning text-[12px] font-medium rounded-full border border-brand-warning/20">
                {match.mode}
              </span>
            </div>
            <h1 className="text-[22px] font-bold text-text-primary leading-tight tracking-[-0.5px]">{match.title}</h1>
            <p className="text-[13px] text-text-muted font-normal flex items-center gap-1.5">
              <CheckCircle size={12} className="text-brand-success"/> Organised by Elite Esports · Verified
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Trophy, label: 'Prize',  value: match.prize,      c: 'text-brand-success', bg: 'bg-brand-success/8' },
              { icon: Coins,  label: 'Entry',  value: match.entry_fee,  c: 'text-brand-warning', bg: 'bg-brand-warning/8' },
              { icon: Clock,  label: 'Starts', value: match.start_time, c: 'text-brand-primary-light', bg: 'bg-brand-primary/8' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-[14px] p-3 flex flex-col items-center gap-1', s.bg)}>
                <s.icon size={15} className={s.c}/>
                <p className="text-[10px] text-text-muted font-medium uppercase tracking-wide">{s.label}</p>
                <p className={cn('text-[14px] font-bold tabular', s.c)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px] font-normal">
              <span className="text-text-muted">Participants</span>
              <span className={isFull ? 'text-brand-live' : 'text-text-secondary'}>
                {isFull ? 'Tournament Full' : `${slotsLeft} slots left`}
              </span>
            </div>
            <div className="h-1.5 bg-app-elevated rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full', isFull ? 'bg-brand-live' : fillPct > 75 ? 'bg-brand-warning' : 'bg-brand-primary')}/>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {joinedPlayers.slice(0, 5).map((p, i) => (
                  <LetterAvatar key={p?.id || i} name={p?.username || 'P'} size="xs"
                    className="border-2 border-app-card"/>
                ))}
              </div>
              <span className="text-[12px] text-text-muted font-normal tabular">{match.slots_filled}/{match.slots_total} joined</span>
            </div>
          </div>
        </div>

        {joinedPlayers.length > 0 && (
          <section className="space-y-2">
            <p className="ios-section-header">Registered Players</p>
            <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
              {joinedPlayers.map(p => (
                <div key={p?.id} className="flex items-center justify-between px-4 py-3.5 active:bg-app-elevated transition-colors">
                  <div className="flex items-center gap-3">
                    <LetterAvatar name={p?.username || 'P'} size="sm"/>
                    <div>
                      <p className="text-[15px] font-normal text-text-primary">{p?.username}</p>
                      <p className="text-[13px] text-text-muted font-normal">{p?.rank}</p>
                    </div>
                  </div>
                  {p?.id === user?.id && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-brand-primary/15 rounded-full text-[11px] font-medium text-brand-primary-light">
                      <UserCheck size={10}/> You
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <p className="ios-section-header">Tournament Rules</p>
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <div className="flex gap-3.5 px-4 py-4">
              <div className="w-9 h-9 rounded-[10px] bg-brand-primary/8 flex items-center justify-center shrink-0">
                <ShieldCheck size={17} className="text-brand-primary-light"/>
              </div>
              <div>
                <p className="text-[15px] font-medium text-text-primary">Anti-Cheat Active</p>
                <p className="text-[13px] text-text-muted font-normal leading-relaxed mt-0.5">Advanced detection active. Hacks or scripts = permanent ban.</p>
              </div>
            </div>
            <div className="flex gap-3.5 px-4 py-4">
              <div className="w-9 h-9 rounded-[10px] bg-brand-success/8 flex items-center justify-center shrink-0">
                <Users size={17} className="text-brand-success"/>
              </div>
              <div>
                <p className="text-[15px] font-medium text-text-primary">Match Format</p>
                <p className="text-[13px] text-text-muted font-normal leading-relaxed mt-0.5">Best of 3 series. Points based on placement & kills.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <p className="ios-section-header">Terms & Conditions</p>
          <div className="bg-app-card rounded-[16px] p-4 space-y-3">
            {terms.map((t, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-app-elevated flex items-center justify-center shrink-0 text-[10px] font-medium text-text-muted mt-0.5">{i + 1}</span>
                <p className="text-[13px] text-text-secondary font-normal leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-app-bg/95 backdrop-blur-md border-t border-app-border z-[60]">
        <div className="max-w-[768px] mx-auto flex items-center gap-4">
          <div>
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wide">Entry Fee</p>
            <p className="text-[22px] font-bold text-text-primary tabular">{match.entry_fee}</p>
          </div>
          <button
            onClick={handleJoinLeave}
            disabled={!isJoinable || (isFull && !isJoined)}
            className={cn(
              'flex-1 h-[52px] text-white text-[16px] font-semibold rounded-[14px] transition-opacity active:opacity-75',
              isJoined
                ? 'bg-brand-live shadow-lg shadow-brand-live/20'
                : 'bg-brand-success shadow-lg shadow-brand-success/20',
              (!isJoinable || (isFull && !isJoined)) && 'opacity-30'
            )}
          >
            {match.status === 'completed' ? 'Match Ended'
              : isJoined ? 'Leave Tournament'
              : isFull ? 'Tournament Full'
              : 'Join Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
}
