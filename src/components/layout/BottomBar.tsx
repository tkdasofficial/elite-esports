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
    { icon: Home, label: 'Home', path: '/' },
    { icon: Trophy, label: 'Rank', path: '/leaderboard' },
    { icon: Play, label: 'Live', path: '/live', isCenter: true },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="h-16 bg-brand-card/90 backdrop-blur-3xl border-t border-white/5 px-8 flex items-center justify-between pb-1 sticky bottom-0 z-50 w-full">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        if (item.isCenter) {
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center"
            >
              <div className={cn(
                "w-12 h-12 rounded-[18px] flex items-center justify-center shadow-2xl transition-all active:scale-90 -mt-8 border-4 border-brand-dark",
                isActive 
                  ? "bg-brand-blue text-white shadow-brand-blue/40 scale-110" 
                  : "bg-brand-blue/90 text-white/90 shadow-brand-blue/20"
              )}>
                <Play size={24} fill="currentColor" className="ml-0.5" />
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className="relative group flex items-center justify-center"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
              isActive 
                ? "bg-brand-blue/15 text-brand-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                : "text-slate-500 hover:bg-white/5"
            )}>
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="transition-transform group-active:scale-90"
              />
            </div>
          </Link>
        );
      })}
    </nav>
  );
};




