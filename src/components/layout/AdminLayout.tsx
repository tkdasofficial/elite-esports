import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Gamepad2, Bell, Share2, MessageSquare, FileText,
  LayoutDashboard, Users, Trophy, Wallet, Image as ImageIcon,
  Code, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useUserStore } from '@/src/store/userStore';
import { Logo } from '@/src/components/common/Logo';
import { cn } from '@/src/utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/admin/dashboard' },
  { icon: Trophy,          label: 'Matches',         path: '/admin/matches' },
  { icon: Gamepad2,        label: 'Games',           path: '/admin/games' },
  { icon: Users,           label: 'Users',           path: '/admin/users' },
  { icon: Wallet,          label: 'Economy',         path: '/admin/economy' },
  { icon: Bell,            label: 'Notifications',   path: '/admin/notifications' },
  { icon: ImageIcon,       label: 'Campaign',        path: '/admin/campaign' },
  { icon: Share2,          label: 'Referrals',       path: '/admin/referrals' },
  { icon: MessageSquare,   label: 'Support',         path: '/admin/support' },
  { icon: FileText,        label: 'Rules & Policies',path: '/admin/rules' },
  { icon: Code,            label: 'Tags',            path: '/admin/tags' },
  { icon: Settings,        label: 'Settings',        path: '/admin/settings' },
];

const Sidebar = ({ onClose, user, onLogout }: any) => (
  <div className="flex flex-col h-full bg-ios-bg2">
    <div className="px-5 py-5 flex items-center gap-3 border-b border-ios-sep">
      <div className="w-9 h-9 bg-brand-primary rounded-[12px] flex items-center justify-center">
        <Logo size={24} />
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-semibold text-text-primary">Elite Esports</p>
        <p className="text-[12px] text-text-muted font-normal">Admin Panel</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-app-elevated flex items-center justify-center text-text-muted active:opacity-60">
          <X size={15}/>
        </button>
      )}
    </div>

    <nav className="flex-1 px-3 py-3 space-y-[1px] overflow-y-auto scrollable-content">
      {navItems.map(item => (
        <NavLink key={item.path} to={item.path} onClick={onClose}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] transition-all text-[15px] font-normal',
            isActive
              ? 'bg-brand-primary text-white'
              : 'text-text-secondary hover:bg-app-elevated hover:text-text-primary'
          )}
        >
          <item.icon size={17}/>
          {item.label}
        </NavLink>
      ))}
    </nav>

    <div className="p-4 border-t border-ios-sep space-y-3">
      <div className="flex items-center gap-3 p-3 bg-app-elevated rounded-[14px]">
        <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center font-semibold text-white text-[15px] shrink-0">
          {user?.username?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-normal text-text-primary truncate">{user?.username}</p>
          <p className="text-[12px] text-text-muted font-normal">Administrator</p>
        </div>
      </div>
      <button onClick={onLogout}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-brand-live text-[15px] font-normal hover:bg-brand-live/8 transition-colors active:opacity-60">
        <LogOut size={16}/> Sign Out
      </button>
    </div>
  </div>
);

export const AdminLayout = () => {
  const { logout, user } = useUserStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-full w-full bg-app-bg overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 h-full shrink-0 border-r border-ios-sep">
        <Sidebar user={user} onLogout={handleLogout}/>
      </aside>

      <div className="lg:hidden flex flex-col w-full h-full">
        <header className="h-[56px] px-5 flex items-center justify-between glass-dark border-b border-ios-sep">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-primary rounded-[8px] flex items-center justify-center">
              <Logo size={18}/>
            </div>
            <span className="text-[17px] font-semibold text-text-primary">Admin</span>
          </div>
          <button onClick={() => setOpen(true)}
            className="w-9 h-9 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
            <Menu size={18}/>
          </button>
        </header>
        <main className="flex-1 scrollable-content overflow-x-hidden">
          <div className="max-w-5xl mx-auto w-full"><Outlet/></div>
        </main>

        <AnimatePresence>
          {open && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                onClick={() => setOpen(false)} className="fixed inset-0 bg-black/75 z-40 backdrop-blur-sm"/>
              <motion.aside
                initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}}
                transition={{type:'spring',damping:28,stiffness:220}}
                className="fixed inset-y-0 left-0 w-72 z-50 border-r border-ios-sep shadow-2xl">
                <Sidebar user={user} onClose={() => setOpen(false)} onLogout={handleLogout}/>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <main className="hidden lg:block flex-1 scrollable-content overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full"><Outlet/></div>
      </main>
    </div>
  );
};
