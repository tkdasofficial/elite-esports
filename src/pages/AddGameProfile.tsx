import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { ChevronLeft, Gamepad2, User, Hash } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AddGameProfile() {
  const { addGameProfile } = useUserStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    gameName: 'BGMI',
    ign: '',
    uid: '',
  });

  const games = ['BGMI', 'Free Fire', 'COD Mobile', 'Valorant', 'PUBG New State'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ign || !formData.uid) return;
    addGameProfile(formData);
    navigate('/profile');
  };

  return (
    <div className="h-full flex flex-col pb-24">
      <header className="h-16 px-6 flex items-center gap-4 bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link to="/profile" className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Add Game Profile</h1>
      </header>

      <div className="flex-1 scrollable-content p-6 space-y-8 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-20 h-20 bg-brand-blue/10 rounded-[28px] flex items-center justify-center text-brand-blue shadow-2xl shadow-brand-blue/10 border border-brand-blue/20">
            <Gamepad2 size={36} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black tracking-tight">Link Your Game</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enter your in-game details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <Gamepad2 size={12} className="text-brand-blue" /> Select Game
              </label>
              <div className="relative">
                <select 
                  value={formData.gameName}
                  onChange={(e) => setFormData({...formData, gameName: e.target.value})}
                  className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue focus:bg-brand-card/60 transition-all shadow-inner appearance-none"
                >
                  {games.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronLeft size={16} className="-rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <User size={12} className="text-brand-blue" /> In-Game Name (IGN)
              </label>
              <input 
                type="text"
                value={formData.ign}
                onChange={(e) => setFormData({...formData, ign: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue focus:bg-brand-card/60 transition-all shadow-inner"
                placeholder="e.g. Elite_Gamer_99"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <Hash size={12} className="text-brand-blue" /> Game UID
              </label>
              <input 
                type="text"
                value={formData.uid}
                onChange={(e) => setFormData({...formData, uid: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue focus:bg-brand-card/60 transition-all shadow-inner"
                placeholder="e.g. 5423198765"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              fullWidth
              size="lg"
              className="rounded-2xl font-black uppercase tracking-widest text-xs py-4 shadow-xl shadow-brand-blue/20 active:scale-[0.98] transition-all"
            >
              Add Game Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
