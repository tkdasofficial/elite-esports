import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Bell, Send, Trash2, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'New Tournament Alert!', message: 'BGMI Pro League starts in 2 hours. Join now!', date: '20 Mar, 10:30 AM', type: 'global', status: 'sent' },
    { id: '2', title: 'Withdrawal Success', message: 'Your withdrawal of ₹500 has been processed.', date: '20 Mar, 09:15 AM', type: 'user', status: 'sent' },
    { id: '3', title: 'Server Maintenance', message: 'The app will be down for 30 mins tonight.', date: '19 Mar, 08:00 PM', type: 'global', status: 'scheduled' },
  ]);

  const handleSend = () => {
    if (!title || !message) return;
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      date: new Date().toLocaleString(),
      type: 'global',
      status: 'sent'
    };
    setNotifications(prev => [newNotif, ...prev]);
    setTitle('');
    setMessage('');
    alert('Notification sent!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this notification?')) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Notifications</h1>
        <Button onClick={handleSend} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Send size={16} />
          Send Global Alert
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Notification */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Bell size={20} className="text-brand-blue" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Create New</h2>
          </div>
          <Card className="p-6 bg-brand-card/40 border-white/5 space-y-4">
            <Input 
              label="Title" 
              placeholder="Enter notification title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Message</label>
              <textarea 
                placeholder="Enter detailed message..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600 min-h-[120px]"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button onClick={handleSend} fullWidth className="rounded-xl">Send Now</Button>
              <Button variant="secondary" fullWidth className="rounded-xl border-white/5">Schedule</Button>
            </div>
          </Card>
        </section>

        {/* Recent Notifications */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Bell size={20} className="text-brand-yellow" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Recent History</h2>
          </div>
          <div className="space-y-3">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-4 bg-brand-card/40 border-white/5 space-y-2 group">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        notif.type === 'global' ? 'bg-brand-blue/20 text-brand-blue' : 'bg-brand-green/20 text-brand-green'
                      }`}>
                        {notif.type}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        notif.status === 'sent' ? 'bg-white/5 text-slate-500' : 'bg-brand-yellow/20 text-brand-yellow'
                      }`}>
                        {notif.status}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-brand-red transition-all sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <h3 className="font-bold text-sm truncate">{notif.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pt-1">{notif.date}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
