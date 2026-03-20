import { Bell, Search, X, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useState, useRef, useEffect } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { motion, AnimatePresence } from 'motion/react';

export const Header = () => {
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useMatchStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Discover';
    if (path === '/leaderboard') return 'Rankings';
    if (path === '/live') return 'Live';
    if (path === '/wallet') return 'Wallet';
    if (path === '/profile') return 'Account';
    return 'Elite';
  };

  useEffect(() => {
    if (isSearchOpen && inputRef.current) inputRef.current.focus();
  }, [isSearchOpen]);

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-[60px] px-5 flex items-center justify-between glass-dark sticky top-0 z-50 border-b border-app-border">
      <AnimatePresence mode="wait">
        {!isSearchOpen ? (
          <motion.div
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="text-[17px] font-bold text-text-primary tracking-tight">
                {getPageTitle()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-all"
              >
                <Search size={17} />
              </button>
              <Link
                to="/notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-all"
              >
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-live rounded-full border-2 border-app-bg" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3 w-full"
          >
            <button
              onClick={handleCloseSearch}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary shrink-0"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments, games..."
                className="w-full bg-app-elevated border border-app-border rounded-xl py-2.5 pl-10 pr-9 text-sm font-medium text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-secondary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
