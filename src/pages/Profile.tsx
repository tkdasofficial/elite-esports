import { useUserStore } from '@/src/store/userStore';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { Trophy, Users, History, Settings, LogOut, ChevronRight, Edit3, Gamepad2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/utils/helpers';

export default function Profile() {
  const { user, logout, gameProfiles, removeGameProfile, isAdmin } = useUserStore();

  if (!user) return null;

  const menuItems = [
    { icon: Trophy, label: 'My Matches', path: '/my-matches' },
    { icon: Users, label: 'My Team', path: '/my-team' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="px-6 space-y-8 pb-24">
      {/* Profile Header */}
      <section className="pt-6 text-center space-y-4">
        <div className="relative inline-block">
          <div className="p-1.5 rounded-full border-4 border-brand-blue shadow-2xl shadow-brand-blue/20">
            <LetterAvatar 
              name={user.username} 
              size="xl" 
              className="border-none shadow-none"
            />
          </div>
          <Link 
            to="/edit-profile"
            className="absolute bottom-1 right-1 bg-brand-blue p-2.5 rounded-full border-4 border-brand-dark shadow-lg text-white active:scale-90 transition-transform"
          >
            <Edit3 size={16} />
          </Link>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">{user.username}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{user.email}</p>
          {user.bio && (
            <p className="text-xs text-slate-400 max-w-[250px] mx-auto leading-relaxed mt-2">{user.bio}</p>
          )}
        </div>
      </section>

      {/* My Games Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">MY GAMES</h2>
          <Link to="/add-game" className="text-[10px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-1">
            <Plus size={12} /> Add New
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {gameProfiles.map((game) => (
            <Card key={game.id} className="p-4 bg-brand-card/40 border-none flex items-center justify-between hover:bg-white/5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                  <Gamepad2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">{game.gameName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">{game.ign}</span>
                    <span className="text-[10px] text-slate-600 font-medium">ID: {game.uid}</span>
                  </div>
                </div>
              </div>
              <Link 
                to={`/edit-game/${game.id}`}
                className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-blue transition-all active:scale-90"
              >
                <Edit3 size={16} />
              </Link>
            </Card>
          ))}
          {gameProfiles.length === 0 && (
            <p className="text-center py-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">No game profiles added yet</p>
          )}
        </div>
      </section>

      {/* Menu Options */}
      <section className="space-y-3">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={item.path}>
              <Card className={cn(
                "p-4 flex items-center justify-between bg-brand-card/40 border-none hover:bg-white/5 transition-all active:scale-[0.98]",
                (item as any).isSpecial && "bg-brand-blue/10 border border-brand-blue/20"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    (item as any).isSpecial ? "bg-brand-blue text-white" : "bg-brand-blue/10 text-brand-blue"
                  )}>
                    <item.icon size={22} />
                  </div>
                  <span className={cn(
                    "font-black text-sm tracking-tight",
                    (item as any).isSpecial && "text-brand-blue"
                  )}>{item.label}</span>
                </div>
                <ChevronRight size={20} className={cn((item as any).isSpecial ? "text-brand-blue" : "text-slate-600")} />
              </Card>
            </Link>
          </motion.div>
        ))}
      </section>

      <Button
        variant="danger"
        fullWidth
        size="lg"
        className="rounded-2xl font-black uppercase tracking-widest text-xs py-4 shadow-xl shadow-brand-red/20"
        onClick={logout}
      >
        <LogOut size={18} className="mr-2" />
        Logout Account
      </Button>
    </div>
  );
}

