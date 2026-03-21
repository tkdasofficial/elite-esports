import React, { useState } from 'react';
import { Search, User, Ban, CheckCircle2, Coins, Trash2, X, Check, Plus, Minus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { usePlatformStore, PlatformUser } from '@/src/store/platformStore';
import { useUserStore } from '@/src/store/userStore';

type Toast = { msg: string; ok: boolean } | null;

const IOSToast = ({ toast }: { toast: Toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
        className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-[14px] text-[14px] font-medium shadow-xl flex items-center gap-2 pointer-events-none whitespace-nowrap ${toast.ok ? 'bg-brand-success text-white' : 'bg-brand-live text-white'}`}
      >
        {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function AdminUsers() {
  const { registeredUsers, banUser, unbanUser, adjustCoins, deleteUser } = usePlatformStore();
  const { updateCoins } = useUserStore();
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [coinModal, setCoinModal]         = useState<PlatformUser | null>(null);
  const [coinAmount, setCoinAmount]       = useState('');
  const [coinMode, setCoinMode]           = useState<'add' | 'deduct'>('add');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]                 = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggleStatus = (user: PlatformUser) => {
    if (user.status === 'active') {
      banUser(user.id);
      showToast(`${user.username} banned`);
    } else {
      unbanUser(user.id);
      showToast(`${user.username} unbanned`);
    }
  };

  const applyCoins = () => {
    if (!coinModal || !coinAmount || isNaN(Number(coinAmount))) return;
    const delta = coinMode === 'add' ? Number(coinAmount) : -Number(coinAmount);
    adjustCoins(coinModal.id, delta);
    const { user } = useUserStore.getState();
    if (user && coinModal.id === user.id) updateCoins(delta);
    showToast(`${coinMode === 'add' ? '+' : '-'}₹${coinAmount} applied to ${coinModal.username}`);
    setCoinModal(null);
    setCoinAmount('');
  };

  const handleDeleteUser = () => {
    if (!confirmDeleteId) return;
    const u = registeredUsers.find(u => u.id === confirmDeleteId);
    deleteUser(confirmDeleteId);
    setConfirmDeleteId(null);
    showToast(`${u?.username} deleted`);
  };

  const counts = {
    all: registeredUsers.length,
    active: registeredUsers.filter(u => u.status === 'active').length,
    banned: registeredUsers.filter(u => u.status === 'banned').length,
  };

  const filtered = registeredUsers.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deleteTarget = registeredUsers.find(u => u.id === confirmDeleteId);

  const filters = [
    { value: 'all',    label: `All (${counts.all})` },
    { value: 'active', label: `Active (${counts.active})` },
    { value: 'banned', label: `Banned (${counts.banned})` },
  ];

  return (
    <div className="pb-24 pt-2 space-y-5">
      <IOSToast toast={toast} />

      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Players</h1>
        <p className="text-[13px] text-text-muted font-normal mt-0.5">{registeredUsers.length} total registered</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-1 scrollable-content">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all shrink-0',
              statusFilter === f.value ? 'bg-brand-primary text-white' : 'bg-app-elevated text-text-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* User list */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filtered.length} {filtered.length === 1 ? 'player' : 'players'}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-14 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <User size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">No players found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-app-card rounded-[18px] overflow-hidden"
              >
                {/* User info row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold text-[16px]',
                    user.status === 'banned' ? 'bg-brand-live/10 text-brand-live' : 'bg-brand-primary/10 text-brand-primary'
                  )}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-medium text-text-primary truncate">{user.username}</p>
                      {user.status === 'banned' && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-live/10 text-brand-live shrink-0">Banned</span>
                      )}
                    </div>
                    <p className="text-[12px] text-text-muted truncate">{user.email}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] font-semibold text-brand-primary">{user.rank}</span>
                      <span className="text-[11px] font-semibold text-brand-success">₹{user.coins.toLocaleString()}</span>
                      <span className="text-[11px] text-text-muted">{user.joined}</span>
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 px-4 pb-3.5">
                  <button
                    onClick={() => { setCoinModal(user); setCoinAmount(''); setCoinMode('add'); }}
                    className="flex-1 py-2 bg-brand-success/10 rounded-[12px] text-[12px] font-medium text-brand-success active:opacity-70 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Coins size={14} /> Coins
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={cn(
                      'flex-1 py-2 rounded-[12px] text-[12px] font-medium transition-opacity active:opacity-70 flex items-center justify-center gap-1.5',
                      user.status === 'banned'
                        ? 'bg-brand-success/10 text-brand-success'
                        : 'bg-app-elevated text-text-secondary'
                    )}
                  >
                    {user.status === 'banned' ? <><Check size={14} /> Unban</> : <><Ban size={14} /> Ban</>}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(user.id)}
                    className="py-2 px-3 bg-brand-live/10 rounded-[12px] text-brand-live active:opacity-70 transition-opacity"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirm — iOS alert style */}
      <AnimatePresence>
        {confirmDeleteId && deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-[280px] bg-app-card rounded-[18px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 text-center space-y-2">
                <div className="w-14 h-14 bg-brand-live/10 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={24} className="text-brand-live" />
                </div>
                <h2 className="text-[17px] font-semibold text-text-primary">Delete Player?</h2>
                <p className="text-[13px] text-text-muted">"{deleteTarget.username}" will be permanently removed.</p>
              </div>
              <div className="border-t border-ios-sep grid grid-cols-2 divide-x divide-ios-sep">
                <button onClick={() => setConfirmDeleteId(null)} className="py-4 text-[17px] text-brand-primary font-normal active:bg-app-elevated transition-colors">Cancel</button>
                <button onClick={handleDeleteUser} className="py-4 text-[17px] text-brand-live font-medium active:bg-app-elevated transition-colors">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coins bottom sheet */}
      <AnimatePresence>
        {coinModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCoinModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="relative w-full max-w-[440px] bg-app-card rounded-t-[28px] pb-8"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 pb-4 border-b border-ios-sep">
                <div>
                  <h3 className="text-[18px] font-semibold text-text-primary">Adjust Coins</h3>
                  <p className="text-[13px] text-text-muted mt-0.5">{coinModal.username} · ₹{coinModal.coins.toLocaleString()} balance</p>
                </div>
                <button onClick={() => setCoinModal(null)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Mode selector */}
                <div className="flex gap-2">
                  {(['add', 'deduct'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setCoinMode(m)}
                      className={cn(
                        'flex-1 py-3 rounded-[14px] text-[14px] font-medium capitalize transition-all flex items-center justify-center gap-2',
                        coinMode === m
                          ? m === 'add' ? 'bg-brand-success text-white' : 'bg-brand-live text-white'
                          : 'bg-app-elevated text-text-secondary'
                      )}
                    >
                      {m === 'add' ? <Plus size={15} /> : <Minus size={15} />} {m === 'add' ? 'Add' : 'Deduct'}
                    </button>
                  ))}
                </div>

                {/* Amount input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-medium text-text-muted">₹</span>
                  <input
                    type="number"
                    value={coinAmount}
                    onChange={e => setCoinAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3.5 pl-9 pr-4 text-[22px] font-semibold text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map(v => (
                    <button
                      key={v}
                      onClick={() => setCoinAmount(v.toString())}
                      className="py-2.5 bg-app-elevated rounded-[12px] text-[13px] font-medium text-text-secondary active:opacity-60 transition-opacity"
                    >
                      {coinMode === 'add' ? '+' : '-'}₹{v}
                    </button>
                  ))}
                </div>

                {/* Apply button */}
                <button
                  onClick={applyCoins}
                  className={cn(
                    'w-full py-4 rounded-[14px] text-[16px] font-semibold text-white transition-all active:opacity-80',
                    coinMode === 'add' ? 'bg-brand-success' : 'bg-brand-live'
                  )}
                >
                  {coinMode === 'add' ? 'Add' : 'Deduct'} ₹{coinAmount || '0'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
