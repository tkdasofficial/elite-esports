import { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import {
  Trophy, Users, Settings, LogOut, ChevronRight, Gamepad2, Plus,
  Star, Edit2, Share2, Copy, Check, X, QrCode,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

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

const ShareModal = ({ username, onClose }: { username: string; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/@${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = profileUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        {/* Sheet */}
        <motion.div
          className="relative bg-app-card rounded-t-[28px] flex flex-col"
          style={{ height: '50vh' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-app-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <h2 className="text-[18px] font-semibold text-text-primary">Share Profile</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-app-elevated flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <X size={14} className="text-text-muted" />
            </button>
          </div>

          {/* Options */}
          <div className="flex-1 flex gap-3 px-5 pb-5 pt-1 min-h-0">
            {/* Copy Link */}
            <button
              onClick={handleCopy}
              className="flex-1 bg-app-elevated rounded-[18px] flex flex-col items-center justify-center gap-2.5 px-3 active:scale-[0.97] transition-transform"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${copied ? 'bg-green-500/20' : 'bg-brand-primary/15'}`}>
                {copied
                  ? <Check size={22} className="text-green-400" />
                  : <Copy size={22} className="text-brand-primary-light" />}
              </div>
              <span className="text-[14px] font-semibold text-text-primary">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
              <span className="text-[11px] text-text-muted font-normal text-center leading-relaxed break-all">
                {profileUrl}
              </span>
            </button>

            {/* QR Code */}
            <div className="flex-1 bg-app-elevated rounded-[18px] flex flex-col items-center justify-center gap-2.5 px-3">
              <div className="bg-white rounded-[10px] p-2 shadow-lg">
                <QRCodeSVG
                  value={profileUrl}
                  size={80}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <span className="text-[14px] font-semibold text-text-primary">QR Code</span>
              <span className="text-[11px] text-text-muted font-normal">Scan to open profile</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Profile() {
  const { user, logout, gameProfiles, isAdmin, joinedMatchIds, transactions } = useUserStore();
  const [showShare, setShowShare] = useState(false);

  if (!user) return null;

  const played = joinedMatchIds.length;
  const wins   = transactions.filter(t => t.type === 'win' && t.status === 'success').length;
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;

  const stats = [
    { label: 'Played', value: played.toString() },
    { label: 'Wins',   value: wins.toString() },
    { label: 'Win %',  value: `${winPct}%` },
    { label: 'Rank',   value: user.rank },
  ];

  return (
    <>
      <div className="pb-24 space-y-6">
        {/* Hero */}
        <div className="relative">
          <div className="h-[120px] bg-gradient-to-br from-brand-primary/25 via-brand-primary/8 to-transparent" />
          <div className="px-5 -mt-[52px] flex items-end justify-between">
            <div className="p-[3px] rounded-full bg-app-bg">
              <LetterAvatar name={user.username} size="xl" />
            </div>
            <span className="pb-2 flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/15 rounded-full text-[13px] font-medium text-brand-primary-light">
              <Star size={11} fill="currentColor" />{user.rank}
            </span>
          </div>

          {/* Name + actions row */}
          <div className="px-5 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.5px]">{user.username}</h2>
                <p className="text-[15px] text-text-secondary font-normal">{user.email}</p>
                {user.bio && <p className="text-[15px] text-text-secondary leading-relaxed pt-1">{user.bio}</p>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 shrink-0">
                <Link
                  to="/edit-profile"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-app-elevated rounded-full text-[13px] font-medium text-text-primary active:opacity-70 transition-opacity"
                >
                  <Edit2 size={13} />
                  Edit
                </Link>
                <button
                  onClick={() => setShowShare(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary/15 rounded-full text-[13px] font-medium text-brand-primary-light active:opacity-70 transition-opacity"
                >
                  <Share2 size={13} />
                  Share
                </button>
              </div>
            </div>
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

        {/* Competitions */}
        <section className="mx-5 space-y-2">
          <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Competitions</p>
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            <ROW icon={Trophy}  label="My Matches"  sub="View your registered tournaments" color="bg-brand-warning/15 text-brand-warning"      to="/my-matches" />
            <ROW icon={Users}   label="My Team"     sub="Squad management"                 color="bg-brand-primary/15 text-brand-primary-light"  to="/my-team" />
          </div>
        </section>

        {/* Account */}
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

      {/* Share Modal */}
      {showShare && (
        <ShareModal username={user.username} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
