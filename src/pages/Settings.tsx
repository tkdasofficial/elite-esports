import {
  ChevronLeft, Bell, Shield, Eye, HelpCircle,
  Info, ChevronRight, Moon, Globe, Smartphone,
  LogOut, UserX
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/src/store/userStore';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useUserStore();

  const handleLogout = () => { logout(); navigate('/login'); };

  const groups = [
    {
      title: 'Preferences',
      items: [
        { icon: Moon,  label:'Dark Mode',     value:'On',      iconBg:'bg-indigo-500/12 text-indigo-400' },
        { icon: Bell,  label:'Notifications', value:'All',     iconBg:'bg-brand-warning/12 text-brand-warning' },
        { icon: Globe, label:'Language',      value:'English', iconBg:'bg-brand-success/12 text-brand-success' },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: Shield, label:'Privacy Policy',     iconBg:'bg-brand-primary/12 text-brand-primary-light' },
        { icon: Eye,    label:'Show Online Status', value:'Yes', iconBg:'bg-brand-cyan/12 text-brand-cyan' },
        { icon: UserX,  label:'Blocked Users',      iconBg:'bg-brand-live/12 text-brand-live' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label:'Help Center',  iconBg:'bg-app-elevated text-text-secondary' },
        { icon: Info,       label:'About Elite',  iconBg:'bg-app-elevated text-text-secondary' },
        { icon: Smartphone, label:'App Version',  value:'1.0.4', iconBg:'bg-app-elevated text-text-secondary' },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[60px] px-5 flex items-center gap-3 glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-transform">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[17px] font-bold text-text-primary">Settings</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-6 space-y-7 pb-16">
        {groups.map((group, gi) => (
          <section key={group.title} className="space-y-2.5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest px-1">{group.title}</p>
            <div className="space-y-2">
              {group.items.map((item, ii) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (gi * 3 + ii) * 0.04 }}
                >
                  <div className="flex items-center justify-between bg-app-card border border-app-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/25 active:scale-[0.98] transition-all group">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                        <item.icon size={18} />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(item as any).value && (
                        <span className="text-xs font-semibold text-text-muted bg-app-elevated px-2 py-0.5 rounded-lg border border-app-border">
                          {(item as any).value}
                        </span>
                      )}
                      <ChevronRight size={15} className="text-text-muted group-hover:text-text-secondary transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        <div className="space-y-6 pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-brand-live/8 border border-brand-live/20 rounded-2xl flex items-center justify-center gap-2 text-brand-live text-sm font-semibold hover:bg-brand-live/15 transition-all active:scale-[0.98]"
          >
            <LogOut size={16} />
            Sign Out
          </button>

          <div className="text-center space-y-1 opacity-40">
            <p className="text-[11px] font-semibold text-text-muted">Elite Esports Platform</p>
            <p className="text-[10px] text-text-muted">Build 2026.03.20</p>
          </div>
        </div>
      </div>
    </div>
  );
}
