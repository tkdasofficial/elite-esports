import { Home, Trophy, Play, Wallet, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/utils/helpers';
import { motion } from 'motion/react';

export const BottomBar = () => {
  const location = useLocation();
  const isMatchDetails = location.pathname.startsWith('/match/');
  const isAdminPage = location.pathname.startsWith('/admin');

  if (isMatchDetails || isAdminPage) return null;

  const navItems = [
    { icon: Home,   label: 'Home',    path: '/' },
    { icon: Trophy, label: 'Rank',    path: '/leaderboard' },
    { icon: Play,   label: 'Live',    path: '/live', isCenter: true },
    { icon: Wallet, label: 'Wallet',  path: '/wallet' },
    { icon: User,   label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="h-[64px] glass-dark border-t border-app-border px-4 flex items-center justify-around sticky bottom-0 z-50 w-full pb-1">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;

        if (item.isCenter) {
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center -mt-5"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={cn(
                  'w-[52px] h-[52px] rounded-[18px] flex items-center justify-center shadow-xl transition-all duration-300',
                  isActive
                    ? 'bg-brand-primary shadow-brand-primary/40 scale-105'
                    : 'bg-brand-primary/90 shadow-brand-primary/20'
                )}
              >
                <Play size={22} fill="white" className="text-white ml-0.5" />
              </motion.div>
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className="relative flex flex-col items-center gap-1 w-12"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-250',
                isActive
                  ? 'bg-brand-primary/15 text-brand-primary-light'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </motion.div>
            {isActive && (
              <motion.div
                layoutId="navDot"
                className="absolute bottom-0 w-1 h-1 rounded-full bg-brand-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
