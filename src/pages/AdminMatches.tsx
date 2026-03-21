import React, { useState } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Plus, Edit2, Trash2, Search, Users, Trophy, X, Check } from 'lucide-react';
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

  const deleteTarget = matches.find(m => m.match_id === confirmDeleteId);

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-4 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {toast.ok ? <Check size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Tournaments</h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">{matches.length} total</p>
        </div>
        <Link to="/admin/matches/new" className="flex-shrink-0">
          <Button size="sm" className="rounded-xl px-4 flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ['all', `All (${counts.all})`],
          ['live', `Live (${counts.live})`],
          ['upcoming', `Upcoming (${counts.upcoming})`],
          ['completed', `Completed (${counts.completed})`],
        ] as const).map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0',
              statusFilter === val ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by title or game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      {/* Match list */}
      <div className="space-y-3">
        {filteredMatches.length === 0 && (
          <div className="py-14 text-center text-slate-500 text-sm font-bold">No tournaments found</div>
        )}
        {filteredMatches.map((match, i) => {
          const slotPct = Math.round((match.slots_filled / match.slots_total) * 100);
          return (
            <motion.div
              key={match.match_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 bg-brand-card/40 border-white/5 group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 flex-shrink-0">
                    <img src={match.banner_image} alt={match.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag variant={match.status as any}>{match.status}</Tag>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{match.game_name}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{match.mode}</span>
                    </div>
                    <h3 className="font-bold text-sm truncate">{match.title}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] font-black text-green-400">{match.prize}</span>
                      <span className="text-[10px] font-bold text-slate-500">Entry: {match.entry_fee}</span>
                    </div>
                    {/* Slot progress */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[120px]">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${slotPct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Users size={9} /> {match.slots_filled}/{match.slots_total}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/matches/edit/${match.match_id}`)}
                      className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(match.match_id)}
                      className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDeleteId && deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-sm bg-[#0f0f14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-black">Delete Tournament?</h2>
                <p className="text-sm text-slate-400 mt-1">"{deleteTarget.title}" will be permanently removed.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 rounded-xl text-sm font-bold text-white hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
