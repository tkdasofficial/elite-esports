import { Bell, Shield, Eye, HelpCircle, Info, ChevronRight, Moon, Globe, Smartphone, LogOut, UserX } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/src/store/userStore';

const GROUPS = [
  {
    title: 'Preferences',
    items: [
      { icon: Moon,  label:'Dark Mode',     value:'On',      color:'bg-brand-primary/15 text-brand-primary-light' },
      { icon: Bell,  label:'Notifications', value:'All',     color:'bg-brand-warning/15 text-brand-warning' },
      { icon: Globe, label:'Language',      value:'English', color:'bg-brand-success/15 text-brand-success' },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      { icon: Shield, label:'Privacy Policy',     color:'bg-brand-primary/15 text-brand-primary-light' },
      { icon: Eye,    label:'Online Status',  value:'Visible', color:'bg-brand-cyan/15 text-brand-cyan' },
      { icon: UserX,  label:'Blocked Users',      color:'bg-brand-live/15 text-brand-live' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label:'Help Center',          color:'bg-app-elevated text-text-secondary' },
      { icon: Info,       label:'About Elite Esports',  color:'bg-app-elevated text-text-secondary' },
      { icon: Smartphone, label:'App Version',  value:'1.0.4', color:'bg-app-elevated text-text-secondary' },
    ],
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useUserStore();

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center gap-3 glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="text-[17px] text-brand-primary font-normal">‹ Account</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Settings</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 space-y-7 pb-10">
        {GROUPS.map((group, gi) => (
          <section key={group.title} className="space-y-2">
            <p className="ios-section-header">{group.title}</p>
            <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
              {group.items.map((item, ii) => (
                <motion.div key={item.label}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:(gi*3+ii)*0.03 }}>
                  <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors cursor-pointer">
                    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon size={17} />
                    </div>
                    <span className="flex-1 text-[16px] font-normal text-text-primary">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {(item as any).value && (
                        <span className="text-[14px] font-normal text-text-muted">{(item as any).value}</span>
                      )}
                      <ChevronRight size={15} className="text-text-muted" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        {/* Sign out */}
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
    </div>
  );
}
