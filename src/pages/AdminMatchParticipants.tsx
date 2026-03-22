import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Users, Trophy, Crown, Medal, Check, X, Award, ChevronDown } from 'lucide-react';
import { useMatchStore } from '@/src/store/matchStore';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { MatchParticipant, MatchWinners } from '@/src/types';
import { cn } from '@/src/utils/helpers';

type WinnerSlot = 'first' | 'second' | 'third';

const SLOT_CONFIG: Record<WinnerSlot, { label: string; color: string; bg: string; icon: React.ReactNode; medal: string }> = {
  first:  { label: '1st Place', color: '#FFD60A', bg: '#FFD60A15', icon: <Crown size={16} />,  medal: '🥇' },
  second: { label: '2nd Place', color: '#8E8E93', bg: '#8E8E9315', icon: <Medal size={16} />,  medal: '🥈' },
  third:  { label: '3rd Place', color: '#FF9F0A', bg: '#FF9F0A15', icon: <Award size={16} />,  medal: '🥉' },
};

export default function AdminMatchParticipants() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMatchById, setMatchWinners } = useMatchStore();

  const match = getMatchById(id ?? '');
  const participants: MatchParticipant[] = match?.participants ?? [];

  const [winners, setWinners] = useState<MatchWinners>(match?.winners ?? {});
  const [selecting, setSelecting] = useState<WinnerSlot | null>(null);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 px-6">
        <p className="text-[17px] text-text-secondary">Match not found.</p>
        <button onClick={() => navigate('/admin/matches')} className="px-5 py-2.5 bg-brand-primary rounded-[12px] text-white text-[15px] font-medium">
          Back to Matches
        </button>
      </div>
    );
  }

  const isCompleted = match.status === 'completed';

  const assignWinner = (slot: WinnerSlot, participant: MatchParticipant) => {
    const newWinners = { ...winners };
    for (const s of Object.keys(newWinners) as WinnerSlot[]) {
      if (newWinners[s]?.id === participant.id) delete newWinners[s];
    }
    newWinners[slot] = participant;
    setWinners(newWinners);
    setSelecting(null);
    setSaved(false);
  };

  const clearSlot = (slot: WinnerSlot) => {
    const newWinners = { ...winners };
    delete newWinners[slot];
    setWinners(newWinners);
    setSaved(false);
  };

  const handleSave = () => {
    if (!isCompleted) {
      showToast('Match must be completed first', false);
      return;
    }
    setMatchWinners(match.match_id, winners);
    setSaved(true);
    showToast('Winners saved successfully!');
  };

  const getWinnerSlotForParticipant = (pid: string): WinnerSlot | null => {
    for (const s of ['first', 'second', 'third'] as WinnerSlot[]) {
      if (winners[s]?.id === pid) return s;
    }
    return null;
  };

  const availableForSlot = (slot: WinnerSlot) =>
    participants.filter(p => {
      const assignedSlot = getWinnerSlotForParticipant(p.id);
      return assignedSlot === null || assignedSlot === slot;
    });

  return (
    <div className="pb-28 pt-2 space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-[14px] text-[14px] font-medium shadow-xl flex items-center gap-2 pointer-events-none whitespace-nowrap ${toast.ok ? 'bg-brand-success text-white' : 'bg-brand-live text-white'}`}
          >
            {toast.ok ? <Check size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/matches')}
          className="w-10 h-10 rounded-full bg-app-elevated flex items-center justify-center text-text-primary active:opacity-70 transition-opacity shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-text-primary tracking-[-0.5px] truncate">{match.title}</h1>
          <p className="text-[13px] text-text-muted font-normal">{match.game_name} · {match.mode}</p>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-app-card rounded-[16px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-brand-primary/10 flex items-center justify-center">
              <Users size={18} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-text-primary">{participants.length} Participants</p>
              <p className="text-[13px] text-text-muted font-normal">{match.slots_filled}/{match.slots_total} slots filled</p>
            </div>
          </div>
          <span className={cn(
            'px-3 py-1.5 rounded-full text-[12px] font-semibold',
            match.status === 'live' ? 'bg-brand-live/15 text-brand-live' :
            match.status === 'upcoming' ? 'bg-brand-warning/15 text-brand-warning' :
            'bg-app-elevated text-text-muted'
          )}>
            {match.status === 'live' ? 'LIVE' : match.status === 'upcoming' ? 'UPCOMING' : 'ENDED'}
          </span>
        </div>
      </div>

      {isCompleted && (
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal">
              Select Winners
            </p>
            {!isCompleted && (
              <p className="text-[11px] text-brand-warning font-medium">Mark match as completed first</p>
            )}
          </div>

          <div className="space-y-2">
            {(['first', 'second', 'third'] as WinnerSlot[]).map(slot => {
              const cfg = SLOT_CONFIG[slot];
              const winner = winners[slot];
              const isOpen = selecting === slot;

              return (
                <div key={slot} className="bg-app-card rounded-[16px] overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-text-muted font-medium uppercase tracking-wide">{cfg.label}</p>
                      {winner ? (
                        <p className="text-[15px] font-medium text-text-primary truncate">{winner.username}</p>
                      ) : (
                        <p className="text-[15px] text-text-muted font-normal">Not assigned</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {winner && (
                        <button
                          onClick={() => clearSlot(slot)}
                          className="w-8 h-8 rounded-full bg-brand-live/10 flex items-center justify-center text-brand-live active:opacity-70 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setSelecting(isOpen ? null : slot)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all active:opacity-70',
                          isOpen ? 'bg-brand-primary text-white' : 'bg-app-elevated text-text-secondary'
                        )}
                      >
                        {winner ? 'Change' : 'Assign'} <ChevronDown size={13} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-app-border"
                      >
                        {participants.length === 0 ? (
                          <p className="px-4 py-4 text-[14px] text-text-muted font-normal text-center">No participants yet</p>
                        ) : (
                          <div className="divide-y divide-app-border max-h-[240px] overflow-y-auto">
                            {availableForSlot(slot).map(p => {
                              const isSelected = winners[slot]?.id === p.id;
                              return (
                                <button
                                  key={p.id}
                                  onClick={() => assignWinner(slot, p)}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-70 transition-opacity',
                                    isSelected ? 'bg-brand-primary/8' : 'hover:bg-app-elevated'
                                  )}
                                >
                                  <LetterAvatar name={p.username} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-normal text-text-primary truncate">{p.username}</p>
                                    <p className="text-[12px] text-text-muted font-normal">
                                      Joined {new Date(p.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </p>
                                  </div>
                                  {isSelected && <Check size={16} className="text-brand-primary shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={!Object.keys(winners).length}
            className={cn(
              'w-full h-[52px] rounded-[14px] text-white text-[16px] font-semibold transition-all active:opacity-75',
              Object.keys(winners).length
                ? 'bg-brand-primary shadow-lg shadow-brand-primary/25'
                : 'bg-app-elevated text-text-muted'
            )}
          >
            {saved ? '✓ Winners Saved' : 'Save Winners'}
          </button>
        </section>
      )}

      {!isCompleted && (
        <div className="px-4">
          <div className="bg-brand-warning/8 border border-brand-warning/20 rounded-[16px] p-4 flex items-start gap-3">
            <Trophy size={18} className="text-brand-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-brand-warning">Winner Selection Locked</p>
              <p className="text-[13px] text-text-muted font-normal mt-0.5 leading-relaxed">
                Change the match status to <span className="text-text-secondary font-medium">Completed</span> to unlock winner selection.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="px-4 space-y-3">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal">
          All Participants ({participants.length})
        </p>

        {participants.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-14 text-center space-y-2">
            <div className="w-[60px] h-[60px] bg-app-elevated rounded-[18px] flex items-center justify-center mx-auto">
              <Users size={26} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">No participants yet</p>
            <p className="text-[13px] text-text-muted font-normal px-6">Players who join this match will appear here</p>
          </div>
        ) : (
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            {participants.map((p, i) => {
              const winnerSlot = getWinnerSlotForParticipant(p.id);
              const slotCfg = winnerSlot ? SLOT_CONFIG[winnerSlot] : null;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="w-6 text-[14px] font-medium text-text-muted text-center tabular shrink-0">{i + 1}</span>
                  <LetterAvatar name={p.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-normal text-text-primary truncate">{p.username}</p>
                    <p className="text-[12px] text-text-muted font-normal">
                      Joined {new Date(p.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {slotCfg && (
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
                      style={{ background: slotCfg.bg, color: slotCfg.color }}
                    >
                      {slotCfg.medal} {slotCfg.label}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
