import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  FileText, Plus, Edit2, Trash2, Save, Eye, CheckCircle2,
  X, Globe, ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type Status = 'published' | 'draft';
type Policy = { id: string; title: string; lastUpdated: string; status: Status; content: string };
type ModalMode = 'edit' | 'preview' | null;
type Toast = { msg: string; ok: boolean } | null;

const INITIAL: Policy[] = [
  { id: '1', title: 'Tournament Rules',  lastUpdated: '20 Mar, 10:30 AM', status: 'published', content: '# Tournament Rules\n\n1. Players must be registered before the match start time.\n2. No cheating or use of hacks/exploits.\n3. Respect all opponents and admins.\n4. Teams must be present 10 minutes before start.\n5. Fair play is mandatory — violations lead to disqualification.' },
  { id: '2', title: 'Privacy Policy',    lastUpdated: '15 Mar, 09:15 AM', status: 'published', content: '# Privacy Policy\n\nWe value your privacy. This policy explains how we collect and use your data.\n\n## What we collect\n- Username and email address\n- Match history and wallet transactions\n- Device info for fraud detection\n\n## How we use it\nWe use your data only to operate the platform and improve your experience.' },
  { id: '3', title: 'Terms of Service',  lastUpdated: '10 Mar, 08:00 PM', status: 'published', content: '# Terms of Service\n\nBy using Elite Esports you agree to the following terms.\n\n## Eligibility\nYou must be 13 years or older to use this platform.\n\n## Account\nYou are responsible for keeping your account secure.\n\n## Conduct\nAny form of abuse or cheating results in permanent ban.' },
  { id: '4', title: 'Refund Policy',     lastUpdated: '05 Mar, 04:30 PM', status: 'draft',     content: '# Refund Policy\n\nRefunds are processed within 7 working days.\n\n## Eligibility\n- Entry fee refunds are only given if a match is cancelled by admin.\n- Wallet deposits are non-refundable once used in a tournament.' },
];

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('# '))       { nodes.push(<h1 key={key++} className="text-2xl font-black mb-3 mt-2">{line.slice(2)}</h1>); continue; }
    if (line.startsWith('## '))      { nodes.push(<h2 key={key++} className="text-lg font-black mb-2 mt-4 text-brand-blue">{line.slice(3)}</h2>); continue; }
    if (line.startsWith('### '))     { nodes.push(<h3 key={key++} className="text-base font-bold mb-1 mt-3">{line.slice(4)}</h3>); continue; }
    if (/^\d+\.\s/.test(line))       { nodes.push(<p key={key++} className="text-sm text-slate-300 mb-1 pl-4">{line}</p>); continue; }
    if (line.startsWith('- '))       { nodes.push(<p key={key++} className="text-sm text-slate-300 mb-1 pl-4">• {line.slice(2)}</p>); continue; }
    if (line.trim() === '')          { nodes.push(<div key={key++} className="h-2" />); continue; }
    nodes.push(<p key={key++} className="text-sm text-slate-300 mb-1 leading-relaxed">{line}</p>);
  }
  return nodes;
}

export default function AdminRules() {
  const [policies, setPolicies] = useState<Policy[]>(INITIAL);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Policy | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openEdit = (policy: Policy) => {
    setEditing({ ...policy });
    setModalMode('edit');
  };

  const openPreview = (policy: Policy) => {
    setEditing({ ...policy });
    setModalMode('preview');
  };

  const openNew = () => {
    const blank: Policy = {
      id: Math.random().toString(36).slice(2),
      title: '',
      lastUpdated: 'Just now',
      status: 'draft',
      content: '# New Policy\n\nWrite your policy content here...',
    };
    setEditing(blank);
    setModalMode('edit');
  };

  const handleSaveDraft = () => {
    if (!editing) return;
    if (!editing.title.trim()) { showToast('Title is required', false); return; }
    const now = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const updated = { ...editing, lastUpdated: now, status: 'draft' as Status };
    setPolicies(prev =>
      prev.find(p => p.id === updated.id)
        ? prev.map(p => p.id === updated.id ? updated : p)
        : [...prev, updated]
    );
    setModalMode(null);
    showToast('Draft saved successfully');
  };

  const handlePublish = (id: string) => {
    const now = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, status: 'published', lastUpdated: now } : p));
    showToast('Policy published successfully');
  };

  const handleUnpublish = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, status: 'draft' } : p));
    showToast('Policy moved back to draft');
  };

  const handlePublishFromModal = () => {
    if (!editing) return;
    if (!editing.title.trim()) { showToast('Title is required', false); return; }
    const now = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const updated = { ...editing, lastUpdated: now, status: 'published' as Status };
    setPolicies(prev =>
      prev.find(p => p.id === updated.id)
        ? prev.map(p => p.id === updated.id ? updated : p)
        : [...prev, updated]
    );
    setModalMode(null);
    showToast('Policy published successfully');
  };

  const handleDelete = (id: string) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
    setConfirmDeleteId(null);
    showToast('Policy deleted');
  };

  const published = policies.filter(p => p.status === 'published').length;
  const drafts    = policies.filter(p => p.status === 'draft').length;

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
          <h1 className="text-2xl font-black tracking-tight">Rules & Policies</h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            {published} published · {drafts} draft{drafts !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="rounded-xl px-4 flex items-center gap-2">
          <Plus size={16} /> New Policy
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-brand-green/5 border-brand-green/10">
          <p className="text-[10px] font-black text-brand-green uppercase tracking-widest opacity-70">Published</p>
          <p className="text-3xl font-black text-brand-green mt-1">{published}</p>
        </Card>
        <Card className="p-4 bg-brand-yellow/5 border-brand-yellow/10">
          <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest opacity-70">Drafts</p>
          <p className="text-3xl font-black text-brand-yellow mt-1">{drafts}</p>
        </Card>
      </div>

      {/* Policy List */}
      <div className="space-y-3">
        {policies.length === 0 && (
          <div className="py-14 text-center text-slate-500 text-sm font-bold">No policies yet. Create your first one.</div>
        )}
        <AnimatePresence>
          {policies.map((policy, i) => (
            <motion.div key={policy.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
              <Card className="bg-brand-card/40 border-white/5 overflow-hidden">
                {/* Card header row */}
                <div className="flex items-center gap-3 p-4">
                  <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                    policy.status === 'published' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'
                  )}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm truncate">{policy.title}</h3>
                      <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0',
                        policy.status === 'published' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-yellow/15 text-brand-yellow'
                      )}>
                        {policy.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Updated: {policy.lastUpdated}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === policy.id ? null : policy.id)}
                    className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-white/10 transition-colors flex-shrink-0"
                  >
                    {expandedId === policy.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded actions */}
                <AnimatePresence>
                  {expandedId === policy.id && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="p-4 space-y-3">
                        {/* Content preview snippet */}
                        <p className="text-xs text-slate-500 line-clamp-2 font-mono bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                          {policy.content.replace(/^#+\s/gm, '').slice(0, 120)}…
                        </p>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openPreview(policy)}
                            className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            <Eye size={13} /> Preview
                          </button>
                          <button
                            onClick={() => openEdit(policy)}
                            className="flex items-center justify-center gap-2 py-2.5 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          {policy.status === 'draft' ? (
                            <button
                              onClick={() => handlePublish(policy.id)}
                              className="flex items-center justify-center gap-2 py-2.5 bg-brand-green text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:opacity-70"
                            >
                              <Globe size={13} /> Publish
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublish(policy.id)}
                              className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-brand-yellow/10 hover:text-brand-yellow text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                              <ArrowLeft size={13} /> Unpublish
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteId(policy.id)}
                            className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>

                        {/* Inline delete confirm */}
                        {confirmDeleteId === policy.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20"
                          >
                            <p className="flex-1 text-xs font-bold text-brand-red">Permanently delete "{policy.title}"?</p>
                            <button onClick={() => handleDelete(policy.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Edit / Preview Modal */}
      <AnimatePresence>
        {modalMode && editing && (
          <div className="fixed inset-0 z-[200] flex flex-col bg-[#0d0d1a]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex flex-col h-full"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
                <button
                  onClick={() => setModalMode(null)}
                  className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {modalMode === 'edit' ? 'Editing Policy' : 'Preview'}
                  </p>
                  <p className="text-sm font-bold truncate">{editing.title || 'Untitled Policy'}</p>
                </div>
                {/* Edit / Preview toggle tabs */}
                <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setModalMode('edit')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', modalMode === 'edit' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white')}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setModalMode('preview')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', modalMode === 'preview' ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto">
                {modalMode === 'edit' ? (
                  <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Policy Title</label>
                      <input
                        value={editing.title}
                        onChange={e => setEditing({ ...editing, title: e.target.value })}
                        placeholder="e.g. Tournament Rules, Privacy Policy..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-base font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status:</span>
                      <button
                        onClick={() => setEditing({ ...editing, status: editing.status === 'draft' ? 'published' : 'draft' })}
                        className={cn('text-[10px] font-black uppercase px-3 py-1 rounded-full transition-all',
                          editing.status === 'published' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-yellow/15 text-brand-yellow'
                        )}
                      >
                        {editing.status}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Content</label>
                        <span className="text-[10px] text-slate-600 font-bold">Markdown supported</span>
                      </div>
                      <textarea
                        value={editing.content}
                        onChange={e => setEditing({ ...editing, content: e.target.value })}
                        placeholder="Write policy content using Markdown..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:border-brand-blue outline-none transition-all placeholder:text-slate-600 resize-none scrollable-content"
                        style={{ minHeight: '40vh' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 max-w-2xl mx-auto w-full">
                    <div className="prose prose-invert max-w-none">
                      {renderMarkdown(editing.content)}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 px-4 py-4 border-t border-white/10 flex-shrink-0">
                <span className={cn('text-[10px] font-black uppercase px-3 py-1.5 rounded-full flex-shrink-0',
                  editing.status === 'published' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-yellow/15 text-brand-yellow'
                )}>
                  {editing.status}
                </span>
                <Button variant="secondary" onClick={handleSaveDraft} className="flex-1 rounded-xl border-white/10 flex items-center gap-2 justify-center">
                  <Save size={15} /> Save Draft
                </Button>
                <Button onClick={handlePublishFromModal} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                  <Globe size={15} /> Publish
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
