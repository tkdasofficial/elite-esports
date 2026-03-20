import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { ChevronLeft, Gamepad2, User, Hash } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const GAMES = ['BGMI', 'Free Fire', 'COD Mobile', 'Valorant', 'PUBG New State'];

export default function AddGameProfile() {
  const { addGameProfile } = useUserStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ gameName: 'BGMI', ign: '', uid: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ign || !form.uid) return;
    addGameProfile(form);
    navigate('/profile');
  };

  const inputCls = 'w-full bg-app-elevated border border-app-border rounded-2xl py-3.5 px-4 text-sm font-medium text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition-colors';
  const labelCls = 'flex items-center gap-2 text-xs font-semibold text-text-secondary';

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[60px] px-5 flex items-center gap-3 glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-transform">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[17px] font-bold text-text-primary">Add Game Profile</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-6 pb-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-20 h-20 bg-brand-primary/10 border border-brand-primary/20 rounded-[28px] flex items-center justify-center text-brand-primary shadow-xl">
            <Gamepad2 size={34} />
          </div>
          <div className="text-center">
            <p className="font-bold text-text-primary">Link Your Game</p>
            <p className="text-xs text-text-muted font-medium mt-0.5">Enter your in-game details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className={labelCls}><Gamepad2 size={13} className="text-brand-primary-light" /> Select Game</label>
            <div className="relative">
              <select
                value={form.gameName}
                onChange={e => setForm({ ...form, gameName: e.target.value })}
                className={`${inputCls} appearance-none`}
              >
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronLeft size={15} className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}><User size={13} className="text-brand-primary-light" /> In-Game Name (IGN)</label>
            <input type="text" value={form.ign} onChange={e => setForm({ ...form, ign: e.target.value })} className={inputCls} placeholder="e.g. Elite_Gamer_99" required />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}><Hash size={13} className="text-brand-primary-light" /> Game UID</label>
            <input type="text" value={form.uid} onChange={e => setForm({ ...form, uid: e.target.value })} className={inputCls} placeholder="e.g. 5423198765" required />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth size="lg">Add Game Profile</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
