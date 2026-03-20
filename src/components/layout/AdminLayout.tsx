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

const SidebarContent = ({ onClose, user, onLogout }: any) => (
  <div className="flex flex-col h-full">
    <div className="px-5 py-5 flex items-center gap-3 border-b border-app-border">
      <Logo size={32} />
      <div>
        <p className="text-sm font-extrabold text-text-primary tracking-tight">Elite Esports</p>
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Admin Panel</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-auto w-8 h-8 bg-app-elevated rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
          <X size={15} />
        </button>
      )}
    </div>

    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollable-content">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={onClose}
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-semibold',
            isActive
              ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25'
              : 'text-text-secondary hover:bg-app-elevated hover:text-text-primary'
          )}
        >
          <item.icon size={17} />
          {item.label}
        </NavLink>
      ))}
    </nav>

    <div className="p-4 border-t border-app-border space-y-3">
      <div className="flex items-center gap-3 p-3.5 bg-app-elevated rounded-2xl border border-app-border">
        <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center font-bold text-white text-sm">
          {user?.username?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{user?.username}</p>
          <p className="text-[10px] font-medium text-text-muted">Administrator</p>
        </div>
      </div>
      <button onClick={onLogout}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-brand-live text-sm font-semibold hover:bg-brand-live/8 transition-all">
        <LogOut size={16} /> Sign Out
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-app-card border-r border-app-border h-full shrink-0">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col w-full h-full">
        <header className="h-[60px] px-5 flex items-center justify-between bg-app-card border-b border-app-border">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-sm font-extrabold text-text-primary">Admin</span>
          </div>
          <button onClick={() => setOpen(true)} className="w-9 h-9 bg-app-elevated border border-app-border rounded-xl flex items-center justify-center text-text-secondary">
            <Menu size={18} />
          </button>
        </header>
        <main className="flex-1 scrollable-content overflow-x-hidden">
          <div className="max-w-5xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <AnimatePresence>
          {open && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" />
              <motion.aside
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type:'spring', damping:26, stiffness:220 }}
                className="fixed inset-y-0 left-0 w-72 bg-app-card z-50 border-r border-app-border shadow-2xl"
              >
                <SidebarContent user={user} onClose={() => setOpen(false)} onLogout={handleLogout} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop main content */}
      <main className="hidden lg:block flex-1 scrollable-content overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
