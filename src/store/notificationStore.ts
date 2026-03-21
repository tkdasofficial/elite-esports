import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Notification {
  id: string;
  unread: boolean;
  title: string;
  message: string;
  fullMessage?: string;
  time: string;
  iconType: 'trophy' | 'wallet' | 'user' | 'bell';
  iconColor: string;
  iconBg: string;
  actionLabel?: string;
  actionPath?: string;
}

interface NotificationState {
  notifications: Notification[];
  hasUnread: boolean;
  addNotification: (n: Omit<Notification, 'id'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      hasUnread: false,

      addNotification: (n) =>
        set((state) => {
          const newN = { ...n, id: Math.random().toString(36).substr(2, 9) };
          const updated = [newN, ...state.notifications];
          return { notifications: updated, hasUnread: updated.some(x => x.unread) };
        }),

      markRead: (id) =>
        set((state) => {
          const updated = state.notifications.map(n =>
            n.id === id ? { ...n, unread: false } : n
          );
          return { notifications: updated, hasUnread: updated.some(n => n.unread) };
        }),

      markAllRead: () =>
        set((state) => {
          const updated = state.notifications.map(n => ({ ...n, unread: false }));
          return { notifications: updated, hasUnread: false };
        }),

      deleteNotification: (id) =>
        set((state) => {
          const updated = state.notifications.filter(n => n.id !== id);
          return { notifications: updated, hasUnread: updated.some(n => n.unread) };
        }),
    }),
    {
      name: 'elite-notifications-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
