import React, { useState } from 'react';
import { Search, MessageSquare, CheckCircle2, X, Check, ChevronRight, Clock, AlertCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformStore, SupportTicket } from '@/src/store/platformStore';
import { cn } from '@/src/utils/helpers';

type Toast = { msg: string; ok: boolean } | null;

const PRIORITY_CONFIG = {
  low:    { color: 'text-brand-success', bg: 'bg-brand-success/15' },
  medium: { color: 'text-brand-warning', bg: 'bg-brand-warning/15' },
  high:   { color: 'text-brand-live',    bg: 'bg-brand-live/15'    },
};

const STATUS_CONFIG = {
  open:       { label: 'Open',       color: 'text-brand-primary', bg: 'bg-brand-primary/15' },
  in_progress:{ label: 'In Progress',color: 'text-brand-warning', bg: 'bg-brand-warning/15' },
  resolved:   { label: 'Resolved',   color: 'text-brand-success', bg: 'bg-brand-success/15' },
  closed:     { label: 'Closed',     color: 'text-text-muted',    bg: 'bg-app-elevated'     },
};

export default function AdminSupport() {
  const { supportTickets, updateTicketStatus, replyToTicket } = usePlatformStore();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText]   = useState('');
  const [toast, setToast]           = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateTicketStatus(id, status);
    if (activeTicket?.id === id) setActiveTicket(t => t ? { ...t, status: status as SupportTicket['status'] } : t);
    showToast(`Ticket ${status.replace('_', ' ')}`);
  };

  const handleReply = () => {
    if (!activeTicket || !replyText.trim()) return;
    replyToTicket(activeTicket.id, replyText.trim());
    setReplyText('');
    showToast('Reply sent');
  };

  const filters = [
    { value: 'all',        label: 'All' },
    { value: 'open',       label: 'Open' },
    { value: 'in_progress',label: 'In Progress' },
    { value: 'resolved',   label: 'Resolved' },
  ];

  const filtered = supportTickets?.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.user.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) ?? [];

  const openCount = supportTickets?.filter(t => t.status === 'open').length ?? 0;

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
      <div className="px-4 pt-2">
        <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Support</h1>
        <p className="text-[13px] text-text-muted font-normal mt-0.5">
          {openCount > 0 ? <span className="text-brand-live">{openCount} open tickets</span> : 'All tickets resolved'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollable-content">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all shrink-0',
              statusFilter === f.value ? 'bg-brand-primary text-white' : 'bg-app-elevated text-text-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by subject or user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* Ticket list */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filtered.length} {filtered.length === 1 ? 'ticket' : 'tickets'}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <MessageSquare size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">No tickets found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ticket, i) => {
              const statusCfg   = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open;
              const priorityCfg = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.low;
              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-app-card rounded-[18px] overflow-hidden"
                >
                  <button
                    onClick={() => setActiveTicket(activeTicket?.id === ticket.id ? null : ticket)}
                    className="w-full flex items-center gap-3.5 px-4 py-4 text-left active:bg-app-elevated transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 font-semibold text-[15px] text-brand-primary">
                      {ticket.user?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-medium text-text-primary truncate">{ticket.subject}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full', statusCfg.bg, statusCfg.color)}>{statusCfg.label}</span>
                        <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full capitalize', priorityCfg.bg, priorityCfg.color)}>{ticket.priority}</span>
                        <span className="text-[11px] text-text-muted">{ticket.user}</span>
                        <span className="text-[11px] text-text-muted flex items-center gap-1"><Clock size={9} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className={cn('text-text-muted transition-transform shrink-0', activeTicket?.id === ticket.id && 'rotate-90')} />
                  </button>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {activeTicket?.id === ticket.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-ios-sep">
                          {/* Message */}
                          <div className="pt-3">
                            <p className="text-[13px] text-text-muted font-normal leading-relaxed">{ticket.message}</p>
                          </div>

                          {/* Status change */}
                          <div className="space-y-2">
                            <p className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal">Update Status</p>
                            <div className="flex flex-wrap gap-2">
                              {(['open', 'in_progress', 'resolved', 'closed'] as const).map(s => {
                                const cfg = STATUS_CONFIG[s];
                                return (
                                  <button
                                    key={s}
                                    onClick={() => handleStatusChange(ticket.id, s)}
                                    className={cn(
                                      'px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all',
                                      ticket.status === s
                                        ? `${cfg.bg} ${cfg.color} border-current`
                                        : 'bg-app-elevated text-text-secondary border-ios-sep'
                                    )}
                                  >
                                    {cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Reply */}
                          <div className="space-y-2">
                            <p className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal">Reply</p>
                            <div className="relative">
                              <textarea
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Type your reply..."
                                rows={3}
                                className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[14px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all resize-none"
                              />
                            </div>
                            <button
                              onClick={handleReply}
                              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-[12px] text-white text-[13px] font-medium active:opacity-80 transition-opacity"
                            >
                              <Send size={14} /> Send Reply
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
