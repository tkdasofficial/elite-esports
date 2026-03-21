import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Bell, Send, Trash2, CheckCircle2, X, Users, Globe, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type NotifType = 'global' | 'user';
type Notif = { id: string; title: string; message: string; date: string; type: NotifType; status: string };
type Toast = { msg: string; ok: boolean } | null;

const INITIAL: Notif[] = [
  { id: '1', title: 'New Tournament Alert!',  message: 'BGMI Pro League starts in 2 hours. Join now!',         date: '20 Mar, 10:30 AM', type: 'global', status: 'sent' },
  { id: '2', title: 'Withdrawal Success',     message: 'Your withdrawal of ₹500 has been processed.',           date: '20 Mar, 09:15 AM', type: 'user',   status: 'sent' },
  { id: '3', title: 'Server Maintenance',     message: 'The app will be down for 30 mins tonight at 11 PM.',    date: '19 Mar, 08:00 PM', type: 'global', status: 'scheduled' },
];

export default function AdminNotifications() {
  const [title, setTitle]           = useState('');
  const [message, setMessage]       = useState('');
  const [type, setType]             = useState<NotifType>('global');
  const [notifications, setNotifs]  = useState<Notif[]>(INITIAL);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]           = useState<Toast>(null);
  const [sending, setSending]       = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      showToast('Title and message are required', false);
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setNotifs(prev => [{
      id: Math.random().toString(36).slice(2),
      title, message, type,
      date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    }, ...prev]);
    setTitle('');
    setMessage('');
    setSending(false);
    showToast(`Notification sent to ${type === 'global' ? 'all users' : 'selected user'}!`);
  };

  const handleDelete = (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    setConfirmDeleteId(null);
    showToast('Notification deleted');
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="text-2xl font-black tracking-tight">Notifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compose */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bell size={18} className="text-brand-blue" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Compose</h2>
          </div>
          <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
            {/* Audience selector */}
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

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Title</label>
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Enter notification title..."
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Message</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Enter detailed message..."
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600 min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSend} fullWidth className="rounded-xl flex items-center gap-2" disabled={sending}>
                {sending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Send size={15} />
                  </motion.div>
                ) : <Send size={15} />}
                {sending ? 'Sending…' : 'Send Now'}
              </Button>
              <Button variant="secondary" fullWidth className="rounded-xl border-white/5 flex items-center gap-2">
                <Clock size={15} /> Schedule
              </Button>
            </div>
          </Card>
        </section>

        {/* History */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bell size={18} className="text-brand-yellow" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent History</h2>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-4 bg-brand-card/40 border-white/5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0',
                          n.type === 'global' ? 'bg-brand-blue/20 text-brand-blue' : 'bg-brand-green/20 text-brand-green')}>
                          {n.type}
                        </span>
                        <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0',
                          n.status === 'sent' ? 'bg-white/5 text-slate-500' : 'bg-brand-yellow/20 text-brand-yellow')}>
                          {n.status}
                        </span>
                      </div>
                      <button onClick={() => setConfirmDeleteId(n.id)} className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-brand-red transition-all flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h3 className="font-bold text-sm">{n.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{n.date}</p>

                    {confirmDeleteId === n.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <p className="flex-1 text-xs font-bold text-brand-red">Delete this notification?</p>
                        <button onClick={() => handleDelete(n.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {notifications.length === 0 && (
              <div className="py-10 text-center text-slate-500 text-sm font-bold">No notifications sent yet</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
