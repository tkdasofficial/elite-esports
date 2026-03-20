import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import {
  Trophy, Users, Settings, LogOut, ChevronRight,
  Edit3, Gamepad2, Plus, Star, Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout, gameProfiles, isAdmin } = useUserStore();
  if (!user) return null;

  const stats = [
    { label: 'Matches', value: '24' },
    { label: 'Wins', value: '9' },
    { label: 'Win Rate', value: '37%' },
  ];

  const menuItems = [
    { icon: Trophy, label: 'My Matches', path: '/my-matches', color: 'text-brand-warning' },
    { icon: Users,  label: 'My Team',    path: '/my-team',    color: 'text-brand-primary-light' },
    { icon: Settings, label: 'Settings', path: '/settings',   color: 'text-text-secondary' },
  ];

  return (
    <div className="pb-28 space-y-6">
      {/* Hero header */}
      <div className="relative">
        <div className="h-36 bg-gradient-to-br from-brand-primary/30 via-brand-primary/10 to-app-surface" />
        <div className="px-5 -mt-14 space-y-4">
          <div className="flex items-end justify-between">
            <div className="relative">
              <div className="p-1 rounded-full bg-app-bg border-4 border-app-bg">
                <LetterAvatar name={user.username} size="xl" className="border-2 border-brand-primary/30" />
              </div>
              <Link
                to="/edit-profile"
                className="absolute bottom-1 right-0 w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center border-2 border-app-bg text-white shadow-lg"
              >
                <Edit3 size={12} />
              </Link>
            </div>
            <div className="pb-1">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/15 border border-brand-primary/30 rounded-xl text-xs font-semibold text-brand-primary-light">
                <Star size={11} fill="currentColor" />
                {user.rank}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-primary">{user.username}</h2>
            <p className="text-sm text-text-muted font-medium">{user.email}</p>
            {user.bio && <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{user.bio}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-app-card border border-app-border rounded-2xl p-4 text-center">
            <p className="text-lg font-bold text-text-primary">{s.value}</p>
            <p className="text-[11px] font-medium text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Game profiles */}
      <section className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary">My Games</h3>
          <Link
            to="/add-game"
            className="flex items-center gap-1 text-xs font-semibold text-brand-primary-light hover:underline"
          >
            <Plus size={12} /> Add Game
          </Link>
        </div>
        <div className="space-y-2.5">
          {gameProfiles.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between bg-app-card border border-app-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <Gamepad2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{g.gameName}</p>
                  <p className="text-xs text-text-muted font-medium">{g.ign} · {g.uid}</p>
                </div>
              </div>
              <Link
                to={`/edit-game/${g.id}`}
                className="w-8 h-8 bg-app-elevated rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <Edit3 size={14} />
              </Link>
            </div>
          ))}
          {gameProfiles.length === 0 && (
            <div className="py-8 border border-dashed border-app-border rounded-2xl flex flex-col items-center gap-2">
              <Gamepad2 size={24} className="text-text-muted" />
              <p className="text-xs text-text-muted font-medium">No game profiles yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Menu */}
      <section className="px-5 space-y-2.5">
        {menuItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link to={item.path}>
              <div className="flex items-center justify-between bg-app-card border border-app-border rounded-2xl p-4 hover:border-brand-primary/25 transition-colors active:scale-[0.98]">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl bg-app-elevated flex items-center justify-center ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                </div>
                <ChevronRight size={17} className="text-text-muted" />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Logout */}
      <div className="px-5">
        <button
          onClick={logout}
          className="w-full py-3.5 bg-brand-live/8 border border-brand-live/20 rounded-2xl flex items-center justify-center gap-2 text-brand-live text-sm font-semibold hover:bg-brand-live/15 transition-all active:scale-[0.98]"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
