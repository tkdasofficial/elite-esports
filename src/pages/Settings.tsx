import { Card } from '@/src/components/ui/Card';
import { 
  ChevronLeft, 
  Bell, 
  Shield, 
  Eye, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  Moon, 
  Globe, 
  Smartphone,
  LogOut,
  UserX
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/src/store/userStore';

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const settingGroups = [
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Dark Mode', value: 'On', color: 'text-brand-blue' },
        { icon: Bell, label: 'Notifications', value: 'All', color: 'text-brand-yellow' },
        { icon: Globe, label: 'Language', value: 'English', color: 'text-brand-green' },
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: Shield, label: 'Privacy Policy', color: 'text-indigo-400' },
        { icon: Eye, label: 'Show Online Status', value: 'Yes', color: 'text-emerald-400' },
        { icon: UserX, label: 'Blocked Users', color: 'text-slate-400' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', color: 'text-slate-400' },
        { icon: Info, label: 'About Elite', color: 'text-slate-400' },
        { icon: Smartphone, label: 'App Version', value: '1.0.4', color: 'text-slate-400' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 px-6 flex items-center gap-4 bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link to="/profile" className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-hide pb-32">
        {settingGroups.map((group, groupIndex) => (
          <section key={group.title} className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">{group.title}</h2>
            <div className="space-y-3">
              {group.items.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (groupIndex * 3 + index) * 0.05 }}
                >
                  <Card className="p-4 flex items-center justify-between bg-brand-card/40 border-white/5 shadow-lg active:scale-[0.98] transition-all hover:bg-white/5 cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl bg-white/5 ${item.color} shadow-inner group-hover:bg-white/10 transition-colors`}>
                        <item.icon size={20} />
                      </div>
                      <span className="text-sm font-black tracking-tight">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.value && (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg border border-white/5">{item.value}</span>
                      )}
                      <ChevronRight size={18} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        ))}

        <div className="pt-6 space-y-8">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={handleLogout}
            className="w-full p-5 bg-brand-red/10 border border-brand-red/20 rounded-[24px] flex items-center justify-center gap-3 text-brand-red font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-red hover:text-white transition-all active:scale-95 shadow-lg shadow-brand-red/10"
          >
            <LogOut size={18} />
            Logout Account
          </motion.button>

          <div className="text-center space-y-1 opacity-40">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Elite Esports Platform</p>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">Build 2026.03.20.07</p>
          </div>
        </div>
      </div>
    </div>
  );
}
