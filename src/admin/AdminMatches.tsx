import React, { useState } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { Plus, Edit2, Trash2, Search, Users, X, Check, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Tag } from '@/src/components/ui/Tag';
import { cn } from '@/src/utils/helpers';

export default function AdminMatches() {
  const { matches, deleteMatch } = useMatchStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    deleteMatch(confirmDeleteId);
    setConfirmDeleteId(null);
    showToast('Tournament deleted');
  };

  const filteredMatches = matches.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.game_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: matches.length,
    live: matches.filter(m => m.status === 'live').length,
    upcoming: matches.filter(m => m.status === 'upcoming').length,
    completed: matches.filter(m => m.status === 'completed').length,
  };

  const filters = [
    { value: 'all',       label: `All (${counts.all})` },
    { value: 'live',      label: `Live (${counts.live})` },
    { value: 'upcoming',  label: `Upcoming (${counts.upcoming})` },
    { value: 'completed', label: `Completed (${counts.completed})` },
  ];

  const deleteTarget = matches.find(m => m.match_id === confirmDeleteId);

  return (
    <div className="pb-24 pt-2 space-y-5">
      {/* Toast */}
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

      {/* Header */}
      <div className="px-4 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Tournaments</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">{matches.length} total</p>
        </div>
        <Link to="/admin/matches/new">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity">
            <Plus size={16} /> Create
          </button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollable-content">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all shrink-0',
              statusFilter === f.value ? 'bg-brand-primary text-white' : 'bg-app-elevated text-text-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by title or game..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Match list */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filteredMatches.length} {filteredMatches.length === 1 ? 'tournament' : 'tournaments'}
        </p>

        {filteredMatches.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-14 text-center">
            <p className="text-[15px] text-text-muted font-normal">No tournaments found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMatches.map((match, i) => {
              const slotPct = Math.round((match.slots_filled / match.slots_total) * 100);
              return (
                <motion.div
                  key={match.match_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-app-card rounded-[18px] overflow-hidden"
                >
                  <div className="flex items-center gap-3.5 p-4">
                    {/* Banner thumb */}
                    <div className="w-16 h-16 rounded-[14px] overflow-hidden border border-app-border shrink-0">
                      <img src={match.banner_image} alt={match.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tag variant={match.status as any}>{match.status}</Tag>
                        <span className="text-[11px] font-semibold text-brand-primary">{match.game_name}</span>
                        <span className="text-[11px] text-text-muted">{match.mode}</span>
                      </div>
                      <p className="text-[15px] font-medium text-text-primary truncate">{match.title}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold text-brand-success">{match.prize}</span>
                        <span className="text-[12px] text-text-muted">Entry: {match.entry_fee}</span>
                      </div>
                      {/* Slot bar */}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-app-elevated rounded-full overflow-hidden max-w-[100px]">
                          <div className="h-full bg-brand-primary rounded-full" style={{ width: `${slotPct}%` }} />
                        </div>
                        <span className="text-[11px] text-text-muted flex items-center gap-1">
                          <Users size={10} /> {match.slots_filled}/{match.slots_total}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => navigate(`/admin/matches/${match.match_id}/participants`)}
                        className="w-9 h-9 bg-app-elevated rounded-[12px] text-text-secondary flex items-center justify-center active:opacity-60 transition-opacity relative"
                        title="View Participants"
                      >
                        <Users size={15} />
                        {match.participants && match.participants.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                            {match.participants.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/admin/matches/edit/${match.match_id}`)}
                        className="w-9 h-9 bg-brand-primary/10 rounded-[12px] text-brand-primary flex items-center justify-center active:opacity-60 transition-opacity"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(match.match_id)}
                        className="w-9 h-9 bg-brand-live/10 rounded-[12px] text-brand-live flex items-center justify-center active:opacity-60 transition-opacity"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete confirm — iOS alert style */}
      <AnimatePresence>
        {confirmDeleteId && deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-[280px] bg-app-card rounded-[18px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 text-center space-y-2">
                <div className="w-14 h-14 bg-brand-live/10 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={24} className="text-brand-live" />
                </div>
                <h2 className="text-[17px] font-semibold text-text-primary">Delete Tournament?</h2>
                <p className="text-[13px] text-text-muted">"{deleteTarget.title}" will be permanently removed.</p>
              </div>
              <div className="border-t border-ios-sep grid grid-cols-2 divide-x divide-ios-sep">
                <button onClick={() => setConfirmDeleteId(null)} className="py-4 text-[17px] text-brand-primary font-normal active:bg-app-elevated transition-colors">Cancel</button>
                <button onClick={handleDelete} className="py-4 text-[17px] text-brand-live font-medium active:bg-app-elevated transition-colors">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
