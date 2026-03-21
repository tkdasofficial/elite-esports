import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Share2, Users, Gift, TrendingUp, Search, Trash2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Ref = { id: string; user: string; code: string; totalReferrals: number; earned: number; status: string };
type Toast = { msg: string; ok: boolean } | null;

const INITIAL: Ref[] = [
  { id: '1', user: 'EsportsPro',   code: 'PRO50',    totalReferrals: 12, earned: 600, status: 'active' },
  { id: '2', user: 'ProSlayer',     code: 'SLAYER10', totalReferrals: 8,  earned: 400, status: 'active' },
  { id: '3', user: 'NoobMaster69', code: 'NOOB20',   totalReferrals: 3,  earned: 150, status: 'inactive' },
];

export default function AdminReferrals() {
  const [referrals, setReferrals]   = useState<Ref[]>(INITIAL);
  const [settings, setSettings]     = useState({ referrerReward: '50', refereeBonus: '20', enabled: true });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]           = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const handleDelete = (id: string) => {
    setReferrals(prev => prev.filter(r => r.id !== id));
    setConfirmDeleteId(null);
    showToast('Referral record deleted');
  };

  const toggleStatus = (id: string) => {
    setReferrals(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r
    ));
    const r = referrals.find(r => r.id === id);
    showToast(`${r?.user} set to ${r?.status === 'active' ? 'inactive' : 'active'}`);
  };

  const handleNew = () => {
    const newRef: Ref = {
      id: Math.random().toString(36).slice(2),
      user: 'New User',
      code: 'NEW' + Math.floor(Math.random() * 100),
      totalReferrals: 0,
      earned: 0,
      status: 'active',
    };
    setReferrals(prev => [...prev, newRef]);
    showToast('New referral campaign added');
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Referral & Rewards</h1>
          <p className="text-xs text-slate-500 font-bold">{referrals.filter(r => r.status === 'active').length} active campaigns</p>
        </div>
        <Button onClick={handleNew} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Gift size={16} /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-brand-blue/5 border-brand-blue/10">
          <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest opacity-70">Total Referrals</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-blue leading-none">{referrals.reduce((a, r) => a + r.totalReferrals, 0)}</p>
            <Users size={20} className="text-brand-blue opacity-30" />
          </div>
        </Card>
        <Card className="p-5 bg-brand-green/5 border-brand-green/10">
          <p className="text-[10px] font-black text-brand-green uppercase tracking-widest opacity-70">Rewards Paid</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-green leading-none">₹{referrals.reduce((a, r) => a + r.earned, 0)}</p>
            <Gift size={20} className="text-brand-green opacity-30" />
          </div>
        </Card>
        <Card className="p-5 bg-brand-yellow/5 border-brand-yellow/10">
          <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest opacity-70">Conversion Rate</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-yellow leading-none">12.5%</p>
            <TrendingUp size={20} className="text-brand-yellow opacity-30" />
          </div>
        </Card>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Referral Settings</h2>
        <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Referrer Reward (₹)" value={settings.referrerReward}
              onChange={e => setSettings({ ...settings, referrerReward: e.target.value })} />
            <Input label="Referee Bonus (₹)" value={settings.refereeBonus}
              onChange={e => setSettings({ ...settings, refereeBonus: e.target.value })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Enable Referral System</p>
              <p className="text-xs text-slate-500">Allow users to invite friends and earn rewards</p>
            </div>
            <button onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${settings.enabled ? 'bg-brand-blue' : 'bg-white/10'}`}>
              <motion.div animate={{ x: settings.enabled ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
          <Button onClick={() => showToast('Settings saved!')} size="sm" className="rounded-xl flex items-center gap-2">
            Save Settings
          </Button>
        </Card>
      </div>

      {/* Referrers List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Top Referrers</h2>
        <AnimatePresence>
          {referrals.map((ref, i) => (
            <motion.div key={ref.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 bg-brand-card/40 border-white/5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{ref.user}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Code: {ref.code}</span>
                      <button onClick={() => toggleStatus(ref.id)}
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${ref.status === 'active' ? 'bg-brand-green/10 text-brand-green' : 'bg-white/5 text-slate-500'}`}>
                        {ref.status}
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black">₹{ref.earned}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{ref.totalReferrals} referrals</p>
                  </div>
                </div>

                {confirmDeleteId === ref.id ? (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20">
                    <p className="flex-1 text-xs font-bold text-brand-red">Delete {ref.user}'s record?</p>
                    <button onClick={() => handleDelete(ref.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(ref.id)}
                    className="mt-3 w-full py-2 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                    <Trash2 size={12} /> Delete Record
                  </button>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
