import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Settings, Shield, Wallet, Bell, Globe, Save, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { usePlatformStore } from '@/src/store/platformStore';

type Toast = { msg: string; ok: boolean } | null;

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={cn('w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0', value ? 'bg-brand-blue' : 'bg-white/10')}>
    <motion.div animate={{ x: value ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
  </button>
);

export default function AdminSettings() {
  const { settings, updateSettings } = usePlatformStore();
  const [toast, setToast]      = useState<Toast>(null);
  const [showPw, setShowPw]    = useState(false);
  const [saving, setSaving]    = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    updateSettings(localSettings);
    setSaving(false);
    showToast('All settings saved successfully');
  };

  const set = (key: string, value: any) => setLocalSettings(prev => ({ ...prev, [key]: value }));

  const field = 'w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600';

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Admin Settings</h1>
        <Button onClick={handleSave} size="sm" disabled={saving}
          className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          {saving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Settings size={16} /></motion.div>
          ) : <Save size={16} />}
          {saving ? 'Saving…' : 'Save All'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Wallet size={18} className="text-brand-blue flex-shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Payment Details</h2>
          </div>
          <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
            {[
              { label: 'Admin UPI ID',       key: 'upiId', placeholder: 'admin@upi' },
              { label: 'Bank Account',       key: 'bank',  placeholder: '000000000000' },
              { label: 'IFSC Code',          key: 'ifsc',  placeholder: 'IFSC0000000' },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{f.label}</label>
                <input value={(localSettings as any)[f.key]} placeholder={f.placeholder}
                  onChange={e => set(f.key, e.target.value)}
                  className={field} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[['minWithdrawal', 'Min Withdrawal', '100'], ['maxWithdrawal', 'Max Withdrawal', '5000']].map(([k, l, p]) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{l}</label>
                  <input value={(localSettings as any)[k]} placeholder={`₹${p}`}
                    onChange={e => set(k, e.target.value)}
                    className={field} />
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Shield size={18} className="text-brand-red flex-shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Security</h2>
          </div>
          <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Admin Email</label>
              <input value={localSettings.adminEmail} placeholder="admin@yourdomain.com"
                onChange={e => set('adminEmail', e.target.value)}
                className={field} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Admin Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={localSettings.adminPassword} placeholder="••••••••"
                  onChange={e => set('adminPassword', e.target.value)}
                  className={`${field} pr-11`} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-sm font-bold">Two-Factor Auth</p><p className="text-xs text-slate-500">Require 2FA for admin login</p></div>
                <Toggle value={localSettings.twofa} onChange={() => set('twofa', !localSettings.twofa)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-sm font-bold">Login Notifications</p><p className="text-xs text-slate-500">Alert on new admin login</p></div>
                <Toggle value={localSettings.loginNotif} onChange={() => set('loginNotif', !localSettings.loginNotif)} />
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Globe size={18} className="text-brand-green flex-shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Platform</h2>
          </div>
          <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
            {[['platformName', 'Platform Name', 'Elite Esports'], ['supportEmail', 'Support Email', 'support@elite.com']].map(([k, l, p]) => (
              <div key={k} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{l}</label>
                <input value={(localSettings as any)[k]} placeholder={p}
                  onChange={e => set(k, e.target.value)}
                  className={field} />
              </div>
            ))}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Temporarily disable user access</p>
              </div>
              <Toggle value={localSettings.maintenance} onChange={() => set('maintenance', !localSettings.maintenance)} />
            </div>
            {localSettings.maintenance && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs text-brand-yellow font-bold bg-brand-yellow/10 px-3 py-2 rounded-xl border border-brand-yellow/20">
                ⚠ Maintenance mode is ON — users cannot access the app.
              </motion.p>
            )}
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Bell size={18} className="text-brand-yellow flex-shrink-0" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</h2>
          </div>
          <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
            {[
              ['emailAlerts', 'Email Alerts',       'Receive alerts on important events'],
              ['pushNotifs',  'Push Notifications', 'Send push alerts to users'],
              ['smsAlerts',   'SMS Alerts',         'Send SMS for critical events'],
            ].map(([k, l, d]) => (
              <div key={k} className="flex items-center justify-between gap-4">
                <div><p className="text-sm font-bold">{l}</p><p className="text-xs text-slate-500">{d}</p></div>
                <Toggle value={(localSettings as any)[k]} onChange={() => set(k, !(localSettings as any)[k])} />
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
