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
    <nav className="glass-dark border-t border-app-border sticky bottom-0 z-50 w-full" style={{ height: '64px' }}>
      <div className="h-full flex items-center justify-around px-2 relative">
        {NAV.map((item) => {
          const active = location.pathname === item.path;

          if (item.center) {
            return (
              <div key={item.path} className="flex-1 flex flex-col items-center justify-center">
                <Link
                  to={item.path}
                  className="flex flex-col items-center"
                  style={{ marginTop: '-32px' }}
                >
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    className="relative"
                  >
                    {/* Outer glow ring — only when active */}
                    {active && (
                      <motion.div
                        layoutId="live-ring"
                        className="absolute inset-0 rounded-full bg-brand-primary/20"
                        style={{ margin: '-6px', borderRadius: '50%' }}
                      />
                    )}

                    {/* Button */}
                    <div
                      className={cn(
                        'w-[58px] h-[58px] rounded-full flex items-center justify-center transition-all duration-200',
                        active
                          ? 'bg-brand-primary shadow-2xl shadow-brand-primary/60'
                          : 'bg-brand-primary shadow-lg shadow-brand-primary/35'
                      )}
                    >
                      <Play
                        size={22}
                        fill="white"
                        className="text-white ml-0.5"
                      />
                    </div>
                  </motion.div>

                  {/* Label below */}
                  <span
                    className={cn(
                      'text-[10px] tracking-tight font-medium leading-none mt-1.5',
                      active ? 'text-brand-primary' : 'text-text-muted'
                    )}
                    style={{ marginTop: '6px' }}
                  >
                    Live
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <div key={item.path} className="flex-1 flex flex-col items-center justify-center pt-1">
              <Link to={item.path} className="flex flex-col items-center gap-[3px]">
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
            </div>
          );
        })}
      </div>
    </nav>
  );
};
