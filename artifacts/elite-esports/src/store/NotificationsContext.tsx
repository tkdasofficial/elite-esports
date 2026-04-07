import React, {
  createContext, useContext, useState, useEffect,
  useMemo, useCallback, ReactNode,
} from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

export interface Notification {
  id:         string;
  title:      string;
  message:    string;
  is_read:    boolean;
  created_at: string;
  type:       string;
}

interface NotificationsContextValue {
  notifications:        Notification[];
  unreadCount:          number;
  loading:              boolean;
  markAsRead:           (id: string) => Promise<void>;
  markAllAsRead:        () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);

  // ── Fetch in-app notification list from Supabase ─────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [user]);

  // ── Initial fetch + Realtime subscription ─────────────────────────────────
  // The `notifications` table is populated by the notify_user() SQL helper,
  // which is called by every NCM backend trigger. So the in-app list stays
  // in sync automatically — no separate FCM/push registration needed here.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n),
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [user]);

  const value = useMemo(() => ({
    notifications,
    unreadCount:          notifications.filter(n => !n.is_read).length,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  }), [notifications, loading, markAsRead, markAllAsRead, fetchNotifications]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
