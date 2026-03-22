import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';

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
  loading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  addNotification: (n: Omit<Notification, 'id'>, userId?: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

function rowToNotification(row: any): Notification {
  return {
    id:          row.id,
    unread:      row.unread ?? true,
    title:       row.title ?? '',
    message:     row.message ?? '',
    fullMessage: row.full_message ?? '',
    time:        row.time ?? new Date(row.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    iconType:    (row.icon_type as Notification['iconType']) ?? 'bell',
    iconColor:   row.icon_color ?? '',
    iconBg:      row.icon_bg ?? '',
    actionLabel: row.action_label ?? '',
    actionPath:  row.action_path ?? '',
  };
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  hasUnread: false,
  loading: false,

  fetchNotifications: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const notifications = (data ?? []).map(rowToNotification);
      set({ notifications, hasUnread: notifications.some((n) => n.unread) });
    } catch (e) {
      console.error('fetchNotifications error:', e);
    } finally {
      set({ loading: false });
    }
  },

  addNotification: async (n, userId) => {
    const optimisticId = Math.random().toString(36).substr(2, 9);
    const newN: Notification = { ...n, id: optimisticId };
    set((s) => {
      const updated = [newN, ...s.notifications];
      return { notifications: updated, hasUnread: updated.some((x) => x.unread) };
    });

    if (userId) {
      try {
        const { data } = await supabase
          .from('notifications')
          .insert({
            user_id:      userId,
            title:        n.title,
            message:      n.message,
            full_message: n.fullMessage ?? '',
            time:         n.time,
            icon_type:    n.iconType,
            icon_color:   n.iconColor,
            icon_bg:      n.iconBg,
            action_label: n.actionLabel ?? '',
            action_path:  n.actionPath ?? '',
            unread:       n.unread,
          })
          .select()
          .single();
        if (data) {
          set((s) => ({
            notifications: s.notifications.map((x) =>
              x.id === optimisticId ? rowToNotification(data) : x
            ),
          }));
        }
      } catch (e) {
        console.error('addNotification error:', e);
      }
    }
  },

  markRead: async (id) => {
    set((s) => {
      const updated = s.notifications.map((n) =>
        n.id === id ? { ...n, unread: false } : n
      );
      return { notifications: updated, hasUnread: updated.some((n) => n.unread) };
    });
    await supabase.from('notifications').update({ unread: false }).eq('id', id);
  },

  markAllRead: async (userId) => {
    set((s) => {
      const updated = s.notifications.map((n) => ({ ...n, unread: false }));
      return { notifications: updated, hasUnread: false };
    });
    await supabase.from('notifications').update({ unread: false }).eq('user_id', userId);
  },

  deleteNotification: async (id) => {
    set((s) => {
      const updated = s.notifications.filter((n) => n.id !== id);
      return { notifications: updated, hasUnread: updated.some((n) => n.unread) };
    });
    await supabase.from('notifications').delete().eq('id', id);
  },
}));
