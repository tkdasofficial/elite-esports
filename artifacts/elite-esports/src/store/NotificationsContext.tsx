import React, {
  createContext, useContext, useState, useEffect,
  useMemo, useCallback, useRef, ReactNode,
} from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { saveFcmTokenForUser, verifyAndSyncFcmToken } from '@/services/NotificationService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastSyncRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ── In-app notifications from Supabase ──────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
  }, [user]);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    fetchNotifications();
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  // ── FCM token registration on login ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    saveFcmTokenForUser(user).catch(() => {});

    const tokenSub = Notifications.addPushTokenListener((tokenData) => {
      if (tokenData?.data) {
        saveFcmTokenForUser(user).catch(() => {});
      }
    });

    return () => tokenSub.remove();
  }, [user]);

  // ── Backup auto-sync: foreground + periodic 24 h check ──────────────────
  useEffect(() => {
    if (!user) return;

    async function runSync() {
      const now = Date.now();
      if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;
      lastSyncRef.current = now;
      await verifyAndSyncFcmToken(user!).catch(() => {});
    }

    // Run immediately on mount / login
    runSync();

    // Re-run every time the app comes back to the foreground
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        runSync();
      }
      appStateRef.current = nextState;
    });

    // Periodic fallback timer (catches users who keep app open 24 h+)
    const intervalId = setInterval(runSync, SYNC_INTERVAL_MS);

    return () => {
      appStateSub.remove();
      clearInterval(intervalId);
    };
  }, [user]);

  // ── Notification actions ─────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [user]);

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  }), [notifications, markAsRead, markAllAsRead, fetchNotifications]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
