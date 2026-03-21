import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  MessageSquare, Search, Check, X, User, Clock, CheckCircle2,
  Send, ChevronRight, AlertTriangle, RotateCcw, Trash2,
  ChevronDown, ArrowLeft, Flag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type Priority = 'high' | 'medium' | 'low';
type Status   = 'open' | 'pending' | 'closed';
type Msg      = { id: string; from: 'user' | 'admin'; text: string; time: string };
type Ticket   = {
  id: string; user: string; email: string; subject: string; message: string;
  status: Status; date: string; priority: Priority; messages: Msg[];
};
type Toast    = { msg: string; ok: boolean } | null;
type Filter   = 'all' | Status;

const now = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });


const priorityMeta: Record<Priority, { color: string; bg: string; label: string }> = {
  high:   { color: 'text-brand-red',    bg: 'bg-brand-red/10',    label: 'High' },
  medium: { color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', label: 'Medium' },
  low:    { color: 'text-brand-blue',   bg: 'bg-brand-blue/10',   label: 'Low' },
};

const statusMeta: Record<Status, { color: string; bg: string; label: string }> = {
  open:    { color: 'text-brand-red',    bg: 'bg-brand-red/20',    label: 'Open' },
  pending: { color: 'text-brand-yellow', bg: 'bg-brand-yellow/20', label: 'Pending' },
  closed:  { color: 'text-brand-green',  bg: 'bg-brand-green/20',  label: 'Resolved' },
};

export default function AdminSupport() {
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [selected, setSelected]   = useState<Ticket | null>(null);
  const [reply, setReply]         = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter]       = useState<Filter>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPriority, setShowPriority]   = useState(false);
  const [toast, setToast]         = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const updateTicket = (id: string, patch: Partial<Ticket>) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...patch } : prev);
  };

  const handleReply = () => {
    if (!reply.trim() || !selected) return;
    const newMsg: Msg = { id: Math.random().toString(36).slice(2), from: 'admin', text: reply.trim(), time: now() };
    const updatedMsgs = [...selected.messages, newMsg];
    updateTicket(selected.id, { messages: updatedMsgs, status: 'pending' });
    setReply('');
    showToast('Reply sent to user');
  };

  const handleResolve = () => {
    if (!selected) return;
    updateTicket(selected.id, { status: 'closed' });
    setSelected(null);
    showToast('Ticket resolved successfully');
  };

  const handleReopen = () => {
    if (!selected) return;
    updateTicket(selected.id, { status: 'open' });
    showToast('Ticket reopened');
  };

  const handleDelete = () => {
    if (!selected) return;
    setTickets(prev => prev.filter(t => t.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    showToast('Ticket deleted');
  };

  const handleChangePriority = (p: Priority) => {
    if (!selected) return;
    updateTicket(selected.id, { priority: p });
    setShowPriority(false);
    showToast(`Priority changed to ${p}`);
  };

  const filtered = tickets.filter(t => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !searchQuery ||
      t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:     tickets.length,
    open:    tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    closed:  tickets.filter(t => t.status === 'closed').length,
  };

  /* ── Ticket Detail View ── */
  if (selected) {
    const pm = priorityMeta[selected.priority];
    const sm = statusMeta[selected.status];
    return (
      <div className="flex flex-col h-full text-white">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
              {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
          <button onClick={() => { setSelected(null); setConfirmDelete(false); setShowPriority(false); }}
            className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate">{selected.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-slate-500 flex items-center gap-1"><User size={9} />{selected.user}</span>
              <span className="text-[10px] text-slate-500">{selected.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn('text-[9px] font-black uppercase px-2 py-1 rounded-full', sm.bg, sm.color)}>{sm.label}</span>
            <span className={cn('text-[9px] font-black uppercase px-2 py-1 rounded-full', pm.bg, pm.color)}>{pm.label}</span>
          </div>
        </div>

        {/* Ticket meta bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white/3 border-b border-white/5 text-[10px] font-bold text-slate-500 flex-shrink-0">
          <span className="flex items-center gap-1"><Clock size={10} />{selected.date}</span>
          <span className="flex-1" />
          {/* Priority change */}
          <div className="relative">
            <button onClick={() => setShowPriority(v => !v)}
              className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <Flag size={10} className={pm.color} /> Priority
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {showPriority && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden shadow-xl w-32">
                  {(['high', 'medium', 'low'] as Priority[]).map(p => (
                    <button key={p} onClick={() => handleChangePriority(p)}
                      className={cn('w-full px-3 py-2 text-[11px] font-bold text-left hover:bg-white/5 capitalize flex items-center gap-2', priorityMeta[p].color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', p === 'high' ? 'bg-brand-red' : p === 'medium' ? 'bg-brand-yellow' : 'bg-brand-blue')} />
                      {priorityMeta[p].label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollable-content">
          {selected.messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={cn('flex', m.from === 'admin' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] space-y-1',)}>
                <div className={cn('px-4 py-3 rounded-2xl text-sm leading-relaxed',
                  m.from === 'user'
                    ? 'bg-white/8 text-slate-200 rounded-tl-none border border-white/5'
                    : 'bg-brand-blue text-white rounded-tr-none'
                )}>
                  {m.text}
                </div>
                <p className={cn('text-[10px] font-bold text-slate-600', m.from === 'admin' ? 'text-right' : 'text-left')}>
                  {m.from === 'admin' ? 'Admin' : selected.user} · {m.time}
                </p>
              </div>
            </motion.div>
          ))}
          {selected.status === 'closed' && (
            <div className="text-center py-2">
              <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
                ✓ Ticket resolved
              </span>
            </div>
          )}
        </div>

        {/* Reply Box */}
        <div className="flex-shrink-0 border-t border-white/10 px-4 py-4 space-y-3">
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {selected.status !== 'closed' ? (
              <button onClick={handleResolve}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/10 text-brand-green rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-green/20 transition-all">
                <Check size={12} /> Resolve
              </button>
            ) : (
              <button onClick={handleReopen}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow/10 text-brand-yellow rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-yellow/20 transition-all">
                <RotateCcw size={12} /> Reopen
              </button>
            )}
            {confirmDelete ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-bold text-brand-red flex-1">Delete this ticket?</span>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-brand-red text-white text-[10px] font-black rounded-lg">Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-[10px] font-black rounded-lg">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {selected.status !== 'closed' && (
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(); }}
                placeholder="Type your reply… (Ctrl+Enter to send)"
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-brand-blue outline-none resize-none placeholder:text-slate-600 min-h-[56px] max-h-[120px] scrollable-content"
              />
              <button
                onClick={handleReply}
                disabled={!reply.trim()}
                className="px-4 bg-brand-blue text-white rounded-2xl flex items-center justify-center hover:bg-brand-blue/80 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed self-end h-[56px] flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Ticket List View ── */
  return (
    <div className="space-y-5 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Support Tickets</h1>
        <p className="text-xs text-slate-500 font-bold mt-0.5">{counts.open} open · {counts.pending} pending · {counts.closed} resolved</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open',     count: counts.open,    color: 'brand-red' },
          { label: 'Pending',  count: counts.pending, color: 'brand-yellow' },
          { label: 'Resolved', count: counts.closed,  color: 'brand-green' },
        ].map(s => (
          <Card key={s.label} className={`p-4 bg-${s.color}/5 border-${s.color}/10 text-center`}>
            <p className={`text-[10px] font-black text-${s.color} uppercase tracking-widest opacity-70`}>{s.label}</p>
            <p className={`text-2xl font-black text-${s.color} mt-1`}>{s.count}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" placeholder="Search by user or subject..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollable-content">
        {(['all', 'open', 'pending', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0',
              filter === f ? 'bg-brand-blue text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            )}>
            {f === 'all' ? `All (${counts.all})` : f === 'open' ? `Open (${counts.open})` : f === 'pending' ? `Pending (${counts.pending})` : `Resolved (${counts.closed})`}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((ticket, i) => {
            const pm = priorityMeta[ticket.priority];
            const sm = statusMeta[ticket.status];
            const lastMsg = ticket.messages[ticket.messages.length - 1];
            return (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
                <button onClick={() => { setSelected(ticket); setReply(''); setConfirmDelete(false); setShowPriority(false); }}
                  className="w-full text-left">
                  <Card className="p-4 bg-brand-card/40 border-white/5 hover:bg-brand-card/60 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Priority dot */}
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', pm.bg)}>
                        <MessageSquare size={18} className={pm.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><User size={9} /> {ticket.user}</span>
                              <span className="text-[10px] text-slate-600">·</span>
                              <span className="text-[10px] text-slate-500 font-bold">{ticket.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full', sm.bg, sm.color)}>{sm.label}</span>
                            <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full', pm.bg, pm.color)}>{pm.label}</span>
                          </div>
                        </div>
                        {/* Last message snippet */}
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">
                          {lastMsg.from === 'admin' ? 'You: ' : ''}{lastMsg.text}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 flex-shrink-0 mt-2" />
                    </div>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-14 text-center text-slate-500 text-sm font-bold">No tickets found</div>
        )}
      </div>
    </div>
  );
}
