import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Share2, Users, Gift, TrendingUp, Search, Filter, Copy, Check, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState([
    { id: '1', user: 'EsportsPro', code: 'PRO50', totalReferrals: 12, earned: 600, status: 'active' },
    { id: '2', user: 'ProSlayer', code: 'SLAYER10', totalReferrals: 8, earned: 400, status: 'active' },
    { id: '3', user: 'NoobMaster69', code: 'NOOB20', totalReferrals: 3, earned: 150, status: 'inactive' },
  ]);
  const [settings, setSettings] = useState({
    referrerReward: '50',
    refereeBonus: '20',
    enabled: true
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this referral record?')) {
      setReferrals(prev => prev.filter(r => r.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setReferrals(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r
    ));
  };

  const handleNew = () => {
    const newRef = {
      id: Math.random().toString(36).substr(2, 9),
      user: 'New User',
      code: 'NEW' + Math.floor(Math.random() * 100),
      totalReferrals: 0,
      earned: 0,
      status: 'active'
    };
    setReferrals(prev => [...prev, newRef]);
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Referral & Rewards</h1>
        <Button onClick={handleNew} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Gift size={16} />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-brand-blue/5 border-brand-blue/10 flex flex-col justify-between h-full">
          <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest opacity-70">Total Referrals</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-blue leading-none">
              {referrals.reduce((acc, curr) => acc + curr.totalReferrals, 0)}
            </p>
            <Users size={20} className="text-brand-blue opacity-30" />
          </div>
        </Card>
        <Card className="p-5 bg-brand-green/5 border-brand-green/10 flex flex-col justify-between h-full">
          <p className="text-[10px] font-black text-brand-green uppercase tracking-widest opacity-70">Rewards Paid</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-green leading-none">
              ₹{referrals.reduce((acc, curr) => acc + curr.earned, 0)}
            </p>
            <Gift size={20} className="text-brand-green opacity-30" />
          </div>
        </Card>
        <Card className="p-5 bg-brand-yellow/5 border-brand-yellow/10 flex flex-col justify-between h-full sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest opacity-70">Conversion Rate</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-yellow leading-none">12.5%</p>
            <TrendingUp size={20} className="text-brand-yellow opacity-30" />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">Referral Settings</h2>
        <Card className="p-4 sm:p-6 bg-brand-card/40 border-white/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Referrer Reward (Coins)" 
              value={settings.referrerReward} 
              onChange={(e) => setSettings({...settings, referrerReward: e.target.value})}
            />
            <Input 
              label="Referee Bonus (Coins)" 
              value={settings.refereeBonus} 
              onChange={(e) => setSettings({...settings, refereeBonus: e.target.value})}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-bold truncate">Enable Referral System</p>
              <p className="text-xs text-slate-500 line-clamp-2">Allow users to invite friends and earn rewards</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, enabled: !settings.enabled})}
              className={`w-12 h-6 rounded-full relative transition-colors flex-shrink-0 ${settings.enabled ? 'bg-brand-blue' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.enabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">Top Referrers</h2>
        <div className="space-y-3">
          {referrals.map((ref, i) => (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 bg-brand-card/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{ref.user}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">Code: {ref.code}</span>
                      <button 
                        onClick={() => toggleStatus(ref.id)}
                        className={`text-[10px] font-black uppercase flex-shrink-0 ${
                          ref.status === 'active' ? 'text-brand-green' : 'text-slate-600'
                        }`}
                      >
                        {ref.status}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-black">₹{ref.earned}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ref.totalReferrals} Referrals</p>
                  </div>
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(ref.id)}
                      className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-brand-red transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
