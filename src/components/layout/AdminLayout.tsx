import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Gamepad2, Bell, Share2, MessageSquare, FileText,
  LayoutDashboard, Users, Trophy, Wallet, Image as ImageIcon,
  Code, Settings, LogOut, X, LayoutGrid, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { useUserStore } from '@/src/store/userStore';
import { Logo } from '@/src/components/common/Logo';
import { cn } from '@/src/utils/helpers';
import { motion, AnimatePresence } from 'motion/react';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':    'Dashboard',
  '/admin/matches':      'Tournaments',
  '/admin/games':        'Games',
  '/admin/categories':   'Categories',
  '/admin/users':        'Players',
  '/admin/economy':      'Finance',
  '/admin/notifications':'Notifications',
  '/admin/campaign':     'Campaign',
  '/admin/referrals':    'Referrals',
  '/admin/support':      'Support',
  '/admin/rules':        'Rules & Policies',
  '/admin/tags':         'Ad Tags',
  '/admin/settings':     'Settings',
  '/admin/matches/new':  'New Tournament',
};

const BOTTOM_TABS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Trophy,          label: 'Matches',   path: '/admin/matches' },
  { icon: Users,           label: 'Players',   path: '/admin/users' },
  { icon: Wallet,          label: 'Finance',   path: '/admin/economy' },
];

const MORE_ITEMS = [
  { icon: Gamepad2,      label: 'Games',         path: '/admin/games',          color: 'text-brand-blue',    bg: 'bg-brand-blue/15' },
  { icon: LayoutGrid,    label: 'Categories',    path: '/admin/categories',     color: 'text-brand-green',   bg: 'bg-brand-success/15' },
  { icon: Bell,          label: 'Notifications', path: '/admin/notifications',  color: 'text-brand-warning', bg: 'bg-brand-warning/15' },
  { icon: ImageIcon,     label: 'Campaign',      path: '/admin/campaign',       color: 'text-brand-primary-light', bg: 'bg-brand-primary/15' },
  { icon: Share2,        label: 'Referrals',     path: '/admin/referrals',      color: 'text-brand-cyan',    bg: 'bg-brand-cyan/15' },
  { icon: MessageSquare, label: 'Support',       path: '/admin/support',        color: 'text-brand-green',   bg: 'bg-brand-success/15' },
  { icon: FileText,      label: 'Rules',         path: '/admin/rules',          color: 'text-text-secondary',bg: 'bg-app-elevated' },
  { icon: Code,          label: 'Ad Tags',       path: '/admin/tags',           color: 'text-brand-blue',    bg: 'bg-brand-blue/15' },
  { icon: Settings,      label: 'Settings',      path: '/admin/settings',       color: 'text-text-secondary',bg: 'bg-app-elevated' },
];

const SIDEBAR_NAV = [...BOTTOM_TABS.map(t => ({ ...t, color: 'text-brand-primary', bg: 'bg-brand-primary/10' })), ...MORE_ITEMS];

const getPageTitle = (pathname: string) => {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/admin/matches/edit/')) return 'Edit Tournament';
  return 'Admin';
};

const isNestedRoute = (pathname: string) =>
  pathname.startsWith('/admin/matches/new') ||
  pathname.startsWith('/admin/matches/edit/');

export const AdminLayout = () => {
  const { logout, user } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const pathname    = location.pathname;
  const pageTitle   = getPageTitle(pathname);
  const isNested    = isNestedRoute(pathname);
  const isMoreRoute = MORE_ITEMS.some(m => m.path === pathname);
  const activeTab   = BOTTOM_TABS.find(t =>
    t.path === '/admin/matches'
      ? pathname.startsWith('/admin/matches')
      : t.path === pathname
  )?.path ?? null;

  return (
    <div className="flex h-full w-full bg-app-bg overflow-hidden">

      {/* ─── Desktop sidebar ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] h-full shrink-0 border-r border-ios-sep bg-ios-bg2">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-ios-sep">
          <div className="w-9 h-9 bg-brand-primary rounded-[12px] flex items-center justify-center shrink-0">
            <Logo size={22} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-text-primary">Elite Esports</p>
            <p className="text-[12px] text-text-muted font-normal">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-[1px] overflow-y-auto scrollable-content">
          {SIDEBAR_NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all text-[15px]',
                isActive
                  ? 'bg-brand-primary text-white font-medium'
                  : 'text-text-secondary hover:bg-app-elevated hover:text-text-primary font-normal'
              )}
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-ios-sep space-y-3">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-app-elevated rounded-[14px]">
            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center font-semibold text-white text-[14px] shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-text-primary truncate">{user?.username}</p>
              <p className="text-[11px] text-text-muted font-normal">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-brand-live text-[14px] font-normal hover:bg-brand-live/8 transition-colors active:opacity-60"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Mobile layout ────────────────────────── */}
      <div className="lg:hidden flex flex-col w-full h-full">

        {/* iOS Nav Bar */}
        <header className="h-[56px] px-4 flex items-center glass-dark border-b border-ios-sep sticky top-0 z-50 shrink-0">
          {isNested ? (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-[17px] text-brand-primary font-normal active:opacity-60 transition-opacity mr-auto"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          ) : (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-7 h-7 bg-brand-primary rounded-[8px] flex items-center justify-center shrink-0">
                <Logo size={17} />
              </div>
            </div>
          )}

          <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary tracking-[-0.3px]">
            {pageTitle}
          </h1>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 bg-brand-success/10 rounded-full border border-brand-success/20">
              <div className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-brand-success uppercase tracking-wide">Live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 scrollable-content overflow-x-hidden">
          <Outlet />
        </main>

        {/* iOS Bottom Tab Bar */}
        <nav className="glass-dark border-t border-ios-sep h-[64px] shrink-0 flex items-center justify-around px-2">
          {BOTTOM_TABS.map(tab => {
            const isActive = activeTab === tab.path && !isMoreRoute && !showMore;
            return (
              <button
                key={tab.path}
                onClick={() => { setShowMore(false); navigate(tab.path); }}
                className="flex-1 flex flex-col items-center gap-[3px] pt-1 active:opacity-60 transition-opacity"
              >
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-brand-primary' : 'text-text-muted'}
                />
                <span className={cn(
                  'text-[10px] tracking-tight font-medium leading-none',
                  isActive ? 'text-brand-primary' : 'text-text-muted'
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setShowMore(s => !s)}
            className="flex-1 flex flex-col items-center gap-[3px] pt-1 active:opacity-60 transition-opacity"
          >
            <LayoutGrid
              size={22}
              strokeWidth={(isMoreRoute || showMore) ? 2.5 : 1.8}
              className={(isMoreRoute || showMore) ? 'text-brand-primary' : 'text-text-muted'}
            />
            <span className={cn(
              'text-[10px] tracking-tight font-medium leading-none',
              (isMoreRoute || showMore) ? 'text-brand-primary' : 'text-text-muted'
            )}>
              More
            </span>
          </button>
        </nav>

        {/* More Sheet */}
        <AnimatePresence>
          {showMore && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowMore(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-app-card rounded-t-[28px] pb-8"
              >
                {/* Handle + header */}
                <div className="flex justify-center pt-3 pb-4">
                  <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
                </div>

                <div className="flex items-center justify-between px-5 mb-4">
                  <h2 className="text-[20px] font-semibold text-text-primary">More</h2>
                  <button
                    onClick={() => setShowMore(false)}
                    className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 gap-3 px-5">
                  {MORE_ITEMS.map(item => (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => { setShowMore(false); navigate(item.path); }}
                      className="flex flex-col items-center gap-2.5 py-4 bg-app-elevated rounded-[16px] active:opacity-70 transition-opacity"
                    >
                      <div className={cn('w-11 h-11 rounded-[14px] flex items-center justify-center', item.bg)}>
                        <item.icon size={20} className={item.color} />
                      </div>
                      <span className="text-[12px] font-medium text-text-primary text-center leading-tight">
                        {item.label}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* User + sign out */}
                <div className="mx-5 mt-5 pt-4 border-t border-app-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center font-semibold text-white text-[14px] shrink-0">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-text-primary">{user?.username}</p>
                      <p className="text-[12px] text-text-muted font-normal">Administrator</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-live/10 rounded-[10px] text-brand-live text-[13px] font-medium active:opacity-60 transition-opacity"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Desktop content area ─────────────────── */}
      <main className="hidden lg:block flex-1 scrollable-content overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
