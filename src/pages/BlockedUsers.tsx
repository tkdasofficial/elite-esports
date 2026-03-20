import { useState } from 'react';
import { ArrowLeft, UserX, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_BLOCKED = [
  { id: '1', username: 'ToxicPlayer99', blockedOn: 'Mar 15, 2026' },
  { id: '2', username: 'Hacker_X123', blockedOn: 'Mar 10, 2026' },
];

export default function BlockedUsers() {
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState(INITIAL_BLOCKED);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const handleUnblock = async (id: string) => {
    setUnblocking(id);
    await new Promise(r => setTimeout(r, 600));
    setBlocked(prev => prev.filter(u => u.id !== id));
    setUnblocking(null);
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Blocked Users</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-5 pb-10 space-y-4">
        <p className="text-[14px] text-text-secondary font-normal px-1">
          Blocked users cannot send you messages or view your profile. Unblocking a user restores normal access.
        </p>

        {blocked.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 flex flex-col items-center gap-4 text-center"
          >
            <div className="w-[88px] h-[88px] bg-app-card rounded-[28px] flex items-center justify-center">
              <UserX size={36} className="text-text-muted" />
            </div>
            <div className="space-y-1">
              <p className="text-[17px] font-semibold text-text-primary">No Blocked Users</p>
              <p className="text-[15px] text-text-secondary font-normal">You haven't blocked anyone yet</p>
            </div>
          </motion.div>
        ) : (
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <AnimatePresence>
              {blocked.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-live/15 flex items-center justify-center shrink-0">
                    <UserX size={18} className="text-brand-live" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-normal text-text-primary truncate">{user.username}</p>
                    <p className="text-[13px] text-text-muted font-normal mt-0.5">Blocked on {user.blockedOn}</p>
                  </div>
                  <button
                    onClick={() => handleUnblock(user.id)}
                    disabled={unblocking === user.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-success/15 rounded-full text-[13px] font-medium text-brand-success active:opacity-60 transition-opacity disabled:opacity-40"
                  >
                    {unblocking === user.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-brand-success/30 border-t-brand-success rounded-full animate-spin" />
                    ) : (
                      <UserCheck size={13} />
                    )}
                    Unblock
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {blocked.length > 0 && (
          <p className="text-[13px] text-text-muted font-normal text-center px-4">
            {blocked.length} blocked user{blocked.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
