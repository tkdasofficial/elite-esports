import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, CheckCircle2, X, Check, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformStore, MatchTag } from '@/src/store/platformStore';
import { cn } from '@/src/utils/helpers';

type ModalState = { mode: 'add' | 'edit'; tag: Partial<MatchTag> } | null;
type Toast = { msg: string; ok: boolean } | null;

const COLOR_PRESETS = [
  { label: 'Blue',    value: '#3B82F6' },
  { label: 'Green',   value: '#22C55E' },
  { label: 'Red',     value: '#EF4444' },
  { label: 'Yellow',  value: '#EAB308' },
  { label: 'Purple',  value: '#A855F7' },
  { label: 'Orange',  value: '#F97316' },
  { label: 'Cyan',    value: '#06B6D4' },
  { label: 'Pink',    value: '#EC4899' },
];

export default function AdminTags() {
  const { matchTags, addMatchTag, updateMatchTag, deleteMatchTag } = usePlatformStore();
  const [search, setSearch]                   = useState('');
  const [modal, setModal]                     = useState<ModalState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]                     = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openAdd  = () => setModal({ mode: 'add',  tag: { name: '', color: COLOR_PRESETS[0].value, description: '' } });
  const openEdit = (t: MatchTag) => setModal({ mode: 'edit', tag: { ...t } });

  const handleSave = () => {
    if (!modal) return;
    const { mode, tag } = modal;
    if (!tag.name?.trim())  { showToast('Tag name is required', false); return; }
    if (!tag.color?.trim()) { showToast('Color is required', false); return; }

    if (mode === 'add') {
      const exists = (matchTags ?? []).some(t => t.name.toLowerCase() === tag.name!.trim().toLowerCase());
      if (exists) { showToast('Tag already exists', false); return; }
      addMatchTag({ name: tag.name!.trim(), color: tag.color!, description: tag.description ?? '' });
      showToast(`"${tag.name}" tag created`);
    } else {
      updateMatchTag(tag.id!, { name: tag.name!.trim(), color: tag.color!, description: tag.description ?? '' });
      showToast('Tag updated');
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    const t = (matchTags ?? []).find(t => t.id === id);
    deleteMatchTag(id);
    setConfirmDeleteId(null);
    showToast(`"${t?.name}" deleted`);
  };

  const setField = (key: keyof MatchTag, value: any) =>
    setModal(m => m ? { ...m, tag: { ...m.tag, [key]: value } } : m);

  const filtered = useMemo(() =>
    (matchTags ?? []).filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description?.toLowerCase().includes(search.toLowerCase()))
    ),
    [matchTags, search]
  );

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
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Match Tags</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">{matchTags?.length ?? 0} tags</p>
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
            placeholder="Search tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Tag list */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filtered.length} {filtered.length === 1 ? 'tag' : 'tags'}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <Tag size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">
              {(matchTags?.length ?? 0) === 0 ? 'No tags yet' : 'No tags match your search'}
            </p>
          </div>
        ) : (
          <div className="bg-app-card rounded-[18px] overflow-hidden divide-y divide-app-border">
            {filtered.map((tag, i) => (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3.5 px-4 py-3.5"
              >
                {/* Color dot + pill preview */}
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: tag.color + '22' }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: tag.color + '22', color: tag.color }}>
                      {tag.name}
                    </span>
                  </div>
                  {tag.description && (
                    <p className="text-[12px] text-text-muted mt-0.5 truncate">{tag.description}</p>
                  )}
                </div>

                {confirmDeleteId === tag.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleDelete(tag.id)} className="px-2.5 py-1.5 bg-brand-live text-white text-[12px] font-medium rounded-[10px] active:opacity-70">Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1.5 bg-app-elevated text-text-secondary text-[12px] font-medium rounded-[10px] active:opacity-70 border border-ios-sep">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEdit(tag)} className="w-9 h-9 bg-brand-primary/10 rounded-[12px] text-brand-primary flex items-center justify-center active:opacity-60 transition-opacity">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(tag.id)} className="w-9 h-9 bg-brand-live/10 rounded-[12px] text-brand-live flex items-center justify-center active:opacity-60 transition-opacity">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="w-full sm:max-w-lg bg-app-card rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[88vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-ios-sep">
                <h2 className="text-[18px] font-semibold text-text-primary">{modal.mode === 'add' ? 'Create Tag' : 'Edit Tag'}</h2>
                <button onClick={() => setModal(null)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60"><X size={15} /></button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
                {/* Preview */}
                {modal.tag.name && (
                  <div className="flex items-center justify-center py-4">
                    <span
                      className="text-[14px] font-semibold px-4 py-2 rounded-full"
                      style={{ backgroundColor: (modal.tag.color ?? '#3B82F6') + '22', color: modal.tag.color ?? '#3B82F6' }}
                    >
                      {modal.tag.name}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Tag Name</label>
                  <input
                    value={modal.tag.name || ''}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. Featured, Hot, New…"
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setField('color', c.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-2.5 rounded-[12px] border transition-all',
                          modal.tag.color === c.value ? 'border-brand-primary bg-brand-primary/5' : 'border-ios-sep bg-app-elevated'
                        )}
                      >
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.value }} />
                        <span className="text-[10px] text-text-muted">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] text-text-muted shrink-0">Custom:</label>
                    <input
                      type="color"
                      value={modal.tag.color || '#3B82F6'}
                      onChange={e => setField('color', e.target.value)}
                      className="w-10 h-10 rounded-[10px] cursor-pointer border border-ios-sep bg-app-elevated p-1"
                    />
                    <span className="text-[13px] font-mono text-text-muted">{modal.tag.color}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Description <span className="text-text-muted normal-case tracking-normal">(optional)</span></label>
                  <input
                    value={modal.tag.description || ''}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="Brief description of this tag..."
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 p-5 pt-4 flex gap-3 border-t border-ios-sep">
                <button onClick={() => setModal(null)} className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-secondary active:opacity-70 border border-ios-sep">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-[15px] font-medium text-white active:opacity-80 flex items-center gap-2 justify-center">
                  <Check size={16} /> {modal.mode === 'add' ? 'Create Tag' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
