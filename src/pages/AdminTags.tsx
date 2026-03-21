import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Code, Plus, Trash2, Edit2, Copy, Check, X, CheckCircle2, Minus, Globe, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type TagType = 'HTML' | 'JS' | 'HTML/JS' | 'CSS' | 'Other';
type Tag = { id: string; name: string; type: TagType; content: string; status: 'active' | 'inactive'; placement: string };
type Toast = { msg: string; ok: boolean } | null;

const TAG_TYPES: TagType[] = ['HTML', 'JS', 'HTML/JS', 'CSS', 'Other'];
const PLACEMENTS = ['<head>', '<body>', 'After opening <body>', 'Before closing </body>', 'Sidebar', 'Footer'];

const INITIAL: Tag[] = [
  {
    id: '1', name: 'Google Ads Sidebar', type: 'HTML/JS', status: 'active', placement: 'Sidebar',
    content: '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossorigin="anonymous"></script>\n<!-- Ad slot -->\n<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXX" data-ad-slot="XXXXXXXXXX"></ins>',
  },
  {
    id: '2', name: 'Facebook Pixel', type: 'JS', status: 'active', placement: '<head>',
    content: '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nf._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window,document,"script",\n"https://connect.facebook.net/en_US/fbevents.js");\nfbq("init","123456789012345");\nfbq("track","PageView");',
  },
  {
    id: '3', name: 'Affiliate Banner', type: 'HTML', status: 'inactive', placement: 'Footer',
    content: '<a href="https://affiliate.partner.com/ref/elite" target="_blank" rel="noopener">\n  <img src="https://cdn.partner.com/banner_728x90.png" width="728" height="90" alt="Partner Ad" />\n</a>',
  },
];

const typeColor: Record<TagType, string> = {
  'HTML':    'bg-orange-500/10 text-orange-400',
  'JS':      'bg-yellow-500/10 text-yellow-400',
  'HTML/JS': 'bg-brand-blue/10 text-brand-blue',
  'CSS':     'bg-purple-400/10 text-purple-400',
  'Other':   'bg-slate-500/10 text-slate-400',
};

export default function AdminTags() {
  const [tags, setTags]         = useState<Tag[]>(INITIAL);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [modal, setModal]       = useState<{ isNew: boolean; tag: Tag } | null>(null);
  const [toast, setToast]       = useState<Toast>(null);
  const [adblock, setAdblock]   = useState(false);
  const [freqCap, setFreqCap]   = useState(3);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
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
    const tag = tags.find(t => t.id === id);
    setTags(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t));
    showToast(`${tag?.name} ${tag?.status === 'active' ? 'deactivated' : 'activated'}`);
  };

  const openNew = () => {
    setModal({
      isNew: true,
      tag: { id: Math.random().toString(36).slice(2), name: '', type: 'HTML', content: '', status: 'inactive', placement: '<head>' },
    });
  };

  const openEdit = (tag: Tag) => {
    setModal({ isNew: false, tag: { ...tag } });
  };

  const handleSave = () => {
    if (!modal) return;
    if (!modal.tag.name.trim()) { showToast('Tag name is required', false); return; }
    if (!modal.tag.content.trim()) { showToast('Tag code cannot be empty', false); return; }

    if (modal.isNew) {
      setTags(prev => [...prev, modal.tag]);
      showToast('Tag added successfully');
    } else {
      setTags(prev => prev.map(t => t.id === modal.tag.id ? modal.tag : t));
      showToast('Tag updated successfully');
    }
    setModal(null);
  };

  const updateModal = (patch: Partial<Tag>) =>
    setModal(m => m ? { ...m, tag: { ...m.tag, ...patch } } : m);

  const active   = tags.filter(t => t.status === 'active').length;
  const inactive = tags.filter(t => t.status === 'inactive').length;

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ad Tags & Links</h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">{active} active · {inactive} inactive</p>
        </div>
        <Button onClick={openNew} size="sm" className="rounded-xl px-4 flex items-center gap-2">
          <Plus size={16} /> New Tag
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 bg-brand-green/5 border-brand-green/10 text-center">
          <p className="text-[10px] font-black text-brand-green uppercase tracking-widest opacity-70">Active</p>
          <p className="text-2xl font-black text-brand-green mt-1">{active}</p>
        </Card>
        <Card className="p-4 bg-white/5 border-white/5 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">Inactive</p>
          <p className="text-2xl font-black text-slate-400 mt-1">{inactive}</p>
        </Card>
        <Card className="p-4 bg-brand-blue/5 border-brand-blue/10 text-center">
          <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest opacity-70">Total</p>
          <p className="text-2xl font-black text-brand-blue mt-1">{tags.length}</p>
        </Card>
      </div>

      {/* Tag List */}
      <div className="space-y-3">
        {tags.length === 0 && (
          <div className="py-14 text-center text-slate-500 text-sm font-bold">No tags yet. Add your first ad tag.</div>
        )}
        <AnimatePresence>
          {tags.map((tag, i) => (
            <motion.div key={tag.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-4 bg-brand-card/40 border-white/5 space-y-3">
                {/* Tag header */}
                <div className="flex items-start gap-3">
                  <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', typeColor[tag.type])}>
                    <Code size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm">{tag.name}</h3>
                      <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full', typeColor[tag.type])}>
                        {tag.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold">Placement: {tag.placement}</span>
                      <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full',
                        tag.status === 'active' ? 'bg-brand-green/10 text-brand-green' : 'bg-white/5 text-slate-500')}>
                        {tag.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Code preview */}
                <div className="relative">
                  <pre className="bg-black/50 p-3 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto border border-white/5 max-h-[90px] scrollable-content leading-relaxed">
                    {tag.content}
                  </pre>
                  <button
                    onClick={() => handleCopy(tag.id, tag.content)}
                    className="absolute top-2 right-2 p-1.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md border border-white/10"
                    title="Copy code"
                  >
                    {copiedId === tag.id ? <Check size={13} className="text-brand-green" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* Action buttons — always visible, not hidden on hover */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openEdit(tag)}
                    className="py-2 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(tag.id)}
                    className={cn(
                      'py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5',
                      tag.status === 'active'
                        ? 'bg-white/5 text-slate-400 hover:bg-brand-yellow/10 hover:text-brand-yellow'
                        : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                    )}
                  >
                    {tag.status === 'active' ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                    {tag.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(tag.id)}
                    className="py-2 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                {/* Inline delete confirm */}
                {confirmDeleteId === tag.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20"
                  >
                    <p className="flex-1 text-xs font-bold text-brand-red">Delete "{tag.name}"?</p>
                    <button onClick={() => handleDelete(tag.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global Ad Settings */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Global Ad Settings</h2>
        <Card className="p-5 bg-brand-card/40 border-white/5 space-y-5">
          {/* Ad-Block Detection */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold">Enable Ad-Block Detection</p>
              <p className="text-xs text-slate-500">Show a message to users with ad-blockers</p>
            </div>
            <button
              onClick={() => { setAdblock(v => !v); showToast(`Ad-block detection ${!adblock ? 'enabled' : 'disabled'}`); }}
              className={cn('w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0', adblock ? 'bg-brand-blue' : 'bg-white/10')}
            >
              <motion.div
                animate={{ x: adblock ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
          </div>

          {/* Frequency Cap */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold">Ad Frequency Cap</p>
              <p className="text-xs text-slate-500">Max ads shown per user per session</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setFreqCap(v => Math.max(1, v - 1))}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-300 transition-colors active:scale-90"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-black">{freqCap}</span>
              <button
                onClick={() => setFreqCap(v => Math.min(20, v + 1))}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-300 transition-colors active:scale-90"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <Button
            onClick={() => showToast('Ad settings saved')}
            size="sm"
            className="rounded-xl w-full flex items-center gap-2 justify-center"
          >
            <Check size={15} /> Save Ad Settings
          </Button>
        </Card>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full sm:max-w-lg bg-[#1a1a2e] border border-white/10 rounded-t-[28px] sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
                <h2 className="text-lg font-black">{modal.isNew ? 'Add New Tag' : 'Edit Tag'}</h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Modal body — scrollable */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tag Name *</label>
                  <input
                    value={modal.tag.name}
                    onChange={e => updateModal({ name: e.target.value })}
                    placeholder="e.g. Google Ads Sidebar"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Type + Status row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Type</label>
                    <select
                      value={modal.tag.type}
                      onChange={e => updateModal({ type: e.target.value as TagType })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-3 text-sm font-bold outline-none focus:border-brand-blue transition-all"
                    >
                      {TAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
                    <button
                      onClick={() => updateModal({ status: modal.tag.status === 'active' ? 'inactive' : 'active' })}
                      className={cn(
                        'w-full rounded-xl py-3 px-3 text-sm font-bold transition-all text-left',
                        modal.tag.status === 'active' ? 'bg-brand-green/10 text-brand-green' : 'bg-white/5 text-slate-400'
                      )}
                    >
                      {modal.tag.status === 'active' ? '● Active' : '○ Inactive'}
                    </button>
                  </div>
                </div>

                {/* Placement */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Placement</label>
                  <select
                    value={modal.tag.placement}
                    onChange={e => updateModal({ placement: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-3 text-sm font-bold outline-none focus:border-brand-blue transition-all"
                  >
                    {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tag Code *</label>
                  <textarea
                    value={modal.tag.content}
                    onChange={e => updateModal({ content: e.target.value })}
                    placeholder="Paste your ad tag / tracking code here..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-[12px] font-mono outline-none focus:border-brand-blue transition-all resize-none placeholder:text-slate-600 scrollable-content"
                    style={{ minHeight: '140px' }}
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 p-5 border-t border-white/5 flex-shrink-0">
                <Button variant="secondary" onClick={() => setModal(null)} className="flex-1 rounded-xl border-white/10">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                  <Check size={15} /> {modal.isNew ? 'Add Tag' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
