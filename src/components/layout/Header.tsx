import { Bell, Search, X, Mic, MicOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechRecognition } from '@/src/hooks/useSpeechRecognition';
import { cn } from '@/src/utils/helpers';

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
  const { hasUnread } = useNotificationStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const title = PAGE_TITLES[location.pathname] ?? 'Elite';

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 60);
  }, [searchOpen]);

  const openSearch  = () => setSearchOpen(true);
  const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); stop(); };

  const handleVoiceResult = useCallback((text: string) => {
    setSearchQuery(text);
  }, [setSearchQuery]);

  const { isListening, start, stop, supported } = useSpeechRecognition(handleVoiceResult);

  const toggleVoice = () => {
    if (isListening) {
      stop();
    } else {
      setSearchQuery('');
      start();
    }
  };

  return (
    <header className="h-[56px] px-4 flex items-center sticky top-0 z-50 glass-dark border-b border-app-border">
      <AnimatePresence mode="wait" initial={false}>
        {!searchOpen ? (
          <motion.div
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2.5">
              <Logo size={28} />
              <span className="text-[17px] font-semibold text-text-primary tracking-[-0.4px]">
                {title}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={openSearch}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-app-elevated text-text-secondary active:opacity-60 transition-opacity"
              >
                <Search size={16} />
              </motion.button>

              <Link
                to="/notifications"
                className="relative w-8 h-8 flex items-center justify-center rounded-full bg-app-elevated text-text-secondary active:opacity-60 transition-opacity"
              >
                <Bell size={16} />
                <AnimatePresence>
                  {hasUnread && (
                    <motion.span
                      key="dot"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="absolute top-[5px] right-[5px] w-[8px] h-[8px] bg-brand-live rounded-full border-[1.5px] border-app-elevated"
                    />
                  )}
                </AnimatePresence>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 w-full"
          >
            <div className="flex-1 relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <Search size={15} className="text-text-muted" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isListening ? 'Listening…' : 'Search tournaments…'}
                className={cn(
                  'w-full bg-[rgba(118,118,128,0.18)] rounded-[10px] py-[7px] pl-[34px] pr-[36px] text-[15px] text-text-primary placeholder:text-text-muted outline-none caret-brand-primary transition-all',
                  isListening && 'bg-brand-live/8 placeholder:text-brand-live/60'
                )}
              />

              {searchQuery ? (
                <button
                  onClick={() => { setSearchQuery(''); stop(); inputRef.current?.focus(); }}
                  className="absolute right-2.5 w-[18px] h-[18px] bg-text-muted/50 rounded-full flex items-center justify-center active:opacity-60"
                >
                  <X size={10} className="text-app-bg font-bold" strokeWidth={3} />
                </button>
              ) : supported ? (
                <motion.button
                  onClick={toggleVoice}
                  animate={isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={isListening ? { repeat: Infinity, duration: 1.2 } : {}}
                  className={cn(
                    'absolute right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all active:opacity-70',
                    isListening
                      ? 'bg-brand-live text-white shadow-md shadow-brand-live/40'
                      : 'bg-transparent text-text-muted'
                  )}
                >
                  {isListening
                    ? <MicOff size={13} strokeWidth={2.5} />
                    : <Mic size={14} />
                  }
                </motion.button>
              ) : null}
            </div>

            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              onClick={closeSearch}
              className="text-brand-primary text-[17px] font-normal shrink-0 active:opacity-60 transition-opacity"
            >
              Cancel
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
