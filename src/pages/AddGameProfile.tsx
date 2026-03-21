import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { Link, useNavigate } from 'react-router-dom';

const GAME_OPTIONS = [
  { value: 'BGMI',           label: 'BGMI',            emoji: '🎯', description: 'Battlegrounds Mobile India' },
  { value: 'Free Fire',      label: 'Free Fire',        emoji: '🔥', description: 'Garena Free Fire Max' },
  { value: 'COD Mobile',     label: 'COD Mobile',       emoji: '🎮', description: 'Call of Duty: Mobile' },
  { value: 'Valorant',       label: 'Valorant',         emoji: '⚡', description: 'Riot Games tactical FPS' },
  { value: 'PUBG New State', label: 'PUBG New State',   emoji: '🛡️', description: 'Krafton battle royale' },
];

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

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none focus:bg-app-elevated transition-colors';

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="text-[17px] text-brand-primary font-normal mr-auto">Cancel</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Add Game</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-5">

          <CustomSelect
            label="Select Game"
            value={form.gameName}
            onChange={v => setForm({ ...form, gameName: v })}
            options={GAME_OPTIONS}
            variant="consumer"
          />

          <div className="space-y-1.5">
            <label className="text-[13px] text-text-secondary font-normal px-1">In-Game Name (IGN)</label>
            <input type="text" value={form.ign} onChange={e => setForm({ ...form, ign: e.target.value })}
              className={inputCls} placeholder="e.g. Elite_Gamer_99" required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-text-secondary font-normal px-1">Game UID</label>
            <input type="text" value={form.uid} onChange={e => setForm({ ...form, uid: e.target.value })}
              className={inputCls} placeholder="e.g. 5423198765" required />
          </div>

          <p className="text-[13px] text-text-muted font-normal px-1 leading-relaxed">
            Your game profile will be verified and linked to your tournament account.
          </p>

          <div className="pt-2">
            <Button type="submit" fullWidth size="lg">Link Game Account</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
