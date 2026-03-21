import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { useGameStore } from '@/src/store/gameStore';
import { Button } from '@/src/components/ui/Button';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function EditGameProfile() {
  const { gameProfiles, updateGameProfile, removeGameProfile } = useUserStore();
  const activeGames = useGameStore(s => s.games.filter(g => g.status === 'active'));
  const navigate = useNavigate();
  const { id } = useParams();

  const gameOptions = activeGames.map(g => ({
    value: g.name,
    label: g.name,
    image: g.logo,
    description: g.category,
  }));

  const [form, setForm] = useState({ gameName: '', ign: '', uid: '' });

  useEffect(() => {
    const p = gameProfiles.find(p => p.id === id);
    if (p) setForm({ gameName: p.gameName, ign: p.ign, uid: p.uid });
    else navigate('/profile');
  }, [id, gameProfiles, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ign || !form.uid || !id) return;
    updateGameProfile(id, form);
    navigate('/profile');
  };

  const handleDelete = () => {
    if (id) { removeGameProfile(id); navigate('/profile'); }
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none focus:bg-app-elevated transition-colors';

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="text-[17px] text-brand-primary font-normal">‹ Back</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Edit Game</h1>
        <button
          onClick={handleDelete}
          className="ml-auto text-[17px] text-brand-live font-normal active:opacity-60"
        >
          Delete
        </button>
      </header>

      <div className="flex-1 scrollable-content px-4 py-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <CustomSelect
            label="Select Game"
            value={form.gameName}
            onChange={v => setForm({ ...form, gameName: v })}
            options={gameOptions.length > 0 ? gameOptions : [{ value: form.gameName, label: form.gameName }]}
            variant="consumer"
          />

          <div className="space-y-1.5">
            <label className="text-[13px] text-text-secondary font-normal px-1">In-Game Name (IGN)</label>
            <input
              type="text"
              value={form.ign}
              onChange={e => setForm({ ...form, ign: e.target.value })}
              className={inputCls}
              placeholder="e.g. Elite_Gamer_99"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-text-secondary font-normal px-1">Game UID</label>
            <input
              type="text"
              value={form.uid}
              onChange={e => setForm({ ...form, uid: e.target.value })}
              className={inputCls}
              placeholder="e.g. 5423198765"
              required
            />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth size="lg">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
