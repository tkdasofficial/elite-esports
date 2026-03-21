import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { ArrowLeft, Search, User, Ban, CheckCircle2, Coins, Trash2, X, Check, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/utils/helpers';

const INITIAL_USERS = [
  { id: '1', username: 'EsportsPro',   email: 'pro@elite.com',    rank: 'Diamond', coins: 1250, status: 'active', joined: '15 Jan 2024' },
  { id: '2', username: 'ProSlayer',     email: 'slayer@gmail.com', rank: 'Master',  coins: 4500, status: 'active', joined: '10 Feb 2024' },
  { id: '3', username: 'NoobMaster69', email: 'noob@yahoo.com',   rank: 'Bronze',  coins: 10,   status: 'banned', joined: '01 Mar 2024' },
  { id: '4', username: 'ShadowHunter', email: 'shadow@gmail.com', rank: 'Gold',    coins: 890,  status: 'active', joined: '22 Mar 2024' },
];

type User = typeof INITIAL_USERS[0];
type Toast = { msg: string; ok: boolean } | null;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [users, setUsers]                 = useState(INITIAL_USERS);
  const [coinModal, setCoinModal]         = useState<User | null>(null);
  const [coinAmount, setCoinAmount]       = useState('');
  const [coinMode, setCoinMode]           = useState<'add' | 'deduct'>('add');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]                 = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === 'active' ? 'banned' : 'active' } : u
    ));
    const u = users.find(u => u.id === id);
    showToast(`${u?.username} ${u?.status === 'active' ? 'banned' : 'unbanned'} successfully`);
  };

  const applyCoins = () => {
    if (!coinModal || !coinAmount || isNaN(Number(coinAmount))) return;
    const delta = coinMode === 'add' ? Number(coinAmount) : -Number(coinAmount);
    setUsers(prev => prev.map(u =>
      u.id === coinModal.id ? { ...u, coins: Math.max(0, u.coins + delta) } : u
    ));
    showToast(`${coinMode === 'add' ? '+' : '-'}₹${coinAmount} applied to ${coinModal.username}`);
    setCoinModal(null);
    setCoinAmount('');
  };

  const deleteUser = () => {
    if (!confirmDeleteId) return;
    const u = users.find(u => u.id === confirmDeleteId);
    setUsers(prev => prev.filter(u => u.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    showToast(`${u?.username} deleted`);
  };

  const counts = {
    all: users.length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
  };

  const filtered = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deleteTarget = users.find(u => u.id === confirmDeleteId);

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-4 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Users</h1>
          <p className="text-xs text-slate-500 font-bold">{users.length} total players</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {([
          ['all', `All (${counts.all})`],
          ['active', `Active (${counts.active})`],
          ['banned', `Banned (${counts.banned})`],
        ] as const).map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0',
              statusFilter === val
                ? val === 'banned' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filtered.map((user, i) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 bg-brand-card/40 border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center', user.status === 'banned' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-400')}>
                  <User size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm truncate">{user.username}</h3>
                    {user.status === 'banned' && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 flex-shrink-0">Banned</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-brand-blue uppercase">{user.rank}</span>
                    <span className="text-[10px] font-black text-green-400">₹{user.coins.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-600 font-bold">{user.joined}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => { setCoinModal(user); setCoinAmount(''); setCoinMode('add'); }}
                  className="flex-1 py-2 bg-white/5 hover:bg-green-500/10 hover:text-green-400 text-slate-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                >
                  <Coins size={14} /> Coins
                </button>
                <button
                  onClick={() => toggleStatus(user.id)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5',
                    user.status === 'banned'
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400'
                  )}
                >
                  {user.status === 'banned' ? <><Check size={14} /> Unban</> : <><Ban size={14} /> Ban</>}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(user.id)}
                  className="p-2.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-xl transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm font-bold">No users found</div>
        )}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDeleteId && deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-sm bg-[#0f0f14] border border-white/10 rounded-3xl p-6 space-y-4 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-black">Delete User?</h2>
                <p className="text-sm text-slate-400 mt-1">"{deleteTarget.username}" will be permanently removed.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-white/5 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={deleteUser} className="flex-1 py-3 bg-red-500 rounded-xl text-sm font-bold text-white hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coin Modal */}
      <AnimatePresence>
        {coinModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCoinModal(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-[440px] bg-[#1a1a2e] border border-white/10 rounded-t-[28px] p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">Adjust Coins</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{coinModal.username} · Current: ₹{coinModal.coins.toLocaleString()}</p>
                </div>
                <button onClick={() => setCoinModal(null)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:bg-white/10 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['add', 'deduct'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setCoinMode(m)}
                    className={cn(
                      'py-2.5 rounded-xl text-sm font-bold capitalize transition-all flex items-center justify-center gap-2',
                      coinMode === m
                        ? m === 'add' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        : 'bg-white/5 text-slate-400'
                    )}
                  >
                    {m === 'add' ? <Plus size={14} /> : <Minus size={14} />} {m}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={coinAmount}
                  onChange={e => setCoinAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-9 pr-4 text-xl font-black focus:border-brand-blue outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map(v => (
                  <button key={v} onClick={() => setCoinAmount(v.toString())}
                    className="py-2 bg-white/5 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/10 transition-colors">
                    {coinMode === 'add' ? '+' : '-'}₹{v}
                  </button>
                ))}
              </div>

              <Button onClick={applyCoins} fullWidth className={cn('rounded-xl', coinMode === 'deduct' ? 'bg-red-500 shadow-red-500/20' : '')}>
                {coinMode === 'add' ? 'Add' : 'Deduct'} ₹{coinAmount || '0'} Coins
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
