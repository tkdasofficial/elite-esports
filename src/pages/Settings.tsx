import { useState } from 'react';
import { Bell, Shield, Eye, HelpCircle, Info, ChevronRight, Moon, Globe, Smartphone, LogOut, UserX } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/src/store/userStore';

type SettingToggle = {
  darkMode: boolean;
  notifications: string;
  language: string;
  onlineStatus: boolean;
};

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Bengali'];
const NOTIFICATION_OPTS = ['All', 'Matches Only', 'None'];

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useUserStore();

  const [settings, setSettings] = useState<SettingToggle>({
    darkMode: true,
    notifications: 'All',
    language: 'English',
    onlineStatus: true,
  });

  const [showLangPicker, setShowLangPicker]     = useState(false);
  const [showNotifPicker, setShowNotifPicker]   = useState(false);

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <motion.button
      onClick={onToggle}
      animate={{ backgroundColor: on ? '#FF4500' : '#2C2C2E' }}
      transition={{ duration: 0.18 }}
      className="relative w-[51px] h-[31px] rounded-full flex-shrink-0 focus:outline-none"
      style={{ minWidth: 51 }}
    >
      <motion.span
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
        className="absolute top-[3px] w-[25px] h-[25px] bg-white rounded-full shadow-md"
        style={{ left: 0 }}
      />
    </motion.button>
  );

  const Picker = ({ visible, options, current, onSelect, onClose }: {
    visible: boolean; options: string[]; current: string;
    onSelect: (v: string) => void; onClose: () => void;
  }) => {
    if (!visible) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-[440px] bg-app-card rounded-t-[28px] pb-8"
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
          </div>
          <div className="divide-y divide-app-border">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); onClose(); }}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-app-elevated transition-colors"
              >
                <span className="text-[16px] font-normal text-text-primary">{opt}</span>
                {opt === current && (
                  <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center bg-app-bg/90 backdrop-blur-md border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="text-[17px] text-brand-primary font-normal">‹ Account</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Settings</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 space-y-7 pb-10">
        <section className="space-y-2">
          <p className="ios-section-header">Preferences</p>
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <div className="flex items-center gap-3.5 px-4 py-3.5">
                <div className="w-9 h-9 rounded-[10px] bg-brand-primary/15 text-brand-primary-light flex items-center justify-center shrink-0">
                  <Moon size={17} />
                </div>
                <span className="flex-1 text-[16px] font-normal text-text-primary">Dark Mode</span>
                <Toggle on={settings.darkMode} onToggle={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
              <button
                onClick={() => setShowNotifPicker(true)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-brand-warning/15 text-brand-warning flex items-center justify-center shrink-0">
                  <Bell size={17} />
                </div>
                <span className="flex-1 text-left text-[16px] font-normal text-text-primary">Notifications</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-normal text-text-muted">{settings.notifications}</span>
                  <ChevronRight size={15} className="text-text-muted" />
                </div>
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <button
                onClick={() => setShowLangPicker(true)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-brand-success/15 text-brand-success flex items-center justify-center shrink-0">
                  <Globe size={17} />
                </div>
                <span className="flex-1 text-left text-[16px] font-normal text-text-primary">Language</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-normal text-text-muted">{settings.language}</span>
                  <ChevronRight size={15} className="text-text-muted" />
                </div>
              </button>
            </motion.div>
          </div>
        </section>

        <section className="space-y-2">
          <p className="ios-section-header">Privacy & Security</p>
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
              <Link to="/privacy-policy">
                <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                  <div className="w-9 h-9 rounded-[10px] bg-brand-primary/15 text-brand-primary-light flex items-center justify-center shrink-0">
                    <Shield size={17} />
                  </div>
                  <span className="flex-1 text-[16px] font-normal text-text-primary">Privacy Policy</span>
                  <ChevronRight size={15} className="text-text-muted" />
                </div>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <div className="flex items-center gap-3.5 px-4 py-3.5">
                <div className="w-9 h-9 rounded-[10px] bg-brand-cyan/15 text-brand-cyan flex items-center justify-center shrink-0">
                  <Eye size={17} />
                </div>
                <span className="flex-1 text-[16px] font-normal text-text-primary">Online Status</span>
                <Toggle
                  on={settings.onlineStatus}
                  onToggle={() => setSettings(s => ({ ...s, onlineStatus: !s.onlineStatus }))}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Link to="/blocked-users">
                <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                  <div className="w-9 h-9 rounded-[10px] bg-brand-live/15 text-brand-live flex items-center justify-center shrink-0">
                    <UserX size={17} />
                  </div>
                  <span className="flex-1 text-[16px] font-normal text-text-primary">Blocked Users</span>
                  <ChevronRight size={15} className="text-text-muted" />
                </div>
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="space-y-2">
          <p className="ios-section-header">Support</p>
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Link to="/help-center">
                <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                  <div className="w-9 h-9 rounded-[10px] bg-app-elevated text-text-secondary flex items-center justify-center shrink-0">
                    <HelpCircle size={17} />
                  </div>
                  <span className="flex-1 text-[16px] font-normal text-text-primary">Help Center</span>
                  <ChevronRight size={15} className="text-text-muted" />
                </div>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
              <Link to="/about">
                <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                  <div className="w-9 h-9 rounded-[10px] bg-app-elevated text-text-secondary flex items-center justify-center shrink-0">
                    <Info size={17} />
                  </div>
                  <span className="flex-1 text-[16px] font-normal text-text-primary">About Elite Esports</span>
                  <ChevronRight size={15} className="text-text-muted" />
                </div>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
              <div className="flex items-center gap-3.5 px-4 py-3.5">
                <div className="w-9 h-9 rounded-[10px] bg-app-elevated text-text-secondary flex items-center justify-center shrink-0">
                  <Smartphone size={17} />
                </div>
                <span className="flex-1 text-[16px] font-normal text-text-primary">App Version</span>
                <span className="text-[14px] font-normal text-text-muted">1.0.4</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <Link to="/terms">
              <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                <span className="flex-1 text-[16px] font-normal text-text-secondary">Terms & Conditions</span>
                <ChevronRight size={15} className="text-text-muted" />
              </div>
            </Link>
          </div>
        </section>

        <section className="space-y-2">
          <div className="bg-app-card rounded-[16px] overflow-hidden">
            <button onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
              <div className="w-9 h-9 rounded-[10px] bg-brand-live/15 text-brand-live flex items-center justify-center shrink-0">
                <LogOut size={17} />
              </div>
              <span className="text-[16px] font-normal text-brand-live">Sign Out</span>
            </button>
          </div>
        </section>

        <div className="text-center space-y-0.5 pt-2 pb-4 opacity-40">
          <p className="text-[12px] text-text-muted font-normal">Elite Esports Platform</p>
          <p className="text-[11px] text-text-muted font-normal">Build 2026.03.20 · v1.0.4</p>
        </div>
      </div>

      <Picker
        visible={showNotifPicker}
        options={NOTIFICATION_OPTS}
        current={settings.notifications}
        onSelect={v => setSettings(s => ({ ...s, notifications: v }))}
        onClose={() => setShowNotifPicker(false)}
      />
      <Picker
        visible={showLangPicker}
        options={LANGUAGES}
        current={settings.language}
        onSelect={v => setSettings(s => ({ ...s, language: v }))}
        onClose={() => setShowLangPicker(false)}
      />
    </div>
  );
}
