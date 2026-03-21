import React, { useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { ImageUpload } from '@/src/components/ui/ImageUpload';
import { Plus, Edit2, Trash2, Search, CheckCircle2, X, Check, Image, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { useGameStore } from '@/src/store/gameStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { getIcon } from '@/src/utils/iconRegistry';
import { Game } from '@/src/types';

type ModalState = { mode: 'add' | 'edit'; game: Partial<Game> } | null;
type Toast = { msg: string; ok: boolean } | null;

const EMPTY_GAME: Partial<Game> = { name: '', category: '', logo: '', banner: '', status: 'active' };

const IOSToggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={cn('w-[51px] h-[31px] rounded-full relative transition-colors duration-200 flex-shrink-0', value ? 'bg-brand-success' : 'bg-app-elevated border border-ios-sep')}
  >
    <motion.div
      animate={{ x: value ? 22 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-[3px] w-[25px] h-[25px] bg-white rounded-full shadow-md"
    />
  </button>
);

export default function AdminGames() {
  const { games, addGame, updateGame, deleteGame, toggleStatus } = useGameStore();
  const { categories } = useCategoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const categoryOptions = categories.map(c => ({
    value: c.name,
    label: c.name,
    icon: getIcon(c.iconName),
  }));

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openAdd = () => setModal({ mode: 'add', game: { ...EMPTY_GAME, category: categories[0]?.name ?? '' } });
  const openEdit = (g: Game) => setModal({ mode: 'edit', game: { ...g } });

  const handleSave = () => {
    if (!modal) return;
    const { mode, game } = modal;
    if (!game.name?.trim()) { showToast('Game name is required', false); return; }
    if (!game.logo?.trim()) { showToast('Logo URL is required', false); return; }
    if (!game.banner?.trim()) { showToast('Banner URL is required', false); return; }
    if (!game.category) { showToast('Category is required', false); return; }
    if (mode === 'add') {
      addGame({ name: game.name!, category: game.category!, logo: game.logo!, banner: game.banner!, status: 'active' });
      showToast(`${game.name} added`);
    } else {
      updateGame(game.id!, { name: game.name, category: game.category, logo: game.logo, banner: game.banner, status: game.status });
      showToast(`${game.name} updated`);
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
    <div className="pb-24 pt-2 space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-[14px] text-[14px] font-medium shadow-xl flex items-center gap-2 pointer-events-none whitespace-nowrap ${toast.ok ? 'bg-brand-success text-white' : 'bg-brand-live text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Games</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">
            {games.length} total · <span className="text-brand-success">{activeCount} active</span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
        >
          <Plus size={16} /> Add Game
        </button>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search games or categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Games grid */}
      <section className="px-4 space-y-3">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filtered.length} {filtered.length === 1 ? 'game' : 'games'}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <Image size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">No games found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-app-card rounded-[18px] overflow-hidden"
              >
                {/* Banner */}
                <div className="relative h-32">
                  <img
                    src={game.banner}
                    alt={`${game.name} banner`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=60'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      'text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full backdrop-blur-sm',
                      game.status === 'active' ? 'bg-brand-success/80 text-white' : 'bg-black/50 text-white/60'
                    )}>
                      {game.status}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-[12px] border-2 border-white/20 overflow-hidden bg-black/40 shrink-0">
                      <img src={game.logo} alt={`${game.name} logo`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="font-semibold text-[14px] text-white drop-shadow">{game.name}</p>
                      <p className="text-[11px] text-white/60 uppercase">{game.category}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 text-[12px] text-text-muted mb-3">
                    <span>{game.matches} matches</span>
                    <span className="ml-auto text-[12px] text-text-muted">Active</span>
                    <IOSToggle value={game.status === 'active'} onChange={() => handleToggle(game.id)} />
                  </div>

                  {confirmDeleteId === game.id ? (
                    <div className="flex items-center gap-2 p-3 bg-brand-live/5 rounded-[12px] border border-brand-live/20">
                      <p className="flex-1 text-[13px] text-brand-live">Delete {game.name}?</p>
                      <button onClick={() => handleDelete(game.id)} className="px-3 py-1.5 bg-brand-live text-white text-[12px] font-medium rounded-[10px] active:opacity-70">Delete</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-app-elevated text-text-secondary text-[12px] font-medium rounded-[10px] active:opacity-70">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(game)}
                        className="flex-1 py-2.5 bg-brand-primary/10 text-brand-primary rounded-[12px] text-[13px] font-medium flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(game.id)}
                        className="py-2.5 px-4 bg-brand-live/10 text-brand-live rounded-[12px] text-[13px] font-medium active:opacity-70 transition-opacity"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="w-full sm:max-w-lg bg-app-card rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>

              {/* Header */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-ios-sep flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-text-primary">{modal.mode === 'add' ? 'Add Game' : 'Edit Game'}</h2>
                <button onClick={() => setModal(null)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Game Name</label>
                  <input
                    value={modal.game.name || ''}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. BGMI, Valorant…"
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                {categoryOptions.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-brand-warning/5 border border-brand-warning/20 rounded-[14px]">
                    <LayoutGrid size={16} className="text-brand-warning shrink-0" />
                    <p className="text-[13px] text-brand-warning">No categories yet — add some in Categories first.</p>
                  </div>
                ) : (
                  <CustomSelect
                    label="Category"
                    value={modal.game.category || categoryOptions[0]?.value || ''}
                    onChange={v => setField('category', v)}
                    options={categoryOptions}
                    variant="admin"
                  />
                )}

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
                  hint="Landscape image · Auto-used as match banner"
                  required
                />

                {modal.mode === 'edit' && (
                  <div className="flex items-center justify-between py-3 px-4 bg-app-elevated rounded-[14px] border border-ios-sep">
                    <span className="text-[15px] font-normal text-text-primary">Active</span>
                    <IOSToggle
                      value={modal.game.status === 'active'}
                      onChange={() => setField('status', modal.game.status === 'active' ? 'inactive' : 'active')}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-5 pt-0 flex gap-3 border-t border-ios-sep">
                <button onClick={() => setModal(null)} className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-secondary active:opacity-70 border border-ios-sep">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-[15px] font-medium text-white active:opacity-80 flex items-center gap-2 justify-center">
                  <Check size={16} /> {modal.mode === 'add' ? 'Add Game' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
