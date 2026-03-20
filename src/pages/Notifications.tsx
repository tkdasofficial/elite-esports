import { motion } from 'motion/react';
import { Bell, Trophy, Wallet, User, ChevronLeft, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const NOTIFICATIONS = [
  {
    id: '1', type: 'match', unread: true,
    title: 'Match Starting Soon!',
    message: 'Pro League Finals starts in 15 minutes. Get ready to compete!',
    time: '10m ago',
    icon: Trophy,
    iconBg: 'bg-brand-warning/12 text-brand-warning',
    dot: 'bg-brand-warning',
  },
  {
    id: '2', type: 'wallet', unread: true,
    title: '₹500 Added to Wallet',
    message: 'Your deposit has been successfully verified and credited.',
    time: '2h ago',
    icon: Wallet,
    iconBg: 'bg-brand-success/12 text-brand-success',
    dot: 'bg-brand-success',
  },
  {
    id: '3', type: 'system', unread: false,
    title: 'Account Verified',
    message: 'Your account has been successfully verified by our team.',
    time: '1d ago',
    icon: User,
    iconBg: 'bg-brand-primary/12 text-brand-primary-light',
    dot: 'bg-brand-primary',
  },
  {
    id: '4', type: 'match', unread: false,
    title: 'Tournament Results',
    message: 'BGMI Solo Championship results are now available. Check your placement.',
    time: '2d ago',
    icon: Trophy,
    iconBg: 'bg-brand-warning/12 text-brand-warning',
    dot: 'bg-brand-warning',
  },
];

export default function Notifications() {
  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[60px] px-5 flex items-center gap-3 glass-dark border-b border-app-border sticky top-0 z-50">
        <Link
          to="/"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-transform"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[17px] font-bold text-text-primary flex-1">Notifications</h1>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary-light">
          <CheckCheck size={14} />
          Mark all read
        </button>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 space-y-2.5">
        {NOTIFICATIONS.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className={`flex gap-4 p-4 rounded-2xl border transition-colors ${
              n.unread
                ? 'bg-app-card border-brand-primary/20'
                : 'bg-app-card/60 border-app-border'
            }`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${n.iconBg}`}>
                <n.icon size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-snug ${n.unread ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-text-muted font-medium shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-text-muted font-medium leading-relaxed line-clamp-2">{n.message}</p>
              </div>
              {n.unread && (
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.dot}`} />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
