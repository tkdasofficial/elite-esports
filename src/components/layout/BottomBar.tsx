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

export const BottomBar = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/match/') || location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="glass-dark border-t border-app-border h-[64px] pb-safe flex items-center justify-around px-2 sticky bottom-0 z-50 w-full">
      {NAV.map((item) => {
        const active = location.pathname === item.path;

        if (item.center) {
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center -mt-4">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={cn(
                  'w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
                  active
                    ? 'bg-brand-primary shadow-brand-primary/40'
                    : 'bg-brand-primary shadow-brand-primary/20'
                )}
              >
                <Play size={20} fill="white" className="text-white ml-0.5" />
              </motion.div>
            </Link>
          );
        }

        return (
          <Link key={item.path} to={item.path} className="flex flex-col items-center gap-[3px] w-14 pt-1">
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
    </nav>
  );
};
