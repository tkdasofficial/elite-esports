import { Home, Trophy, Play, Wallet, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/utils/helpers';
import { motion } from 'motion/react';

const NAV = [
  { icon: Home,   label: 'Home',    path: '/' },
  { icon: Trophy, label: 'Rank',    path: '/leaderboard' },
  { icon: Play,   label: 'Live',    path: '/live', center: true },
  { icon: Wallet, label: 'Wallet',  path: '/wallet' },
  { icon: User,   label: 'Profile', path: '/profile' },
];

const MAIN_PATHS = new Set(['/', '/leaderboard', '/live', '/wallet', '/profile']);

export const BottomBar = () => {
  const location = useLocation();
  if (!MAIN_PATHS.has(location.pathname)) return null;

  return (
    <nav className="glass-dark border-t border-app-border sticky bottom-0 z-50 w-full h-[64px]">
      <div className="h-full flex items-center justify-around px-2">
        {NAV.map((item) => {
          const active = location.pathname === item.path;

          if (item.center) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex items-center justify-center"
              >
                <motion.div
                  whileTap={{ scale: 0.82 }}
                  className={cn(
                    'w-[38px] h-[38px] rounded-full flex items-center justify-center transition-all duration-200',
                    active
                      ? 'bg-brand-primary shadow-lg shadow-brand-primary/40'
                      : 'bg-brand-primary shadow-md shadow-brand-primary/30'
                  )}
                >
                  <Play size={17} fill="white" className="text-white ml-0.5" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center gap-[3px] pt-1"
            >
              <motion.div whileTap={{ scale: 0.82 }} className="flex flex-col items-center gap-[3px]">
                <item.icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-brand-primary' : 'text-text-muted'}
                />
                <span className={cn(
                  'text-[10px] tracking-tight font-medium leading-none',
                  active ? 'text-brand-primary' : 'text-text-muted'
                )}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
