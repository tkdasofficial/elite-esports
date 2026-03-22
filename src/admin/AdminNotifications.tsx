import React, { useState } from 'react';
import { Bell, CheckCircle2, X, Check, Trash2, Send, Users, Trophy, Coins, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformStore } from '@/src/store/platformStore';
import { cn } from '@/src/utils/helpers';

type Toast = { msg: string; ok: boolean } | null;

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement', icon: Bell,        color: 'text-brand-primary', bg: 'bg-brand-primary/15' },
  { value: 'tournament',   label: 'Tournament',   icon: Trophy,      color: 'text-brand-warning', bg: 'bg-brand-warning/15' },
  { value: 'reward',       label: 'Reward',       icon: Coins,       color: 'text-brand-success', bg: 'bg-brand-success/15' },
  { value: 'system',       label: 'System',       icon: AlertCircle, color: 'text-brand-live',    bg: 'bg-brand-live/15'    },
];

export default function AdminNotifications() {
  const { adminNotifications, sendNotification, deleteNotification } = usePlatformStore();
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle]             = useState('');
  const [body, setBody]               = useState('');
  const [type, setType]               = useState('announcement');
  const [audience, setAudience]       = useState<'all' | 'premium' | 'inactive'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]             = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSend = () => {
    if (!title.trim()) { showToast('Title is required', false); return; }
    if (!body.trim())  { showToast('Message is required', false); return; }
    sendNotification({ title: title.trim(), body: body.trim(), type, audience });
    showToast('Notification sent!');
    setTitle(''); setBody(''); setType('announcement'); setAudience('all');
    setShowCompose(false);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setConfirmDeleteId(null);
    showToast('Notification deleted');
  };

  const audienceOptions = [
    { value: 'all',      label: 'All Users',   desc: 'Send to everyone' },
    { value: 'premium',  label: 'Premium',     desc: 'Premium users only' },
    { value: 'inactive', label: 'Inactive',    desc: 'Users inactive 7+ days' },
  ];

  const sortedNotifications = [...adminNotifications].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  const getTypeConfig = (typeVal: string) =>
    TYPE_OPTIONS.find(t => t.value === typeVal) ?? TYPE_OPTIONS[0];

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
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Notifications</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">{adminNotifications.length} sent</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
        >
          <Plus size={16} /> Compose
        </button>
      </div>

      {/* History */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Send History</p>

        {sortedNotifications.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <Bell size={24} className="text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-[15px] text-text-primary font-normal">No notifications yet</p>
              <p className="text-[13px] text-text-muted mt-1">Sent notifications will appear here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedNotifications.map((n, i) => {
              const cfg = getTypeConfig(n.type);
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-app-card rounded-[18px] overflow-hidden"
                >
                  <div className="flex items-start gap-3.5 px-4 py-4">
                    <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
                      <Icon size={18} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-text-primary">{n.title}</p>
                          <p className="text-[13px] text-text-muted mt-0.5 leading-relaxed">{n.body}</p>
                        </div>
                        {confirmDeleteId === n.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleDelete(n.id)} className="px-2.5 py-1 bg-brand-live text-white text-[11px] font-medium rounded-[8px] active:opacity-70">Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1 bg-app-elevated text-text-secondary text-[11px] font-medium rounded-[8px] active:opacity-70 border border-ios-sep">Keep</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(n.id)}
                            className="w-8 h-8 bg-app-elevated rounded-[10px] flex items-center justify-center text-text-muted shrink-0 active:opacity-60 border border-ios-sep"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn('text-[11px] font-medium capitalize px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>{n.type}</span>
                        <span className="text-[11px] text-text-muted px-2 py-0.5 rounded-full bg-app-elevated border border-ios-sep flex items-center gap-1">
                          <Users size={9} /> {n.audience === 'all' ? 'All Users' : n.audience}
                        </span>
                        <span className="text-[11px] text-text-muted">{new Date(n.sentAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Compose bottom sheet */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCompose(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="relative w-full max-w-[440px] bg-app-card rounded-t-[28px] pb-8 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>

              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-ios-sep">
                <h3 className="text-[18px] font-semibold text-text-primary">Compose</h3>
                <button onClick={() => setShowCompose(false)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
                {/* Type selector */}
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_OPTIONS.map(t => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setType(t.value)}
                          className={cn(
                            'flex items-center gap-2.5 py-3 px-3.5 rounded-[14px] border transition-all text-[13px] font-medium',
                            type === t.value
                              ? `${t.bg} border-current ${t.color}`
                              : 'bg-app-elevated border-ios-sep text-text-secondary'
                          )}
                        >
                          <Icon size={16} /> {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Audience */}
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Audience</label>
                  <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border border border-ios-sep">
                    {audienceOptions.map(a => (
                      <button
                        key={a.value}
                        onClick={() => setAudience(a.value as any)}
                        className="flex items-center gap-3 px-4 py-3.5 w-full active:bg-app-elevated transition-colors"
                      >
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          audience === a.value ? 'border-brand-primary bg-brand-primary' : 'border-app-border'
                        )}>
                          {audience === a.value && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-[14px] font-normal text-text-primary">{a.label}</p>
                          <p className="text-[12px] text-text-muted">{a.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Title</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Notification title..."
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Message</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Write your message..."
                    rows={4}
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 px-5 py-4 border-t border-ios-sep">
                <button
                  onClick={handleSend}
                  className="w-full py-4 rounded-[14px] text-[16px] font-semibold text-white bg-brand-primary active:opacity-80 transition-opacity flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Send Notification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
