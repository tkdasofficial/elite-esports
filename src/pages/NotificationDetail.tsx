import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import { useNotificationStore } from '@/src/store/notificationStore';

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notifications, markRead } = useNotificationStore();

  const notification = notifications.find(n => n.id === id);

  useEffect(() => {
    if (id && notification?.unread) {
      markRead(id);
    }
  }, [id, notification, markRead]);

  if (!notification) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-app-bg px-6 text-center">
        <p className="text-[17px] text-text-secondary font-normal">Notification not found.</p>
        <button
          onClick={() => navigate('/notifications')}
          className="text-brand-primary text-[16px] font-medium active:opacity-60"
        >
          Go back
        </button>
      </div>
    );
  }

  const Icon = notification.icon;

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Header */}
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <button
          onClick={() => navigate('/notifications')}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Notification</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 pt-6 pb-10 space-y-5">
        {/* Icon + Meta */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className={`w-[72px] h-[72px] rounded-[24px] flex items-center justify-center ${notification.iconBg}`}>
            <Icon size={32} className={notification.iconColor} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-[20px] font-bold text-text-primary tracking-[-0.4px] leading-snug px-4">
              {notification.title}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-text-muted">
              <Clock size={12} />
              <span className="text-[13px] font-normal">{notification.time}</span>
            </div>
          </div>
        </motion.div>

        {/* Full message */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="bg-app-card rounded-[16px] p-5"
        >
          <p className="text-[15px] text-text-secondary font-normal leading-relaxed whitespace-pre-line">
            {notification.fullMessage || notification.message}
          </p>
        </motion.div>

        {/* CTA button if action available */}
        {notification.actionLabel && notification.actionPath && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Link
              to={notification.actionPath}
              className="flex items-center justify-between px-5 py-4 bg-brand-primary rounded-[16px] active:opacity-75 transition-opacity shadow-lg shadow-brand-primary/25"
            >
              <span className="text-[16px] font-semibold text-white">{notification.actionLabel}</span>
              <ChevronRight size={18} className="text-white/70" />
            </Link>
          </motion.div>
        )}

        {/* Back to all notifications */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => navigate('/notifications')}
            className="w-full flex items-center justify-center py-3.5 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-secondary active:opacity-60 transition-opacity border border-app-border"
          >
            Back to Notifications
          </button>
        </motion.div>
      </div>
    </div>
  );
}
