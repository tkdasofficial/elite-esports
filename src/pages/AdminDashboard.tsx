import React from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { useUserStore } from '@/src/store/userStore';
import { Card } from '@/src/components/ui/Card';
import { Trophy, Users, Wallet, Play, ArrowRight, TrendingUp, ArrowDownLeft, ArrowUpRight, Gamepad2, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/src/utils/helpers';

const QUICK_ACTIONS = [
  { label: 'Tournaments',   desc: 'Create, edit or delete matches',        icon: Trophy,    color: 'text-brand-blue',   bg: 'bg-brand-blue/10',   path: '/admin/matches' },
  { label: 'Users',         desc: 'View and manage player accounts',        icon: Users,     color: 'text-brand-green',  bg: 'bg-brand-green/10',  path: '/admin/users' },
  { label: 'Economy',       desc: 'Approve withdrawals & deposits',         icon: Wallet,    color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', path: '/admin/economy' },
  { label: 'Notifications', desc: 'Push alerts to users',                   icon: Play,      color: 'text-brand-red',    bg: 'bg-brand-red/10',    path: '/admin/notifications' },
  { label: 'Support',       desc: 'Manage user support tickets',            icon: Users,     color: 'text-brand-secondary',   bg: 'bg-brand-secondary/10',   path: '/admin/support' },
  { label: 'Campaigns',     desc: 'Manage home banners & promotions',       icon: TrendingUp,color: 'text-brand-blue',   bg: 'bg-brand-blue/10',   path: '/admin/campaign' },
];

const RECENT_ACTIVITY = [
  { id: 'a1', type: 'deposit',    user: 'EsportsPro',   desc: 'Deposit request ₹500',      time: '10m ago',  status: 'pending' },
  { id: 'a2', type: 'match',      user: 'System',        desc: 'New tournament created',     time: '25m ago',  status: 'active' },
  { id: 'a3', type: 'withdrawal', user: 'ProSlayer',     desc: 'Withdrawal request ₹1,200',  time: '1h ago',   status: 'pending' },
  { id: 'a4', type: 'user',       user: 'NoobMaster69',  desc: 'New user registered',        time: '2h ago',   status: 'new' },
  { id: 'a5', type: 'deposit',    user: 'ShadowHunter',  desc: 'Deposit verified ₹1,500',    time: '3h ago',   status: 'success' },
  { id: 'a6', type: 'match',      user: 'System',        desc: 'BGMI Pro League completed',  time: '5h ago',   status: 'completed' },
];

const activityIcon = (type: string) => {
  if (type === 'deposit')    return <ArrowDownLeft size={16} />;
  if (type === 'withdrawal') return <ArrowUpRight size={16} />;
  if (type === 'match')      return <Gamepad2 size={16} />;
  return <Users size={16} />;
};

const activityColor = (type: string) => {
  if (type === 'deposit')    return 'bg-brand-green/10 text-brand-green';
  if (type === 'withdrawal') return 'bg-brand-red/10 text-brand-red';
  if (type === 'match')      return 'bg-brand-blue/10 text-brand-blue';
  return 'bg-brand-yellow/10 text-brand-yellow';
};

const statusBadge = (status: string) => {
  if (status === 'pending')   return 'bg-brand-yellow/15 text-brand-yellow';
  if (status === 'success')   return 'bg-brand-green/15 text-brand-green';
  if (status === 'completed') return 'bg-white/10 text-slate-400';
  if (status === 'active')    return 'bg-brand-blue/15 text-brand-blue';
  return 'bg-brand-secondary/15 text-brand-secondary';
};

export default function AdminDashboard() {
  const { matches, liveMatches, upcomingMatches } = useMatchStore();
  const { user, transactions } = useUserStore();

  const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'success').reduce((a, t) => a + t.amount, 0);

  const stats = [
    { label: 'Total Matches',  value: matches.length,          icon: Trophy, color: 'text-brand-blue',   bg: 'bg-brand-blue/10' },
    { label: 'Live Now',       value: liveMatches.length,      icon: Play,   color: 'text-brand-red',    bg: 'bg-brand-red/10' },
    { label: 'Active Users',   value: '1,248',                 icon: Users,  color: 'text-brand-green',  bg: 'bg-brand-green/10' },
    { label: 'Platform Revenue', value: `₹${(45200 + totalDeposits).toLocaleString()}`, icon: Wallet, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
  ];

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight">Admin Console</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Welcome back, {user?.username}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-brand-green uppercase tracking-widest bg-brand-green/10 px-3 py-1.5 rounded-full border border-brand-green/20">
          <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="p-4 space-y-3 bg-brand-card/40 border-white/5 h-full">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-black">{stat.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div key={action.path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
              <Link to={action.path}>
                <Card className="p-4 flex items-center justify-between bg-brand-card/60 border-white/5 hover:bg-brand-card transition-colors group h-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 ${action.bg} ${action.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <action.icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{action.label}</h3>
                      <p className="text-[10px] text-slate-500 truncate">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-brand-blue transition-colors flex-shrink-0 ml-2" />
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Activity</h2>
          <Link to="/admin/economy" className="text-[11px] font-bold text-brand-blue uppercase tracking-widest hover:opacity-70 transition-opacity">
            View All
          </Link>
        </div>
        <Card className="bg-brand-card/40 border-white/5 overflow-hidden divide-y divide-white/5">
          {RECENT_ACTIVITY.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${activityColor(item.type)}`}>
                {activityIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.desc}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.user}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusBadge(item.status)}`}>
                  {item.status}
                </span>
                <span className="text-[10px] text-slate-600 font-bold">{item.time}</span>
              </div>
            </motion.div>
          ))}
        </Card>
      </div>
    </div>
  );
}
