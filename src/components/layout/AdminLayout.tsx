import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Gamepad2,
  Bell,
  Share2,
  MessageSquare,
  FileText,
  LayoutDashboard,
  Users,
  Trophy,
  Wallet,
  Image as ImageIcon,
  Code,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useUserStore } from '@/src/store/userStore';
import { Logo } from '@/src/components/common/Logo';
import { cn } from '@/src/utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

export const AdminLayout = () => {
  const { logout, user } = useUserStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Trophy, label: 'Matches', path: '/admin/matches' },
    { icon: Gamepad2, label: 'Games', path: '/admin/games' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Wallet, label: 'Economy', path: '/admin/economy' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: ImageIcon, label: 'Campaign', path: '/admin/campaign' },
    { icon: Share2, label: 'Referrals', path: '/admin/referrals' },
    { icon: MessageSquare, label: 'Support', path: '/admin/support' },
    { icon: FileText, label: 'Rules & Policies', path: '/admin/rules' },
    { icon: Code, label: 'Tags', path: '/admin/tags' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full w-full bg-brand-dark overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-brand-card border-r border-white/5 h-full">
        <div className="p-6 flex items-center gap-3">
          <Logo size={32} />
          <span className="text-lg font-black tracking-tight">ADMIN PANEL</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                isActive 
                  ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center font-black text-white">
              {user?.username?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand-red font-bold text-sm hover:bg-brand-red/10 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="lg:hidden flex flex-col w-full h-full">
        <header className="h-16 bg-brand-card border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <span className="text-sm font-black tracking-tight">ADMIN</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white/5 rounded-xl text-slate-400"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto scrollable-content overflow-x-hidden">
          <div className="max-w-5xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-brand-card z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Logo size={32} />
                    <span className="text-lg font-black tracking-tight">ADMIN</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 bg-white/5 rounded-xl text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                        isActive 
                          ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20" 
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <div className="p-6 border-t border-white/5">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-brand-red font-bold text-sm hover:bg-brand-red/10 transition-all"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Main Content */}
      <main className="hidden lg:block flex-1 overflow-y-auto scrollable-content overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
