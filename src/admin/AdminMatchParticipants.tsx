import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Users, Trophy, Crown, Medal, Check, X, Award,
  ChevronDown, Shield, ShieldOff, Ban, AlertTriangle, MoreVertical,
} from 'lucide-react';
import { useMatchStore } from '@/src/store/matchStore';
import { usePlatformStore } from '@/src/store/platformStore';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { MatchParticipant, MatchWinners } from '@/src/types';
import { cn } from '@/src/utils/helpers';

type WinnerSlot = 'first' | 'second' | 'third';

const SLOT_CONFIG: Record<WinnerSlot, { label: string; color: string; bg: string; icon: React.ReactNode; medal: string }> = {
  first:  { label: '1st Place', color: '#FFD60A', bg: '#FFD60A15', icon: <Crown size={16} />,  medal: '🥇' },
  second: { label: '2nd Place', color: '#8E8E93', bg: '#8E8E9315', icon: <Medal size={16} />,  medal: '🥈' },
  third:  { label: '3rd Place', color: '#FF9F0A', bg: '#FF9F0A15', icon: <Award size={16} />,  medal: '🥉' },
};

type ActionSheet = { participant: MatchParticipant; anchorY?: number } | null;

export default function AdminMatchParticipants() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMatchById, setMatchWinners } = useMatchStore();
  const { registeredUsers, banUser, unbanUser, suspendUser, unsuspendUser } = usePlatformStore();

  const match = getMatchById(id ?? '');
  const participants: MatchParticipant[] = match?.participants ?? [];

  const [winners, setWinners]       = useState<MatchWinners>(match?.winners ?? {});
  const [selecting, setSelecting]   = useState<WinnerSlot | null>(null);
  const [saved, setSaved]           = useState(false);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [actionSheet, setActionSheet] = useState<ActionSheet>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const getUserRecord = (participant: MatchParticipant) =>
    registeredUsers.find(u => u.id === participant.id || u.username === participant.username);

  const getEmail = (participant: MatchParticipant): string => {
    if (participant.email) return participant.email;
    const rec = getUserRecord(participant);
    return rec?.email ?? '—';
  };

  const getStatus = (participant: MatchParticipant) => {
    const rec = getUserRecord(participant);
    return rec?.status ?? 'active';
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
    if (!isCompleted) { showToast('Match must be completed first', false); return; }
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

  const handleBan = (participant: MatchParticipant) => {
    const rec = getUserRecord(participant);
    if (!rec) { showToast('User not found in registry', false); setActionSheet(null); return; }
    if (rec.status === 'banned') {
      unbanUser(rec.id);
      showToast(`${participant.username} unbanned`);
    } else {
      banUser(rec.id);
      showToast(`${participant.username} banned`, false);
    }
    setActionSheet(null);
  };

  const handleSuspend = (participant: MatchParticipant) => {
    const rec = getUserRecord(participant);
    if (!rec) { showToast('User not found in registry', false); setActionSheet(null); return; }
    if (rec.status === 'suspended') {
      unsuspendUser(rec.id);
      showToast(`${participant.username} unsuspended`);
    } else {
      suspendUser(rec.id);
      showToast(`${participant.username} suspended`, false);
    }
    setActionSheet(null);
  };

  const statusBadge = (status: string) => {
    if (status === 'banned')    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-live/12 text-brand-live shrink-0">Banned</span>;
    if (status === 'suspended') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-warning/15 text-brand-warning shrink-0">Suspended</span>;
    return null;
  };

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
            match.status === 'live'     ? 'bg-brand-live/15 text-brand-live' :
            match.status === 'upcoming' ? 'bg-brand-warning/15 text-brand-warning' :
            'bg-app-elevated text-text-muted'
          )}>
            {match.status === 'live' ? 'LIVE' : match.status === 'upcoming' ? 'UPCOMING' : 'ENDED'}
          </span>
        </div>
      </div>

      {isCompleted && (
        <section className="px-4 space-y-3">
          <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal">Select Winners</p>

          <div className="space-y-2">
            {(['first', 'second', 'third'] as WinnerSlot[]).map(slot => {
              const cfg    = SLOT_CONFIG[slot];
              const winner = winners[slot];
              const isOpen = selecting === slot;

              return (
                <div key={slot} className="bg-app-card rounded-[16px] overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
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
                        <button onClick={() => clearSlot(slot)} className="w-8 h-8 rounded-full bg-brand-live/10 flex items-center justify-center text-brand-live active:opacity-70 transition-opacity">
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
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden border-t border-app-border"
                      >
                        {participants.length === 0 ? (
                          <p className="px-4 py-4 text-[14px] text-text-muted font-normal text-center">No participants yet</p>
                        ) : (
                          <div className="divide-y divide-app-border max-h-[240px] overflow-y-auto">
                            {availableForSlot(slot).map(p => {
                              const isSelected = winners[slot]?.id === p.id;
                              return (
                                <button key={p.id} onClick={() => assignWinner(slot, p)}
                                  className={cn('w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-70 transition-opacity', isSelected ? 'bg-brand-primary/8' : 'hover:bg-app-elevated')}
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
              Object.keys(winners).length ? 'bg-brand-primary shadow-lg shadow-brand-primary/25' : 'bg-app-elevated text-text-muted'
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
              const slotCfg   = winnerSlot ? SLOT_CONFIG[winnerSlot] : null;
              const email     = getEmail(p);
              const status    = getStatus(p);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="w-6 text-[14px] font-medium text-text-muted text-center tabular shrink-0">{i + 1}</span>
                  <LetterAvatar name={p.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-normal text-text-primary truncate">{p.username}</p>
                      {statusBadge(status)}
                    </div>
                    <p className="text-[12px] text-brand-primary/80 font-normal truncate">{email}</p>
                    <p className="text-[11px] text-text-muted font-normal">
                      Joined {new Date(p.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {slotCfg && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: slotCfg.bg, color: slotCfg.color }}>
                        {slotCfg.medal} {slotCfg.label}
                      </span>
                    )}
                    <button
                      onClick={() => setActionSheet({ participant: p })}
                      className="w-8 h-8 rounded-full bg-app-elevated flex items-center justify-center text-text-muted active:opacity-60 transition-opacity"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Per-participant action sheet */}
      <AnimatePresence>
        {actionSheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setActionSheet(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="relative w-full max-w-[440px] bg-app-card rounded-t-[28px] pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>

              <div className="px-5 pb-4 border-b border-ios-sep flex items-center gap-3">
                <LetterAvatar name={actionSheet.participant.username} size="sm" />
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-text-primary">{actionSheet.participant.username}</p>
                  <p className="text-[12px] text-brand-primary/80 truncate">{getEmail(actionSheet.participant)}</p>
                </div>
              </div>

              <div className="divide-y divide-ios-sep">
                {(() => {
                  const status = getStatus(actionSheet.participant);
                  return (
                    <>
                      <button
                        onClick={() => handleSuspend(actionSheet.participant)}
                        className="w-full flex items-center gap-3.5 px-5 py-4 active:bg-app-elevated transition-colors"
                      >
                        <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0', status === 'suspended' ? 'bg-brand-success/15 text-brand-success' : 'bg-brand-warning/15 text-brand-warning')}>
                          {status === 'suspended' ? <ShieldOff size={17} /> : <Shield size={17} />}
                        </div>
                        <div className="text-left">
                          <p className="text-[15px] text-text-primary">{status === 'suspended' ? 'Remove Suspension' : 'Suspend User'}</p>
                          <p className="text-[12px] text-text-muted mt-0.5">
                            {status === 'suspended' ? 'Restore normal access' : 'Temporarily restrict access'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleBan(actionSheet.participant)}
                        className="w-full flex items-center gap-3.5 px-5 py-4 active:bg-app-elevated transition-colors"
                      >
                        <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0', status === 'banned' ? 'bg-brand-success/15 text-brand-success' : 'bg-brand-live/15 text-brand-live')}>
                          <Ban size={17} />
                        </div>
                        <div className="text-left">
                          <p className={cn('text-[15px]', status === 'banned' ? 'text-brand-success' : 'text-brand-live')}>
                            {status === 'banned' ? 'Unban User' : 'Ban User'}
                          </p>
                          <p className="text-[12px] text-text-muted mt-0.5">
                            {status === 'banned' ? 'Restore account access' : 'Permanently block from platform'}
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActionSheet(null)}
                        className="w-full flex items-center gap-3.5 px-5 py-4 active:bg-app-elevated transition-colors"
                      >
                        <div className="w-9 h-9 rounded-[10px] bg-app-elevated flex items-center justify-center shrink-0 text-text-muted">
                          <X size={17} />
                        </div>
                        <p className="text-[15px] text-text-secondary">Cancel</p>
                      </button>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
