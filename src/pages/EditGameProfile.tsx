import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { ChevronLeft, Gamepad2, User, Hash, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function EditGameProfile() {
  const { gameProfiles, updateGameProfile, removeGameProfile } = useUserStore();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    gameName: '',
    ign: '',
    uid: '',
  });

  useEffect(() => {
    const profile = gameProfiles.find(p => p.id === id);
    if (profile) {
      setFormData({
        gameName: profile.gameName,
        ign: profile.ign,
        uid: profile.uid,
      });
    } else {
      navigate('/profile');
    }
  }, [id, gameProfiles, navigate]);

  const games = ['BGMI', 'Free Fire', 'COD Mobile', 'Valorant', 'PUBG New State'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ign || !formData.uid || !id) return;
    updateGameProfile(id, formData);
    navigate('/profile');
  };

  const handleDelete = () => {
    if (id) {
      removeGameProfile(id);
      navigate('/profile');
    }
  };

  return (
    <div className="h-full flex flex-col pb-24">
      <header className="h-16 px-6 flex items-center justify-between bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/profile" className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-black tracking-tight">Edit Game Profile</h1>
        </div>
        <button 
          onClick={handleDelete}
          className="p-2.5 bg-brand-red/10 rounded-full text-brand-red active:scale-90 transition-transform"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div className="flex-1 scrollable-content p-6 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <Gamepad2 size={12} /> Select Game
              </label>
              <div className="relative">
                <select 
                  value={formData.gameName}
                  onChange={(e) => setFormData({...formData, gameName: e.target.value})}
                  className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue transition-colors appearance-none"
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <User size={12} /> In-Game Name (IGN)
              </label>
              <input 
                type="text"
                value={formData.ign}
                onChange={(e) => setFormData({...formData, ign: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue transition-colors"
                placeholder="Enter your IGN"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <Hash size={12} /> Game UID
              </label>
              <input 
                type="text"
                value={formData.uid}
                onChange={(e) => setFormData({...formData, uid: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue transition-colors"
                placeholder="Enter your Game UID"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              fullWidth
              size="lg"
              className="rounded-2xl font-black uppercase tracking-widest text-xs py-4 shadow-xl shadow-brand-blue/20"
            >
              Update Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
