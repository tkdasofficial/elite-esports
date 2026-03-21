import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { ImageUpload } from '@/src/components/ui/ImageUpload';
import { Plus, Edit2, Trash2, Search, CheckCircle2, X, Check, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { useGameStore } from '@/src/store/gameStore';
import { Game } from '@/src/types';

type ModalState = { mode: 'add' | 'edit'; game: Partial<Game> } | null;
type Toast = { msg: string; ok: boolean } | null;

const EMPTY_GAME: Partial<Game> = {
  name: '',
  category: 'Battle Royale',
  logo: '',
  banner: '',
  status: 'active',
};

const CATEGORY_OPTIONS = [
  { value: 'Battle Royale', label: 'Battle Royale', emoji: '🏆' },
  { value: 'FPS',           label: 'FPS',           emoji: '🎯' },
  { value: 'MOBA',          label: 'MOBA',          emoji: '⚔️'  },
  { value: 'Sports',        label: 'Sports',        emoji: '⚽' },
  { value: 'Strategy',      label: 'Strategy',      emoji: '🧠' },
];


export default function AdminGames() {
  const { games, addGame, updateGame, deleteGame, toggleStatus } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openAdd = () => setModal({ mode: 'add', game: { ...EMPTY_GAME } });
  const openEdit = (g: Game) => setModal({ mode: 'edit', game: { ...g } });

  const handleSave = () => {
    if (!modal) return;
    const { mode, game } = modal;
    if (!game.name?.trim()) { showToast('Game name is required', false); return; }
    if (!game.logo?.trim()) { showToast('Logo URL is required', false); return; }
    if (!game.banner?.trim()) { showToast('Banner URL is required', false); return; }
    if (!game.category) { showToast('Category is required', false); return; }

    if (mode === 'add') {
      addGame({
        name: game.name!,
        category: game.category!,
        logo: game.logo!,
        banner: game.banner!,
        status: 'active',
      });
      showToast(`${game.name} added successfully`);
    } else {
      updateGame(game.id!, {
        name: game.name,
        category: game.category,
        logo: game.logo,
        banner: game.banner,
        status: game.status,
      });
      showToast(`${game.name} updated successfully`);
    }
    setModal(null);
  };

  const handleToggle = (id: string) => {
    const g = games.find(g => g.id === id);
    toggleStatus(id);
    showToast(`${g?.name} ${g?.status === 'active' ? 'deactivated' : 'activated'}`);
  };

  const handleDelete = (id: string) => {
    const g = games.find(g => g.id === id);
    deleteGame(id);
    setConfirmDeleteId(null);
    showToast(`${g?.name} deleted`);
  };

  const setField = (key: keyof Game, value: any) =>
    setModal(m => m ? { ...m, game: { ...m.game, [key]: value } } : m);

  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = games.filter(g => g.status === 'active').length;

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Games</h1>
          <p className="text-xs text-slate-500 font-bold">
            {games.length} total &middot; <span className="text-brand-green">{activeCount} active</span>
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="rounded-xl px-4 flex items-center gap-2 flex-shrink-0">
          <Plus size={16} /> Add Game
        </Button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search games or categories..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center text-slate-600">
          <Image size={40} />
          <p className="font-bold">No games found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden bg-brand-card/40 border-white/5">
                <div className="relative h-32">
                  <img
                    src={game.banner}
                    alt={`${game.name} banner`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=60'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      'text-[9px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10',
                      game.status === 'active' ? 'bg-brand-green/80 text-white' : 'bg-slate-800/80 text-slate-400'
                    )}>
                      {game.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl border-2 border-white/20 overflow-hidden bg-black/40 flex-shrink-0">
                      <img
                        src={game.logo}
                        alt={`${game.name} logo`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <p className="font-black text-sm text-white drop-shadow">{game.name}</p>
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{game.category}</p>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-3">
                    <span>{game.matches} matches</span>
                  </div>

                  {confirmDeleteId === game.id ? (
                    <div className="flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20">
                      <p className="flex-1 text-xs font-bold text-brand-red">Delete {game.name}?</p>
                      <button onClick={() => handleDelete(game.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg active:opacity-70">Delete</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(game.id)}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                          game.status === 'active'
                            ? 'bg-white/5 text-slate-400 hover:bg-brand-red/10 hover:text-brand-red'
                            : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                        )}
                      >
                        {game.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => openEdit(game)}
                        className="p-2.5 bg-white/5 hover:bg-brand-blue/10 hover:text-brand-blue text-slate-400 rounded-xl transition-all"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(game.id)}
                        className="p-2.5 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="w-full sm:max-w-lg bg-[#0f0f14] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-shrink-0 px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-black">{modal.mode === 'add' ? 'Add Game' : 'Edit Game'}</h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Game Name</label>
                  <input
                    value={modal.game.name || ''}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. BGMI, Valorant…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
                  />
                </div>

                <CustomSelect
                  label="Category"
                  value={modal.game.category || 'Battle Royale'}
                  onChange={v => setField('category', v)}
                  options={CATEGORY_OPTIONS}
                  variant="admin"
                />

                <ImageUpload
                  label="Logo Image"
                  value={modal.game.logo || ''}
                  onChange={v => setField('logo', v)}
                  aspect="square"
                  hint="Square image · Shown in game selection dropdowns"
                  required
                />

                <ImageUpload
                  label="Banner Image"
                  value={modal.game.banner || ''}
                  onChange={v => setField('banner', v)}
                  aspect="wide"
                  hint="Landscape image · Auto-used as match banner when this game is selected"
                  required
                />

                {modal.mode === 'edit' && (
                  <div className="flex items-center justify-between py-2 px-4 bg-white/5 rounded-xl">
                    <span className="text-sm font-bold">Active</span>
                    <button
                      onClick={() => setField('status', modal.game.status === 'active' ? 'inactive' : 'active')}
                      className={`w-12 h-6 rounded-full relative transition-colors ${modal.game.status === 'active' ? 'bg-brand-green' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${modal.game.status === 'active' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 p-5 pt-0 flex gap-3">
                <Button variant="secondary" onClick={() => setModal(null)} className="flex-1 rounded-xl border-white/10">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                  <Check size={15} /> {modal.mode === 'add' ? 'Add Game' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
