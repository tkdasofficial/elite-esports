import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { Plus, Edit2, Trash2, Search, CheckCircle2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type Game = { id: string; name: string; category: string; icon: string; status: string; matches: number };
type Modal = { mode: 'add' | 'edit'; game: Partial<Game> } | null;
type Toast = { msg: string; ok: boolean } | null;

const INITIAL: Game[] = [
  { id: '1', name: 'BGMI',         category: 'Battle Royale', icon: 'https://picsum.photos/seed/bgmi/100/100', status: 'active',   matches: 12 },
  { id: '2', name: 'Free Fire',    category: 'Battle Royale', icon: 'https://picsum.photos/seed/ff/100/100',   status: 'active',   matches: 8 },
  { id: '3', name: 'Valorant',     category: 'FPS',           icon: 'https://picsum.photos/seed/val/100/100',  status: 'active',   matches: 5 },
  { id: '4', name: 'Call of Duty', category: 'FPS',           icon: 'https://picsum.photos/seed/cod/100/100',  status: 'inactive', matches: 0 },
];

const CATEGORIES = ['Battle Royale', 'FPS', 'MOBA', 'Sports', 'Strategy'];

export default function AdminGames() {
  const [searchQuery, setSearchQuery]     = useState('');
  const [games, setGames]                 = useState<Game[]>(INITIAL);
  const [modal, setModal]                 = useState<Modal>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]                 = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const toggleStatus = (id: string) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } : g));
    const g = games.find(g => g.id === id);
    showToast(`${g?.name} set to ${g?.status === 'active' ? 'inactive' : 'active'}`);
  };

  const handleDelete = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
    setConfirmDeleteId(null);
    showToast('Game deleted');
  };

  const handleSave = () => {
    if (!modal) return;
    const { mode, game } = modal;
    if (!game.name?.trim() || !game.category) { showToast('Name and category are required', false); return; }

    if (mode === 'add') {
      setGames(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        name: game.name!, category: game.category!,
        icon: `https://picsum.photos/seed/${encodeURIComponent(game.name!)}/100/100`,
        status: 'inactive', matches: 0,
      }]);
      showToast(`${game.name} added successfully`);
    } else {
      setGames(prev => prev.map(g => g.id === game.id ? { ...g, ...game } as Game : g));
      showToast(`${game.name} updated successfully`);
    }
    setModal(null);
  };

  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Games</h1>
          <p className="text-xs text-slate-500 font-bold">{games.filter(g => g.status === 'active').length} active games</p>
        </div>
        <Button onClick={() => setModal({ mode: 'add', game: { name: '', category: 'Battle Royale' } })} size="sm" className="rounded-xl px-4 flex items-center gap-2">
          <Plus size={16} /> Add Game
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" placeholder="Search games..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600" />
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((game, i) => (
          <motion.div key={game.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 bg-brand-card/40 border-white/5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                  <img src={game.icon} alt={game.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{game.name}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{game.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('text-[10px] font-black uppercase', game.status === 'active' ? 'text-brand-green' : 'text-slate-500')}>
                      {game.status}
                    </span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] font-bold text-white">{game.matches} matches</span>
                  </div>
                </div>
              </div>

              {confirmDeleteId === game.id ? (
                <div className="mt-3 flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20">
                  <p className="flex-1 text-xs font-bold text-brand-red">Delete {game.name}?</p>
                  <button onClick={() => handleDelete(game.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => toggleStatus(game.id)}
                    className={cn('flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                      game.status === 'active' ? 'bg-white/5 text-slate-400 hover:bg-brand-red/10 hover:text-brand-red' : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20')}>
                    {game.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => setModal({ mode: 'edit', game: { ...game } })}
                    className="p-2.5 bg-white/5 hover:bg-brand-blue/10 hover:text-brand-blue text-slate-400 rounded-xl transition-all">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(game.id)}
                    className="p-2.5 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-black">{modal.mode === 'add' ? 'Add Game' : 'Edit Game'}</h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Game Name</label>
                  <input value={modal.game.name || ''} onChange={e => setModal(m => m ? { ...m, game: { ...m.game, name: e.target.value } } : m)}
                    placeholder="e.g. BGMI, Valorant..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all" />
                </div>
                <CustomSelect
                  label="Category"
                  value={modal.game.category || ''}
                  onChange={v => setModal(m => m ? { ...m, game: { ...m.game, category: v } } : m)}
                  options={[
                    { value: 'Battle Royale', label: 'Battle Royale', emoji: '🏆' },
                    { value: 'FPS',           label: 'FPS',           emoji: '🎯' },
                    { value: 'MOBA',          label: 'MOBA',          emoji: '⚔️'  },
                    { value: 'Sports',        label: 'Sports',        emoji: '⚽' },
                    { value: 'Strategy',      label: 'Strategy',      emoji: '🧠' },
                  ]}
                  variant="admin"
                />
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setModal(null)} className="flex-1 rounded-xl border-white/10">Cancel</Button>
                  <Button onClick={handleSave} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                    <Check size={15} /> {modal.mode === 'add' ? 'Add' : 'Save'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
