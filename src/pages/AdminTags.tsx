import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Code, Plus, Trash2, Edit2, Copy, Check, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type Tag = { id: string; name: string; type: string; content: string; status: string };
type Modal = { mode: 'edit'; tag: Tag } | null;
type Toast = { msg: string; ok: boolean } | null;

const INITIAL: Tag[] = [
  { id: '1', name: 'Google Ads Sidebar', type: 'HTML/JS', content: '<script src="https://ads.google.com/..." async></script>', status: 'active' },
  { id: '2', name: 'Facebook Pixel',     type: 'JS',      content: 'fbq("init", "123456789"); fbq("track", "PageView");',       status: 'active' },
  { id: '3', name: 'Affiliate Banner',   type: 'HTML',    content: '<a href="https://affiliate.com"><img src="..." /></a>',        status: 'inactive' },
];

export default function AdminTags() {
  const [tags, setTags]                     = useState<Tag[]>(INITIAL);
  const [copiedId, setCopiedId]             = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [modal, setModal]                   = useState<Modal>(null);
  const [settings, setSettings]             = useState({ adblock: false });
  const [toast, setToast]                   = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Code copied to clipboard');
  };

  const handleDelete = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    setConfirmDeleteId(null);
    showToast('Tag deleted');
  };

  const toggleStatus = (id: string) => {
    setTags(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t
    ));
  };

  const addTag = () => {
    const newTag: Tag = {
      id: Math.random().toString(36).slice(2),
      name: 'New Ad Tag',
      type: 'HTML',
      content: '<!-- Paste your ad tag code here -->',
      status: 'inactive',
    };
    setTags(prev => [...prev, newTag]);
    setModal({ mode: 'edit', tag: newTag });
  };

  const handleSave = () => {
    if (!modal) return;
    setTags(prev => prev.map(t => t.id === modal.tag.id ? modal.tag : t));
    setModal(null);
    showToast('Tag saved successfully');
  };

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
          <h1 className="text-2xl font-black tracking-tight">Ad Tags & Links</h1>
          <p className="text-xs text-slate-500 font-bold">{tags.filter(t => t.status === 'active').length} active tags</p>
        </div>
        <Button onClick={addTag} size="sm" className="rounded-xl px-4 flex items-center gap-2">
          <Plus size={16} /> New Tag
        </Button>
      </div>

      {/* Tag Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tags.map((tag, i) => (
          <motion.div key={tag.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Code size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">{tag.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tag.type}</span>
                      <button onClick={() => toggleStatus(tag.id)}
                        className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full',
                          tag.status === 'active' ? 'bg-brand-green/10 text-brand-green' : 'bg-white/5 text-slate-400')}>
                        {tag.status}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal({ mode: 'edit', tag: { ...tag } })}
                    className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(tag.id)}
                    className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-red hover:bg-brand-red/10 transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-black/40 p-4 rounded-2xl text-[11px] font-mono text-slate-400 overflow-x-auto border border-white/5 max-h-[120px] scrollable-content">
                  {tag.content}
                </pre>
                <button onClick={() => handleCopy(tag.id, tag.content)}
                  className="absolute top-3 right-3 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md border border-white/10">
                  {copiedId === tag.id ? <Check size={14} className="text-brand-green" /> : <Copy size={14} />}
                </button>
              </div>

              {confirmDeleteId === tag.id && (
                <div className="flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20">
                  <p className="flex-1 text-xs font-bold text-brand-red">Delete "{tag.name}"?</p>
                  <button onClick={() => handleDelete(tag.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Global Ad Settings */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Global Ad Settings</h2>
        <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Enable Ad-Block Detection</p>
              <p className="text-xs text-slate-500">Show a message to users with ad-blockers</p>
            </div>
            <button onClick={() => setSettings(s => ({ ...s, adblock: !s.adblock }))}
              className={cn('w-12 h-6 rounded-full relative transition-colors flex-shrink-0', settings.adblock ? 'bg-brand-blue' : 'bg-white/10')}>
              <motion.div animate={{ x: settings.adblock ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Ad Frequency Cap</p>
              <p className="text-xs text-slate-500">Limit how many ads a user sees per session</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">3 ads</span>
              <ChevronRight size={16} className="text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-black">Edit Tag</h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tag Name</label>
                  <input value={modal.tag.name} onChange={e => setModal(m => m ? { ...m, tag: { ...m.tag, name: e.target.value } } : m)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tag Code</label>
                  <textarea value={modal.tag.content} onChange={e => setModal(m => m ? { ...m, tag: { ...m.tag, content: e.target.value } } : m)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono outline-none focus:border-brand-blue transition-all min-h-[120px] resize-none" />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setModal(null)} className="flex-1 rounded-xl border-white/10">Cancel</Button>
                  <Button onClick={handleSave} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                    <Check size={15} /> Save Tag
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
