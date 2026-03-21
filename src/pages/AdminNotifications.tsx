import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Bell, Send, Trash2, CheckCircle2, X, Users, Globe, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { useNotificationStore } from '@/src/store/notificationStore';

type NotifType = 'global' | 'user';
type SentRecord = { id: string; title: string; message: string; date: string; type: NotifType; status: string; targetUser?: string };
type Toast = { msg: string; ok: boolean } | null;

export default function AdminNotifications() {
  const { addNotification } = useNotificationStore();
  const [title, setTitle]             = useState('');
  const [message, setMessage]         = useState('');
  const [type, setType]               = useState<NotifType>('global');
  const [targetUser, setTargetUser]   = useState('');
  const [scheduleAt, setScheduleAt]   = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [sentHistory, setSentHistory] = useState<SentRecord[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]             = useState<Toast>(null);
  const [sending, setSending]         = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const validate = () => {
    if (!title.trim() || !message.trim()) { showToast('Title and message are required', false); return false; }
    if (type === 'user' && !targetUser.trim()) { showToast('Please enter a username', false); return false; }
    if (showSchedule && !scheduleAt) { showToast('Please pick a schedule date/time', false); return false; }
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    const isScheduled = showSchedule && !!scheduleAt;
    const dateStr = isScheduled
      ? new Date(scheduleAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    if (!isScheduled) {
      addNotification({
        unread: true,
        title,
        message,
        fullMessage: message,
        time: 'Just now',
        iconType: 'bell',
        iconColor: 'text-brand-cyan',
        iconBg: 'bg-brand-cyan/15',
      });
    }

    setSentHistory(prev => [{
      id: Math.random().toString(36).slice(2),
      title, message, type,
      targetUser: type === 'user' ? targetUser : undefined,
      date: dateStr,
      status: isScheduled ? 'scheduled' : 'sent',
    }, ...prev]);

    setTitle('');
    setMessage('');
    setTargetUser('');
    setScheduleAt('');
    setShowSchedule(false);
    setSending(false);
    showToast(isScheduled
      ? `Notification scheduled for ${dateStr}`
      : `Notification sent to ${type === 'global' ? 'all users' : targetUser}!`
    );
  };

  const handleDelete = (id: string) => {
    setSentHistory(prev => prev.filter(n => n.id !== id));
    setConfirmDeleteId(null);
    showToast('Notification deleted');
  };

  const deleteTarget = sentHistory.find(n => n.id === confirmDeleteId);

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-2xl font-black tracking-tight">Notifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bell size={18} className="text-brand-blue" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Compose</h2>
          </div>
          <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {([['global', 'All Users', Globe], ['user', 'Specific User', Users]] as const).map(([v, l, Icon]) => (
                  <button key={v} onClick={() => setType(v)}
                    className={cn('py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all',
                      type === v ? 'bg-brand-blue text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
                    <Icon size={14} /> {l}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {type === 'user' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Username</label>
                  <input
                    value={targetUser} onChange={e => setTargetUser(e.target.value)}
                    placeholder="Enter exact username..."
                    className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Title</label>
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Enter notification title..."
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Message</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Enter detailed message..."
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600 min-h-[90px] resize-none"
              />
            </div>

            <AnimatePresence>
              {showSchedule && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Schedule For</label>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={e => setScheduleAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all text-white"
                    style={{ colorScheme: 'dark' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <Button onClick={handleSend} fullWidth className="rounded-xl flex items-center gap-2" disabled={sending}>
                {sending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Send size={15} />
                  </motion.div>
                ) : <Send size={15} />}
                {sending ? 'Sending…' : showSchedule ? 'Schedule' : 'Send Now'}
              </Button>
              <button
                onClick={() => setShowSchedule(s => !s)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all flex-shrink-0',
                  showSchedule ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                )}
              >
                {showSchedule ? <><Calendar size={14} /> On</> : <><Clock size={14} /> Schedule</>}
              </button>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bell size={18} className="text-brand-yellow" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Sent History</h2>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {sentHistory.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ delay: i * 0.04 }}>
                  <Card className="p-4 bg-brand-card/40 border-white/5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0',
                          n.type === 'global' ? 'bg-brand-blue/20 text-brand-blue' : 'bg-brand-green/20 text-brand-green')}>
                          {n.type === 'global' ? 'Global' : `→ ${n.targetUser || 'User'}`}
                        </span>
                        <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0',
                          n.status === 'sent' ? 'bg-white/5 text-slate-500' : 'bg-brand-yellow/20 text-brand-yellow')}>
                          {n.status}
                        </span>
                      </div>
                      <button onClick={() => setConfirmDeleteId(n.id)} className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition-all flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm">{n.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{n.date}</p>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {sentHistory.length === 0 && (
              <div className="py-10 text-center text-slate-500 text-sm font-bold">No notifications sent yet</div>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {confirmDeleteId && deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-sm bg-[#0f0f14] border border-white/10 rounded-3xl p-6 space-y-4 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-black">Delete Record?</h2>
                <p className="text-sm text-slate-400 mt-1">"{deleteTarget.title}" will be removed from history.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-3 bg-red-500 rounded-xl text-sm font-bold text-white hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
