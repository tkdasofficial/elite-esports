import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, CheckCircle2, X, Check, BookOpen, GripVertical, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformStore, Rule } from '@/src/store/platformStore';
import { cn } from '@/src/utils/helpers';

type ModalState = { mode: 'add' | 'edit'; rule: Partial<Rule> } | null;
type Toast = { msg: string; ok: boolean } | null;

export default function AdminRules() {
  const { rules, addRule, updateRule, deleteRule } = usePlatformStore();
  const [search, setSearch]                        = useState('');
  const [modal, setModal]                          = useState<ModalState>(null);
  const [expandedId, setExpandedId]                = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId]      = useState<string | null>(null);
  const [toast, setToast]                          = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openAdd  = () => setModal({ mode: 'add',  rule: { title: '', content: '', category: 'general', order: rules.length + 1 } });
  const openEdit = (r: Rule) => setModal({ mode: 'edit', rule: { ...r } });

  const handleSave = () => {
    if (!modal) return;
    const { mode, rule } = modal;
    if (!rule.title?.trim())   { showToast('Title is required', false); return; }
    if (!rule.content?.trim()) { showToast('Content is required', false); return; }
    if (mode === 'add') {
      addRule({ title: rule.title!.trim(), content: rule.content!.trim(), category: rule.category ?? 'general', order: Number(rule.order) });
      showToast(`Rule added`);
    } else {
      updateRule(rule.id!, { title: rule.title!.trim(), content: rule.content!.trim(), category: rule.category ?? 'general', order: Number(rule.order) });
      showToast('Rule updated');
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    deleteRule(id);
    setConfirmDeleteId(null);
    showToast('Rule deleted');
  };

  const setField = (key: keyof Rule, value: any) =>
    setModal(m => m ? { ...m, rule: { ...m.rule, [key]: value } } : m);

  const filtered = (rules ?? []).filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.content.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    general:    'bg-brand-primary/10 text-brand-primary',
    gameplay:   'bg-brand-success/10 text-brand-success',
    fair_play:  'bg-brand-warning/10 text-brand-warning',
    conduct:    'bg-brand-live/10 text-brand-live',
  };

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
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Rules</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">{rules?.length ?? 0} tournament rules</p>
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
            placeholder="Search rules..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* List */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filtered.length} {filtered.length === 1 ? 'rule' : 'rules'}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <BookOpen size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">
              {(rules?.length ?? 0) === 0 ? 'No rules yet' : 'No rules match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-app-card rounded-[18px] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                >
                  <span className="text-[13px] font-semibold text-text-muted w-6 shrink-0">#{rule.order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-text-primary">{rule.title}</p>
                    <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full capitalize mt-1 inline-block', categoryColors[rule.category] ?? 'bg-app-elevated text-text-muted')}>{rule.category.replace('_', ' ')}</span>
                  </div>
                  <ChevronDown size={16} className={cn('text-text-muted transition-transform shrink-0', expandedId === rule.id && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {expandedId === rule.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-ios-sep pt-3">
                        <p className="text-[14px] text-text-muted leading-relaxed">{rule.content}</p>

                        {confirmDeleteId === rule.id ? (
                          <div className="flex items-center gap-2 p-3 bg-brand-live/5 rounded-[12px] border border-brand-live/20">
                            <p className="flex-1 text-[13px] text-brand-live">Delete this rule?</p>
                            <button onClick={() => handleDelete(rule.id)} className="px-3 py-1.5 bg-brand-live text-white text-[12px] font-medium rounded-[10px] active:opacity-70">Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-app-elevated text-text-secondary text-[12px] font-medium rounded-[10px] active:opacity-70 border border-ios-sep">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(rule)}
                              className="flex-1 py-2.5 bg-brand-primary/10 text-brand-primary rounded-[12px] text-[13px] font-medium flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(rule.id)}
                              className="py-2.5 px-4 bg-brand-live/10 text-brand-live rounded-[12px] text-[13px] font-medium active:opacity-70 transition-opacity"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
              className="w-full sm:max-w-lg bg-app-card rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-ios-sep">
                <h2 className="text-[18px] font-semibold text-text-primary">{modal.mode === 'add' ? 'Add Rule' : 'Edit Rule'}</h2>
                <button onClick={() => setModal(null)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60"><X size={15} /></button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Title</label>
                  <input
                    value={modal.rule.title || ''}
                    onChange={e => setField('title', e.target.value)}
                    placeholder="Rule title..."
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['general', 'gameplay', 'fair_play', 'conduct'].map(c => (
                      <button
                        key={c}
                        onClick={() => setField('category', c)}
                        className={cn(
                          'py-2.5 px-3 rounded-[12px] text-[13px] font-medium capitalize border transition-all',
                          modal.rule.category === c
                            ? (categoryColors[c] ?? 'bg-app-elevated text-text-secondary') + ' border-current'
                            : 'bg-app-elevated border-ios-sep text-text-secondary'
                        )}
                      >
                        {c.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Order</label>
                  <input
                    type="number"
                    value={modal.rule.order || ''}
                    onChange={e => setField('order', Number(e.target.value))}
                    placeholder="1"
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Content</label>
                  <textarea
                    value={modal.rule.content || ''}
                    onChange={e => setField('content', e.target.value)}
                    placeholder="Describe the rule..."
                    rows={5}
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 p-5 pt-4 flex gap-3 border-t border-ios-sep">
                <button onClick={() => setModal(null)} className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-secondary active:opacity-70 border border-ios-sep">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-[15px] font-medium text-white active:opacity-80 flex items-center gap-2 justify-center">
                  <Check size={16} /> {modal.mode === 'add' ? 'Add Rule' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
