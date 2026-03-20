import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { Trophy, Users, Settings, LogOut, ChevronRight, Edit3, Gamepad2, Plus, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

const ROW = ({ icon: Icon, label, sub, color, to, onPress, danger }: any) => (
  <Link to={to || '#'} onClick={onPress || undefined}>
    <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${color || 'bg-app-elevated text-text-secondary'}`}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[16px] font-normal ${danger ? 'text-brand-live' : 'text-text-primary'}`}>{label}</p>
        {sub && <p className="text-[13px] text-text-muted font-normal mt-0.5">{sub}</p>}
      </div>
      {!danger && <ChevronRight size={16} className="text-text-muted shrink-0" />}
    </div>
  </Link>
);

export default function Profile() {
  const { user, logout, gameProfiles, isAdmin } = useUserStore();
  const navigate = useNavigate();
  if (!user) return null;

  const stats = [
    { label: 'Played', value: '24' },
    { label: 'Wins',   value: '9' },
    { label: 'Win %',  value: '37%' },
    { label: 'Rank',   value: '#127' },
  ];

  return (
    <div className="pb-24 space-y-6">
      {/* Hero */}
      <div className="relative">
        <div className="h-[120px] bg-gradient-to-br from-brand-primary/25 via-brand-primary/8 to-transparent" />
        <div className="px-5 -mt-[52px] flex items-end justify-between">
          <div className="relative">
            <div className="p-[3px] rounded-full bg-app-bg">
              <LetterAvatar name={user.username} size="xl" />
            </div>
            <Link to="/edit-profile"
              className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-app-bg rounded-full border-2 border-app-bg flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
                <Edit3 size={11} className="text-white" />
              </div>
            </Link>
          </div>
          <div className="pb-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/15 rounded-full text-[13px] font-medium text-brand-primary-light">
              <Star size={11} fill="currentColor" />{user.rank}
            </span>
          </div>
        </div>

        <div className="px-5 pt-3 space-y-0.5">
          <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.5px]">{user.username}</h2>
          <p className="text-[15px] text-text-secondary font-normal">{user.email}</p>
          {user.bio && <p className="text-[15px] text-text-secondary leading-relaxed pt-1">{user.bio}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="mx-5 grid grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.label} className="bg-app-elevated rounded-[14px] p-3 text-center">
            <p className="text-[18px] font-semibold text-text-primary tabular">{s.value}</p>
            <p className="text-[11px] text-text-muted mt-0.5 font-normal">{s.label}</p>
          </div>
        ))}
      </div>

      {/* My Games */}
      <section className="mx-5 space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal">My Games</p>
          <Link to="/add-game" className="text-[15px] text-brand-primary flex items-center gap-1">
            <Plus size={14} /> Add
          </Link>
        </div>
        <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
          {gameProfiles.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2">
              <Gamepad2 size={28} className="text-text-muted" />
              <p className="text-[15px] text-text-secondary font-normal">No games linked yet</p>
              <Link to="/add-game" className="text-[15px] text-brand-primary font-medium">Link a game</Link>
            </div>
          ) : gameProfiles.map(g => (
            <Link key={g.id} to={`/edit-game/${g.id}`}>
              <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-app-elevated transition-colors">
                <div className="w-9 h-9 rounded-[10px] bg-brand-primary/15 flex items-center justify-center text-brand-primary shrink-0">
                  <Gamepad2 size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-normal text-text-primary">{g.gameName}</p>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">{g.ign} · {g.uid}</p>
                </div>
                <ChevronRight size={15} className="text-text-muted shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Navigation */}
      <section className="mx-5 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Competitions</p>
        <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
          <ROW icon={Trophy}  label="My Matches"  sub="View your registered tournaments" color="bg-brand-warning/15 text-brand-warning"    to="/my-matches" />
          <ROW icon={Users}   label="My Team"     sub="Squad management"                 color="bg-brand-primary/15 text-brand-primary-light" to="/my-team" />
        </div>
      </section>

      <section className="mx-5 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Account</p>
        <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
          <ROW icon={Settings} label="Settings" color="bg-app-elevated text-text-secondary" to="/settings" />
          <ROW icon={LogOut}   label="Sign Out" danger onPress={() => { logout(); }} to="/login" />
        </div>
      </section>

      {isAdmin && (
        <section className="mx-5">
          <Link to="/admin/dashboard">
            <div className="bg-brand-primary rounded-[16px] px-5 py-4 flex items-center justify-between active:opacity-80 transition-opacity">
              <p className="text-[16px] font-semibold text-white">Open Admin Panel</p>
              <ChevronRight size={18} className="text-white/70" />
            </div>
          </Link>
        </section>
      )}

      <p className="text-center text-[12px] text-text-muted pb-2 font-normal">
        Elite Esports Platform · Build 2026.03
      </p>
    </div>
  );
}
