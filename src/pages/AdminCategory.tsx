import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Plus, Edit2, Trash2, Search, CheckCircle2, X, Check, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCategoryStore, Category } from '@/src/store/categoryStore';
import { ICON_OPTIONS, getIcon } from '@/src/utils/iconRegistry';
import { cn } from '@/src/utils/helpers';

type ModalState = { mode: 'add' | 'edit'; cat: Partial<Category> } | null;
type Toast = { msg: string; ok: boolean } | null;

export default function AdminCategory() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openAdd = () => setModal({ mode: 'add', cat: { name: '', iconName: 'Gamepad2' } });
  const openEdit = (c: Category) => setModal({ mode: 'edit', cat: { ...c } });

  const handleSave = () => {
    if (!modal) return;
    const { mode, cat } = modal;
    if (!cat.name?.trim()) { showToast('Category name is required', false); return; }
    if (!cat.iconName) { showToast('Please select an icon', false); return; }

    if (mode === 'add') {
      const exists = categories.some(c => c.name.toLowerCase() === cat.name!.trim().toLowerCase());
      if (exists) { showToast('Category already exists', false); return; }
      addCategory({ name: cat.name!.trim(), iconName: cat.iconName! });
      showToast(`"${cat.name}" added`);
    } else {
      updateCategory(cat.id!, { name: cat.name!.trim(), iconName: cat.iconName! });
      showToast(`"${cat.name}" updated`);
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    deleteCategory(id);
    setConfirmDeleteId(null);
    showToast(`"${cat?.name}" deleted`);
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-black tracking-tight">Categories</h1>
          <p className="text-xs text-slate-500 font-bold">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} · used in game management
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="rounded-xl px-4 flex items-center gap-2 flex-shrink-0">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center text-slate-600">
          <LayoutGrid size={40} />
          <div>
            <p className="font-bold">
              {categories.length === 0 ? 'No categories yet' : 'No categories match your search'}
            </p>
            {categories.length === 0 && (
              <p className="text-xs mt-1">Add categories so admins can tag games by type</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat, i) => {
            const Icon = getIcon(cat.iconName);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="p-4 bg-brand-card/40 border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={22} className="text-brand-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{cat.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{cat.iconName}</p>
                  </div>

                  {confirmDeleteId === cat.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg active:opacity-70"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2 bg-white/5 hover:bg-brand-blue/10 hover:text-brand-blue text-slate-400 rounded-xl transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(cat.id)}
                        className="p-2 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
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
              className="w-full sm:max-w-lg bg-[#0f0f14] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-shrink-0 px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-black">{modal.mode === 'add' ? 'Add Category' : 'Edit Category'}</h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category Name *</label>
                  <input
                    value={modal.cat.name || ''}
                    onChange={e => setModal(m => m ? { ...m, cat: { ...m.cat, name: e.target.value } } : m)}
                    placeholder="e.g. Battle Royale, FPS, MOBA..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Icon *</label>

                  {modal.cat.iconName && (() => {
                    const SelectedIcon = getIcon(modal.cat.iconName!);
                    return (
                      <div className="flex items-center gap-3 p-3 bg-brand-blue/10 border border-brand-blue/20 rounded-xl mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center">
                          <SelectedIcon size={20} className="text-brand-blue" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-brand-blue">Selected: {modal.cat.iconName}</p>
                          <p className="text-[10px] text-slate-500">Pick a different icon below</p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-5 gap-2">
                    {ICON_OPTIONS.map(({ name, label }) => {
                      const Icon = getIcon(name);
                      const isSelected = modal.cat.iconName === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setModal(m => m ? { ...m, cat: { ...m.cat, iconName: name } } : m)}
                          title={label}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all',
                            isSelected
                              ? 'bg-brand-blue/20 border-brand-blue text-brand-blue'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                          )}
                        >
                          <Icon size={20} />
                          <span className="text-[9px] font-bold leading-none truncate w-full text-center">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 p-5 pt-0 flex gap-3">
                <Button variant="secondary" onClick={() => setModal(null)} className="flex-1 rounded-xl border-white/10">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                  <Check size={15} /> {modal.mode === 'add' ? 'Add Category' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
