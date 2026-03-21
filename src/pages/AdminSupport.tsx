import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { MessageSquare, Search, Check, X, User, Clock, CheckCircle2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type Priority = 'high' | 'medium' | 'low';
type Status   = 'open' | 'pending' | 'closed';
type Ticket   = { id: string; user: string; subject: string; status: Status; date: string; priority: Priority; reply?: string };
type Toast    = { msg: string; ok: boolean } | null;

const INITIAL: Ticket[] = [
  { id: '1', user: 'EsportsPro',  subject: 'Withdrawal Pending',  status: 'open',    date: '20 Mar, 10:30 AM', priority: 'high' },
  { id: '2', user: 'ProSlayer',   subject: 'Match Result Issue',   status: 'pending', date: '20 Mar, 09:15 AM', priority: 'medium' },
  { id: '3', user: 'NoobMaster',  subject: 'Login Problem',        status: 'closed',  date: '19 Mar, 08:00 PM', priority: 'low' },
  { id: '4', user: 'ShadowHunter',subject: 'Prize Not Received',   status: 'open',    date: '19 Mar, 06:00 PM', priority: 'high' },
];

export default function AdminSupport() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [tickets, setTickets]           = useState<Ticket[]>(INITIAL);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [replyText, setReplyText]       = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]               = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const handleResolve = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'closed' } : t));
    setExpandedId(null);
    showToast('Ticket resolved successfully');
  };

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    setTickets(prev => prev.map(t => t.id === id ? { ...t, reply: replyText, status: 'pending' } : t));
    setReplyText('');
    setExpandedId(null);
    showToast('Reply sent to user');
  };

  const handleDelete = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    setConfirmDeleteId(null);
    showToast('Ticket deleted');
  };

  const filtered = tickets.filter(t =>
    t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const priorityColor: Record<Priority, string> = {
    high:   'bg-brand-red/10 text-brand-red',
    medium: 'bg-brand-yellow/10 text-brand-yellow',
    low:    'bg-brand-blue/10 text-brand-blue',
  };

  const statusColor: Record<Status, string> = {
    open:    'bg-brand-red/20 text-brand-red',
    pending: 'bg-brand-yellow/20 text-brand-yellow',
    closed:  'bg-brand-green/20 text-brand-green',
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

      <div>
        <h1 className="text-2xl font-black tracking-tight">Support Tickets</h1>
        <p className="text-xs text-slate-500 font-bold mt-0.5">{tickets.filter(t => t.status === 'open').length} open · {tickets.filter(t => t.status === 'pending').length} pending</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open',     count: tickets.filter(t => t.status === 'open').length,    color: 'brand-red' },
          { label: 'Pending',  count: tickets.filter(t => t.status === 'pending').length, color: 'brand-yellow' },
          { label: 'Resolved', count: tickets.filter(t => t.status === 'closed').length,  color: 'brand-green' },
        ].map(s => (
          <Card key={s.label} className={`p-4 bg-${s.color}/5 border-${s.color}/10`}>
            <p className={`text-[10px] font-black text-${s.color} uppercase tracking-widest opacity-70`}>{s.label}</p>
            <p className={`text-2xl font-black text-${s.color} leading-tight mt-1`}>{s.count}</p>
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

      {/* Ticket List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((ticket, i) => (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-brand-card/40 border-white/5 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${priorityColor[ticket.priority]}`}>
                    <MessageSquare size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm truncate">{ticket.subject}</h3>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><User size={9} /> {ticket.user}</span>
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Clock size={9} /> {ticket.date}</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                    className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-white/10 transition-colors flex-shrink-0">
                    {expandedId === ticket.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded panel */}
                <AnimatePresence>
                  {expandedId === ticket.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-3">
                        {ticket.reply && (
                          <div className="p-3 bg-brand-green/10 rounded-xl border border-brand-green/20">
                            <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-1">Previous Reply</p>
                            <p className="text-sm text-slate-300">{ticket.reply}</p>
                          </div>
                        )}

                        {ticket.status !== 'closed' && (
                          <>
                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                              placeholder="Type your reply to the user..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-blue outline-none resize-none min-h-[80px] placeholder:text-slate-600" />
                            <div className="flex gap-2">
                              <button onClick={() => handleReply(ticket.id)}
                                className="flex-1 py-2 bg-brand-blue text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:opacity-70">
                                <Send size={13} /> Send Reply
                              </button>
                              <button onClick={() => handleResolve(ticket.id)}
                                className="flex-1 py-2 bg-brand-green text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:opacity-70">
                                <Check size={13} /> Resolve
                              </button>
                            </div>
                          </>
                        )}

                        {/* Delete confirm */}
                        {confirmDeleteId === ticket.id ? (
                          <div className="flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20">
                            <p className="flex-1 text-xs font-bold text-brand-red">Permanently delete this ticket?</p>
                            <button onClick={() => handleDelete(ticket.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(ticket.id)}
                            className="w-full py-2 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                            Delete Ticket
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm font-bold">No tickets found</div>
        )}
      </div>
    </div>
  );
}
