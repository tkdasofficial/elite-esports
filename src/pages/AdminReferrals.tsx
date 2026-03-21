import React, { useState } from 'react';
import { Users, Gift, CheckCircle2, X, Coins, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformStore } from '@/src/store/platformStore';
import { cn } from '@/src/utils/helpers';

type Toast = { msg: string; ok: boolean } | null;

export default function AdminReferrals() {
  const { referrals, referralSettings, updateReferralSettings } = usePlatformStore();
  const [referrerBonus, setReferrerBonus] = useState(referralSettings?.referrerBonus ?? 50);
  const [refereeBonus, setRefereeBonus]   = useState(referralSettings?.refereeBonus ?? 25);
  const [maxReferrals, setMaxReferrals]   = useState(referralSettings?.maxReferrals ?? 10);
  const [toast, setToast]                 = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = () => {
    updateReferralSettings({ referrerBonus, refereeBonus, maxReferrals });
    showToast('Referral settings saved');
  };

  const totalReferrals   = referrals?.length ?? 0;
  const totalBonusPaid   = referrals?.reduce((s, r) => s + (r.bonusPaid ?? 0), 0) ?? 0;
  const activeReferrers  = referrals ? new Set(referrals.map(r => r.referrerId)).size : 0;

  const stats = [
    { label: 'Total Referrals', value: totalReferrals.toString(),              color: 'text-brand-primary', bg: 'bg-brand-primary/15', icon: Users   },
    { label: 'Bonus Paid',      value: `₹${totalBonusPaid.toLocaleString()}`, color: 'text-brand-success', bg: 'bg-brand-success/15', icon: Coins   },
    { label: 'Active Referrers',value: activeReferrers.toString(),             color: 'text-brand-warning', bg: 'bg-brand-warning/15', icon: Trophy  },
  ];

  return (
    <div className="pb-24 pt-2 space-y-5">
      {/* Toast */}
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

      {/* Header */}
      <div className="px-4 pt-2">
        <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Referrals</h1>
        <p className="text-[13px] text-text-muted font-normal mt-0.5">Manage your referral program</p>
      </div>

      {/* Stats */}
      <section className="px-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-app-card rounded-[18px] p-3.5 space-y-2.5"
            >
              <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center', s.bg)}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className="text-[20px] font-bold text-text-primary tracking-tight">{s.value}</p>
                <p className="text-[11px] text-text-muted font-normal mt-0.5 leading-tight">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="px-4 space-y-3">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Program Settings</p>
        <div className="bg-app-card rounded-[18px] overflow-hidden divide-y divide-app-border">
          {[
            { label: 'Referrer Bonus', desc: 'Coins for inviting a friend', value: referrerBonus, setter: setReferrerBonus },
            { label: 'Referee Bonus',  desc: 'Coins for the new player',     value: refereeBonus,  setter: setRefereeBonus  },
            { label: 'Max Referrals',  desc: 'Maximum per user lifetime',     value: maxReferrals,  setter: setMaxReferrals  },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-normal text-text-primary">{item.label}</p>
                <p className="text-[12px] text-text-muted mt-0.5">{item.desc}</p>
              </div>
              <div className="relative shrink-0">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-text-muted">
                  {item.label !== 'Max Referrals' ? '₹' : '#'}
                </span>
                <input
                  type="number"
                  value={item.value}
                  onChange={e => item.setter(Number(e.target.value))}
                  className="w-[90px] bg-app-elevated border border-ios-sep rounded-[12px] py-2 pl-7 pr-3 text-[15px] font-medium text-text-primary outline-none focus:border-brand-primary transition-all text-right"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-brand-primary rounded-[14px] text-[15px] font-semibold text-white active:opacity-80 transition-opacity"
        >
          Save Settings
        </button>
      </section>

      {/* Referral Log */}
      <section className="px-4 space-y-3">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Referral Log</p>

        {!referrals || referrals.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-14 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <Gift size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">No referrals yet</p>
          </div>
        ) : (
          <div className="bg-app-card rounded-[18px] overflow-hidden divide-y divide-app-border">
            {referrals.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3.5 px-4 py-3.5"
              >
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 font-semibold text-[15px] text-brand-primary">
                  {r.referrerName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-text-primary truncate">
                    {r.referrerName} <span className="text-text-muted font-normal">invited</span> {r.refereeName}
                  </p>
                  <p className="text-[12px] text-text-muted mt-0.5">{new Date(r.date).toLocaleDateString()}</p>
                </div>
                <span className="text-[13px] font-semibold text-brand-success shrink-0">+₹{r.bonusPaid ?? 0}</span>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
