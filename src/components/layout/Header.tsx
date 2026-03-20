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
    if (path === '/live') return 'Live Now';
    if (path === '/wallet') return 'Wallet';
    if (path === '/profile') return 'Account';
    return 'Elite';
  };

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50">
      <AnimatePresence mode="wait">
        {!isSearchOpen ? (
          <motion.div 
            key="header-default"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Logo size={28} />
              <h1 className="text-xl font-extrabold tracking-tight">{getPageTitle()}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform"
              >
                <Search size={20} />
              </button>
              <Link to="/notifications" className="relative p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-red rounded-full border-2 border-brand-dark" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="header-search"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-3 w-full"
          >
            <button 
              onClick={handleCloseSearch}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games, prizes, modes..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-10 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
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

