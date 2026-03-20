import { create } from 'zustand';
import { Trophy, Wallet, User, Bell } from 'lucide-react';

export interface Notification {
  id: string;
  unread: boolean;
  title: string;
  message: string;
  fullMessage?: string;
  time: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  actionLabel?: string;
  actionPath?: string;
}

const INITIAL: Notification[] = [
  {
    id: '1', unread: true,
    title: 'Match Starting Soon!',
    message: 'Pro League Finals starts in 15 minutes. Get ready to compete!',
    fullMessage: 'Pro League Finals starts in 15 minutes!\n\nMake sure your device is charged and you have a stable internet connection. Room ID and password will be shared 5 minutes before the match in the match details page.\n\nGood luck, player! May the best competitor win.',
    time: '10m ago', icon: Trophy,
    iconColor: 'text-brand-warning', iconBg: 'bg-brand-warning/15',
    actionLabel: 'View Match', actionPath: '/match/1',
  },
  {
    id: '2', unread: true,
    title: '₹500 Added to Wallet',
    message: 'Your deposit has been successfully verified and credited to your account.',
    fullMessage: 'Great news! Your deposit of ₹500 has been successfully verified by our admin team and credited to your Elite Esports wallet.\n\nTransaction Reference: UTR123456789012\nAmount: ₹500\nStatus: Verified & Credited\nDate: 20 Mar 2026, 10:30 AM\n\nYou can now use these funds to join tournaments. Visit the Wallet section to view your updated balance.',
    time: '2h ago', icon: Wallet,
    iconColor: 'text-brand-success', iconBg: 'bg-brand-success/15',
    actionLabel: 'View Wallet', actionPath: '/wallet',
  },
  {
    id: '3', unread: false,
    title: 'Account Verified',
    message: "Your account has been successfully verified by our team. You're all set!",
    fullMessage: "Congratulations! Your Elite Esports account has been successfully verified by our team.\n\nYou now have full access to all platform features including:\n• Joining paid tournaments\n• Withdrawing winnings\n• Creating and joining teams\n• Accessing exclusive high-stakes events\n\nWelcome to the Elite Esports community. Let the competition begin!",
    time: '1d ago', icon: User,
    iconColor: 'text-brand-primary-light', iconBg: 'bg-brand-primary/15',
  },
  {
    id: '4', unread: false,
    title: 'Tournament Results Available',
    message: 'BGMI Solo Championship results are now available. Check your placement.',
    fullMessage: 'The BGMI Solo Championship has concluded and results are now available!\n\nYour Performance:\n• Final Rank: #12 out of 100 players\n• Total Kills: 8\n• Survival Points: 24\n• Total Points: 32\n\nTop 3 players have been contacted for prize distribution. Keep competing to climb the leaderboard!\n\nThank you for participating in Elite Esports BGMI Solo Championship.',
    time: '2d ago', icon: Trophy,
    iconColor: 'text-brand-warning', iconBg: 'bg-brand-warning/15',
    actionLabel: 'View Leaderboard', actionPath: '/leaderboard',
  },
  {
    id: '5', unread: false,
    title: 'New Tournament Available',
    message: 'Free Fire Max Cup has just opened registration. Only 20 slots remaining.',
    fullMessage: 'A new tournament has just gone live on Elite Esports!\n\nFree Fire Max Cup\n• Entry Fee: ₹30\n• Prize Pool: ₹3,000\n• Mode: Battle Royale Solo\n• Slots: 100 (only 20 remaining!)\n• Starts: Today at 9:00 PM IST\n\nDon\'t miss out — slots are filling up fast! Register now before it\'s too late.',
    time: '3d ago', icon: Bell,
    iconColor: 'text-brand-cyan', iconBg: 'bg-brand-cyan/15',
    actionLabel: 'Browse Tournaments', actionPath: '/',
  },
];

interface NotificationState {
  notifications: Notification[];
  hasUnread: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: INITIAL,
  hasUnread: INITIAL.some(n => n.unread),
  markRead: (id) => set((state) => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, unread: false } : n);
    return { notifications: updated, hasUnread: updated.some(n => n.unread) };
  }),
  markAllRead: () => set((state) => {
    const updated = state.notifications.map(n => ({ ...n, unread: false }));
    return { notifications: updated, hasUnread: false };
  }),
}));
