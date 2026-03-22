import React, { useState } from 'react';
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

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

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
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Categories</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Category list */}
      <section className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <LayoutGrid size={24} className="text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-[15px] text-text-primary font-normal">
                {categories.length === 0 ? 'No categories yet' : 'No results found'}
              </p>
              {categories.length === 0 && (
                <p className="text-[13px] text-text-muted mt-1">Add categories to tag games by type</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-app-card rounded-[18px] overflow-hidden divide-y divide-app-border">
            {filtered.map((cat, i) => {
              const Icon = getIcon(cat.iconName);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-normal text-text-primary truncate">{cat.name}</p>
                    <p className="text-[12px] text-text-muted mt-0.5">{cat.iconName}</p>
                  </div>

                  {confirmDeleteId === cat.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleDelete(cat.id)} className="px-3 py-1.5 bg-brand-live text-white text-[12px] font-medium rounded-[10px] active:opacity-70">Delete</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-app-elevated text-text-secondary text-[12px] font-medium rounded-[10px] active:opacity-70 border border-ios-sep">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEdit(cat)}
                        className="w-9 h-9 bg-brand-primary/10 rounded-[12px] text-brand-primary flex items-center justify-center active:opacity-60 transition-opacity"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(cat.id)}
                        className="w-9 h-9 bg-brand-live/10 rounded-[12px] text-brand-live flex items-center justify-center active:opacity-60 transition-opacity"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
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
              className="w-full sm:max-w-lg bg-app-card rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[88vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>

              {/* Header */}
              <div className="flex-shrink-0 px-5 py-4 border-b border-ios-sep flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-text-primary">
                  {modal.mode === 'add' ? 'Add Category' : 'Edit Category'}
                </h2>
                <button onClick={() => setModal(null)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Category Name</label>
                  <input
                    value={modal.cat.name || ''}
                    onChange={e => setModal(m => m ? { ...m, cat: { ...m.cat, name: e.target.value } } : m)}
                    placeholder="e.g. Battle Royale, FPS, MOBA..."
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Icon</label>

                  {modal.cat.iconName && (() => {
                    const SelectedIcon = getIcon(modal.cat.iconName!);
                    return (
                      <div className="flex items-center gap-3 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-[14px]">
                        <div className="w-10 h-10 rounded-[12px] bg-brand-primary/10 flex items-center justify-center">
                          <SelectedIcon size={20} className="text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-brand-primary">Selected: {modal.cat.iconName}</p>
                          <p className="text-[12px] text-text-muted">Pick a different icon below</p>
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
                            'flex flex-col items-center gap-1.5 p-2.5 rounded-[12px] border transition-all',
                            isSelected
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                              : 'bg-app-elevated border-ios-sep text-text-muted active:opacity-60'
                          )}
                        >
                          <Icon size={20} />
                          <span className="text-[9px] font-medium leading-none truncate w-full text-center">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-5 pt-4 flex gap-3 border-t border-ios-sep">
                <button onClick={() => setModal(null)} className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-secondary active:opacity-70 border border-ios-sep">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-[15px] font-medium text-white active:opacity-80 flex items-center gap-2 justify-center">
                  <Check size={16} /> {modal.mode === 'add' ? 'Add Category' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
