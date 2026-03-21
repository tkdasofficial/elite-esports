import React, { useState, useEffect } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Match } from '@/src/types';

export default function AdminMatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMatch, updateMatch, getMatchById } = useMatchStore();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Partial<Match>>({
    game_name: 'BGMI',
    title: '',
    mode: 'Squad',
    banner_image: 'https://picsum.photos/seed/bgmi/800/450',
    status: 'upcoming',
    start_time: '10:00 PM',
    entry_fee: '₹50',
    prize: '₹5,000',
    slots_total: 100,
    slots_filled: 0,
    team1_name: 'Team A',
    team2_name: 'Team B',
    team1_logo: 'https://picsum.photos/seed/teama/200/200',
    team2_logo: 'https://picsum.photos/seed/teamb/200/200',
  });

  useEffect(() => {
    if (isEditing) {
      const match = getMatchById(id);
      if (match) {
        setFormData(match);
      }
    }
  }, [id, isEditing, getMatchById]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMatch(id, formData);
    } else {
      const newMatch: Match = {
        ...formData as Match,
        match_id: Math.random().toString(36).substr(2, 9),
      };
      addMatch(newMatch);
    }
    navigate('/admin/matches');
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-4 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/admin/matches')} className="p-2 bg-white/5 rounded-xl text-slate-400 flex-shrink-0">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black tracking-tight truncate">{isEditing ? 'Edit Match' : 'New Match'}</h1>
        </div>
        <Button onClick={handleSubmit} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Save size={16} />
          Save
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-4 sm:p-6 space-y-6 bg-brand-card/40 border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Game Name</label>
              <select 
                value={formData.game_name}
                onChange={(e) => handleChange('game_name', e.target.value)}
                className="w-full bg-brand-card border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all"
              >
                <option value="BGMI">BGMI</option>
                <option value="Valorant">Valorant</option>
                <option value="Free Fire">Free Fire</option>
                <option value="COD Mobile">COD Mobile</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full bg-brand-card border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all"
              >
                <option value="live">Live</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <Input 
            label="Tournament Title" 
            placeholder="e.g. Pro Scrims: Elite Division"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Game Mode" 
              placeholder="Squad, 1v1, 4v4"
              value={formData.mode}
              onChange={(e) => handleChange('mode', e.target.value)}
              required
            />
            <Input 
              label="Start Time" 
              placeholder="10:30 PM"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Entry Fee" 
              placeholder="₹50"
              value={formData.entry_fee}
              onChange={(e) => handleChange('entry_fee', e.target.value)}
              required
            />
            <Input 
              label="Prize Pool" 
              placeholder="₹5,000"
              value={formData.prize}
              onChange={(e) => handleChange('prize', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Total Slots" 
              type="number"
              value={formData.slots_total}
              onChange={(e) => handleChange('slots_total', parseInt(e.target.value))}
              required
            />
            <Input 
              label="Filled Slots" 
              type="number"
              value={formData.slots_filled}
              onChange={(e) => handleChange('slots_filled', parseInt(e.target.value))}
              required
            />
          </div>

          <Input 
            label="Banner Image URL" 
            placeholder="https://..."
            value={formData.banner_image}
            onChange={(e) => handleChange('banner_image', e.target.value)}
            required
          />
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" fullWidth size="md" className="rounded-xl">
            {isEditing ? 'Update Tournament' : 'Create Tournament'}
          </Button>
          <Button type="button" variant="secondary" fullWidth size="md" onClick={() => navigate('/admin/matches')} className="rounded-xl border-white/5">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
