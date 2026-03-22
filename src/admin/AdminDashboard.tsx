import React from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { usePlatformStore } from '@/src/store/platformStore';
import {
  Trophy, Users, Wallet, Play, ArrowRight,
  TrendingUp, ArrowDownLeft, ArrowUpRight, Gamepad2,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/src/utils/helpers';

const QUICK_ACTIONS = [
  { label: 'Tournaments',   desc: 'Create, edit or delete matches',     icon: Trophy,     color: 'text-brand-blue',    bg: 'bg-brand-blue/15',    path: '/admin/matches' },
  { label: 'Players',       desc: 'View and manage player accounts',    icon: Users,      color: 'text-brand-green',   bg: 'bg-brand-success/15', path: '/admin/users' },
  { label: 'Finance',       desc: 'Approve withdrawals & deposits',     icon: Wallet,     color: 'text-brand-warning', bg: 'bg-brand-warning/15', path: '/admin/economy' },
  { label: 'Notifications', desc: 'Push alerts to all users',           icon: Play,       color: 'text-brand-primary-light', bg: 'bg-brand-primary/15', path: '/admin/notifications' },
  { label: 'Support',       desc: 'Manage user support tickets',        icon: Users,      color: 'text-brand-cyan',    bg: 'bg-brand-cyan/15',    path: '/admin/support' },
  { label: 'Campaign',      desc: 'Manage banners & promotions',        icon: TrendingUp, color: 'text-brand-blue',    bg: 'bg-brand-blue/15',    path: '/admin/campaign' },
];

const activityIcon = (type: string) => {
  if (type === 'deposit')    return <ArrowDownLeft size={16} />;
  if (type === 'withdrawal') return <ArrowUpRight  size={16} />;
  if (type === 'match')      return <Gamepad2      size={16} />;
  return <Users size={16} />;
};

const activityColor = (type: string) => {
  if (type === 'deposit')    return 'bg-brand-success/15 text-brand-success';
  if (type === 'withdrawal') return 'bg-brand-live/15 text-brand-live';
  if (type === 'match')      return 'bg-brand-blue/15 text-brand-blue';
  return 'bg-brand-warning/15 text-brand-warning';
};

const statusCls = (status: string) => {
  if (status === 'pending')   return 'text-brand-warning';
  if (status === 'success')   return 'text-brand-success';
  if (status === 'completed') return 'text-text-muted';
  if (status === 'active')    return 'text-brand-blue';
  return 'text-text-muted';
};

export default function AdminDashboard() {
  const { matches, liveMatches } = useMatchStore();
  const { registeredUsers, adminTransactions, settings } = usePlatformStore();

  const totalRevenue = adminTransactions
    .filter(t => t.type === 'deposit' && t.status === 'success')
    .reduce((a, t) => a + t.amount, 0);

  const stats = [
    { label: 'Tournaments',   value: matches.length,            icon: Trophy, color: 'text-brand-blue',    bg: 'bg-brand-blue/15' },
    { label: 'Live Now',      value: liveMatches.length,        icon: Play,   color: 'text-brand-live',    bg: 'bg-brand-live/15' },
    { label: 'Players',       value: registeredUsers.length,    icon: Users,  color: 'text-brand-success', bg: 'bg-brand-success/15' },
    { label: 'Revenue',       value: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, color: 'text-brand-warning', bg: 'bg-brand-warning/15' },
  ];

  const recentActivity = [
    ...adminTransactions.slice(0, 4).map(tx => ({
      id: tx.id, type: tx.type, user: tx.user,
      desc: `${tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} ₹${tx.amount.toLocaleString()}`,
      time: tx.date, status: tx.status,
    })),
    ...matches.slice(0, 2).map(m => ({
      id: m.match_id, type: 'match', user: 'System',
      desc: m.title, time: m.start_time, status: m.status,
    })),
  ].slice(0, 6);

  return (
    <div className="pb-24 pt-2 space-y-6">

      {/* Platform name pill */}
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Admin Console</h1>
            <p className="text-[13px] text-text-muted font-normal mt-0.5">{settings.platformName}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-success/10 rounded-full border border-brand-success/20">
            <div className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold text-brand-success uppercase tracking-wide">Live</span>
          </div>
        </div>
      </div>

      {/* Stats — horizontal scroll on mobile */}
      <section className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-app-card rounded-[18px] p-4 space-y-3"
            >
              <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center', s.bg)}>
                <s.icon size={19} className={s.color} />
              </div>
              <div>
                <p className="text-[24px] font-bold text-text-primary tabular leading-none tracking-tight">{s.value}</p>
                <p className="text-[12px] text-text-muted font-normal mt-1">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Management</p>
        <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
            >
              <Link to={action.path}>
                <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                  <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0', action.bg)}>
                    <action.icon size={19} className={action.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-normal text-text-primary">{action.label}</p>
                    <p className="text-[13px] text-text-muted font-normal mt-0.5 truncate">{action.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-4 space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal">Recent Activity</p>
          <Link to="/admin/economy" className="text-[15px] text-brand-primary font-normal active:opacity-60">
            View All
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="bg-app-card rounded-[16px] py-10 text-center">
            <p className="text-[15px] text-text-muted font-normal">No activity yet</p>
          </div>
        ) : (
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            {recentActivity.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-center gap-3.5 px-4 py-3.5"
              >
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', activityColor(item.type))}>
                  {activityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-normal text-text-primary truncate">{item.desc}</p>
                  <p className="text-[12px] text-text-muted font-normal mt-0.5">{item.user} · {item.time}</p>
                </div>
                <span className={cn('text-[12px] font-medium capitalize', statusCls(item.status))}>
                  {item.status}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
