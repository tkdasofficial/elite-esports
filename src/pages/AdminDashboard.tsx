import React from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { useUserStore } from '@/src/store/userStore';
import { Card } from '@/src/components/ui/Card';
import { Trophy, Users, Wallet, Play, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const { matches, liveMatches, upcomingMatches } = useMatchStore();
  const { user } = useUserStore();

  const stats = [
    { label: 'Total Matches', value: matches.length, icon: Trophy, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Live Now', value: liveMatches.length, icon: Play, color: 'text-brand-red', bg: 'bg-brand-red/10' },
    { label: 'Active Users', value: '1,248', icon: Users, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { label: 'Total Revenue', value: '₹45,200', icon: Wallet, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
  ];

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">Admin Console</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Welcome back, {user?.username}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4 space-y-3 bg-brand-card/40 border-white/5 h-full">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <stat.icon size={20} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{stat.label}</p>
                <p className="text-xl font-black truncate">{stat.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/admin/matches">
            <Card className="p-4 flex items-center justify-between bg-brand-card/60 border-white/5 hover:bg-brand-card transition-colors group h-full">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 flex-shrink-0">
                  <Trophy size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate">Manage Tournaments</h3>
                  <p className="text-xs text-slate-500 truncate">Create, edit or delete matches</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-brand-blue transition-colors flex-shrink-0 ml-2" />
            </Card>
          </Link>

          <Link to="/admin/users">
            <Card className="p-4 flex items-center justify-between bg-brand-card/60 border-white/5 hover:bg-brand-card transition-colors group h-full">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 flex-shrink-0">
                  <Users size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate">User Management</h3>
                  <p className="text-xs text-slate-500 truncate">View and manage player accounts</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-brand-blue transition-colors flex-shrink-0 ml-2" />
            </Card>
          </Link>

          <Link to="/admin/economy">
            <Card className="p-4 flex items-center justify-between bg-brand-card/60 border-white/5 hover:bg-brand-card transition-colors group h-full">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-300 flex-shrink-0">
                  <Wallet size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate">Financials</h3>
                  <p className="text-xs text-slate-500 truncate">Approve withdrawals & deposits</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-slate-600 group-hover:text-brand-blue transition-colors flex-shrink-0 ml-2" />
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">Recent Activity</h2>
        <Card className="p-8 text-center bg-brand-card/20 border-dashed border-white/10">
          <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">No recent logs to display</p>
        </Card>
      </div>
    </div>
  );
}
