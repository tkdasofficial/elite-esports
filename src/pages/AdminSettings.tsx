import React, { useState } from 'react';
import { Save, CheckCircle2, X, Shield, Coins, Users, Bell, Globe, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformStore } from '@/src/store/platformStore';
import { cn } from '@/src/utils/helpers';

type Toast = { msg: string; ok: boolean } | null;

const IOSToggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={cn('w-[51px] h-[31px] rounded-full relative transition-colors duration-200 flex-shrink-0', value ? 'bg-brand-success' : 'bg-app-elevated border border-ios-sep')}
  >
    <motion.div
      animate={{ x: value ? 22 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-[3px] w-[25px] h-[25px] bg-white rounded-full shadow-md"
    />
  </button>
);

export default function AdminSettings() {
  const { platformSettings, updatePlatformSettings } = usePlatformStore();
  const [settings, setSettings] = useState({
    platformName:         platformSettings?.platformName         ?? 'Elite Esports',
    maintenanceMode:      platformSettings?.maintenanceMode      ?? false,
    registrationOpen:     platformSettings?.registrationOpen     ?? true,
    minWithdrawal:        platformSettings?.minWithdrawal        ?? 100,
    maxWithdrawal:        platformSettings?.maxWithdrawal        ?? 10000,
    withdrawalFee:        platformSettings?.withdrawalFee        ?? 2,
    referralEnabled:      platformSettings?.referralEnabled      ?? true,
    notificationsEnabled: platformSettings?.notificationsEnabled ?? true,
    autoApproveDeposits:  platformSettings?.autoApproveDeposits  ?? false,
    maxTeamSize:          platformSettings?.maxTeamSize          ?? 4,
    supportEmail:         platformSettings?.supportEmail         ?? 'support@eliteesports.com',
  });
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const set = (key: string, value: any) => setSettings(s => ({ ...s, [key]: value }));

  const handleSave = () => {
    updatePlatformSettings(settings);
    showToast('Settings saved');
  };

  const sections = [
    {
      title: 'Platform',
      icon: Globe,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/15',
      fields: [
        { type: 'text',   key: 'platformName', label: 'Platform Name', placeholder: 'Elite Esports' },
        { type: 'text',   key: 'supportEmail', label: 'Support Email',  placeholder: 'support@example.com' },
      ],
      toggles: [
        { key: 'maintenanceMode',  label: 'Maintenance Mode', desc: 'Locks the app for all non-admins', danger: true },
        { key: 'registrationOpen', label: 'Registrations Open', desc: 'Allow new players to register' },
      ],
    },
    {
      title: 'Economy',
      icon: Coins,
      color: 'text-brand-success',
      bg: 'bg-brand-success/15',
      fields: [
        { type: 'number', key: 'minWithdrawal', label: 'Min Withdrawal (₹)', placeholder: '100'   },
        { type: 'number', key: 'maxWithdrawal', label: 'Max Withdrawal (₹)', placeholder: '10000' },
        { type: 'number', key: 'withdrawalFee', label: 'Withdrawal Fee (%)', placeholder: '2'     },
      ],
      toggles: [
        { key: 'autoApproveDeposits', label: 'Auto-approve Deposits', desc: 'Approve deposits without manual review' },
      ],
    },
    {
      title: 'Features',
      icon: Zap,
      color: 'text-brand-warning',
      bg: 'bg-brand-warning/15',
      fields: [
        { type: 'number', key: 'maxTeamSize', label: 'Max Team Size', placeholder: '4' },
      ],
      toggles: [
        { key: 'referralEnabled',      label: 'Referral Program',    desc: 'Enable the referral system' },
        { key: 'notificationsEnabled', label: 'Push Notifications',  desc: 'Enable app notifications' },
      ],
    },
  ];

  return (
    <div className="pb-24 pt-2 space-y-6">
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
        <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Settings</h1>
        <p className="text-[13px] text-text-muted font-normal mt-0.5">Platform configuration</p>
      </div>

      {/* Settings sections */}
      {sections.map((section, si) => (
        <motion.section
          key={section.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.07 }}
          className="px-4 space-y-3"
        >
          {/* Section header */}
          <div className="flex items-center gap-2.5 px-1">
            <div className={cn('w-7 h-7 rounded-[8px] flex items-center justify-center', section.bg)}>
              <section.icon size={14} className={section.color} />
            </div>
            <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal">{section.title}</p>
          </div>

          {/* Text / number inputs */}
          {section.fields.length > 0 && (
            <div className="bg-app-card rounded-[18px] overflow-hidden divide-y divide-app-border">
              {section.fields.map(field => (
                <div key={field.key} className="flex items-center gap-4 px-4 py-3.5">
                  <label className="text-[15px] font-normal text-text-primary flex-1 min-w-0">{field.label}</label>
                  <input
                    type={field.type}
                    value={(settings as any)[field.key] ?? ''}
                    onChange={e => set(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={field.placeholder}
                    className="bg-app-elevated border border-ios-sep rounded-[12px] py-2 px-3.5 text-[14px] font-medium text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all text-right w-[140px]"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Toggle rows */}
          {section.toggles.length > 0 && (
            <div className="bg-app-card rounded-[18px] overflow-hidden divide-y divide-app-border">
              {section.toggles.map(toggle => (
                <div key={toggle.key} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-[15px] font-normal', (toggle as any).danger && (settings as any)[toggle.key] ? 'text-brand-live' : 'text-text-primary')}>
                      {toggle.label}
                    </p>
                    <p className="text-[12px] text-text-muted mt-0.5">{toggle.desc}</p>
                  </div>
                  <IOSToggle
                    value={!!(settings as any)[toggle.key]}
                    onChange={() => set(toggle.key, !(settings as any)[toggle.key])}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.section>
      ))}

      {/* Maintenance warning */}
      <AnimatePresence>
        {settings.maintenanceMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mx-4 p-4 bg-brand-live/5 border border-brand-live/20 rounded-[16px] flex items-start gap-3"
          >
            <Shield size={18} className="text-brand-live shrink-0 mt-0.5" />
            <p className="text-[13px] text-brand-live leading-relaxed">
              Maintenance mode is <strong>ON</strong>. Regular users cannot access the platform. Only admins can log in.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save button */}
      <div className="px-4">
        <button
          onClick={handleSave}
          className="w-full py-4 bg-brand-primary rounded-[16px] text-[16px] font-semibold text-white active:opacity-80 transition-opacity flex items-center justify-center gap-2"
        >
          <Save size={18} /> Save All Settings
        </button>
      </div>
    </div>
  );
}
