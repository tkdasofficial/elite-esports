import { Bell, Search, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useState, useRef, useEffect } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { motion, AnimatePresence } from 'motion/react';

const PAGE_TITLES: Record<string, string> = {
  '/':            'Discover',
  '/leaderboard': 'Leaderboard',
  '/live':        'Live',
  '/wallet':      'Wallet',
  '/profile':     'Account',
};

export const Header = () => {
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useMatchStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const title = PAGE_TITLES[location.pathname] ?? 'Elite';

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); };

  return (
    <header className="h-[56px] px-4 flex items-center justify-between glass-dark border-b border-app-border sticky top-0 z-50">
      <AnimatePresence mode="wait" initial={false}>
        {!searchOpen ? (
          <motion.div key="default"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="text-[17px] font-semibold text-text-primary tracking-[-0.4px]">
                {title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-app-elevated text-text-secondary active:opacity-60 transition-opacity"
              >
                <Search size={16} />
              </button>
              <Link to="/notifications"
                className="relative w-8 h-8 flex items-center justify-center rounded-full bg-app-elevated text-text-secondary active:opacity-60 transition-opacity"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-live rounded-full border-2 border-ios-bg" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="search"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-3 w-full"
          >
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tournaments…"
                className="w-full bg-app-fill rounded-[10px] py-2 pl-9 pr-8 text-[15px] text-text-primary placeholder:text-text-muted outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                  <X size={13} />
                </button>
              )}
            </div>
            <button onClick={closeSearch} className="text-brand-primary text-[15px] font-medium shrink-0">
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
