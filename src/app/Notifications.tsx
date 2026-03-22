import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, ChevronRight, Trophy, Wallet, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '@/src/store/notificationStore';

const getIcon = (iconType: string) => {
  switch (iconType) {
    case 'trophy': return Trophy;
    case 'wallet': return Wallet;
    case 'user': return User;
    default: return Bell;
  }
};

export default function Notifications() {
  const { notifications, hasUnread, markAllRead } = useNotificationStore();
  const navigate = useNavigate();

  const unread = notifications.filter(n => n.unread);
  const read   = notifications.filter(n => !n.unread);

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center bg-app-bg/90 backdrop-blur-md border-b border-app-border sticky top-0 z-50">
        <Link to="/" className="text-[17px] text-brand-primary font-normal mr-auto">‹ Back</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Notifications</h1>
        <AnimatePresence>
          {hasUnread && (
            <motion.button
              key="mark-all"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              onClick={markAllRead}
              className="ml-auto flex items-center gap-1.5 text-[15px] text-brand-primary font-normal active:opacity-60 transition-opacity"
            >
              <CheckCheck size={15} /> Mark all
            </motion.button>
          )}
        </AnimatePresence>
      </header>

      <div className="flex-1 scrollable-content">
        {unread.length > 0 && (
          <div className="pt-5 px-4 pb-2 space-y-2">
            <p className="ios-section-header">New</p>
            <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
              {unread.map((n, i) => {
                const Icon = getIcon(n.iconType);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => navigate(`/notifications/${n.id}`)}
                    className="flex gap-3.5 px-4 py-4 active:bg-app-elevated transition-colors cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${n.iconBg}`}>
                      <Icon size={20} className={n.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-semibold text-text-primary leading-snug">{n.title}</p>
                        <span className="text-[12px] text-text-muted font-normal shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[14px] text-text-secondary font-normal leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                      <div className="w-2 h-2 rounded-full bg-brand-primary" />
                      <ChevronRight size={13} className="text-text-muted" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {read.length > 0 && (
          <div className="pt-5 px-4 pb-8 space-y-2">
            <p className="ios-section-header">{unread.length > 0 ? 'Earlier' : 'All Notifications'}</p>
            <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
              {read.map((n, i) => {
                const Icon = getIcon(n.iconType);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/notifications/${n.id}`)}
                    className="flex gap-3.5 px-4 py-4 active:bg-app-elevated transition-colors cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${n.iconBg} opacity-60`}>
                      <Icon size={20} className={n.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-normal text-text-secondary leading-snug">{n.title}</p>
                        <span className="text-[12px] text-text-muted font-normal shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[14px] text-text-muted font-normal leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                    <ChevronRight size={13} className="text-text-muted shrink-0 self-center" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {!hasUnread && notifications.length > 0 && unread.length === 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 px-4 py-3 bg-brand-success/8 rounded-[12px] border border-brand-success/20">
              <CheckCheck size={16} className="text-brand-success shrink-0" />
              <p className="text-[14px] text-brand-success font-normal">You're all caught up!</p>
            </div>
          </div>
        )}

        {notifications.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4 text-center px-4">
            <div className="w-[88px] h-[88px] bg-app-card rounded-[28px] flex items-center justify-center">
              <Bell size={36} className="text-text-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-[17px] font-semibold text-text-primary">No Notifications</p>
              <p className="text-[15px] text-text-secondary font-normal">You don't have any notifications yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
