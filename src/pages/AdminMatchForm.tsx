import React, { useState, useEffect } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { ArrowLeft, Save, ImageIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Match } from '@/src/types';

const GAME_OPTIONS = ['BGMI', 'Valorant', 'Free Fire', 'COD Mobile'];
const MODE_OPTIONS = ['Squad', '1v1', '2v2', '4v4'];

export default function AdminMatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMatch, updateMatch, getMatchById } = useMatchStore();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Partial<Match>>({
    game_name: 'BGMI',
    title: '',
    mode: 'Squad',
    banner_image: '',
    status: 'upcoming',
    start_time: '',
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
      if (match) setFormData(match);
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

  const labelClass = 'text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1';
  const selectClass = 'w-full bg-brand-card border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-brand-blue outline-none transition-all text-white';

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-4 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/admin/matches')} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black tracking-tight truncate">{isEditing ? 'Edit Tournament' : 'New Tournament'}</h1>
        </div>
        <Button onClick={handleSubmit} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Save size={16} />
          Save
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card className="p-4 sm:p-6 space-y-5 bg-brand-card/40 border-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Basic Info</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>Game</label>
              <select value={formData.game_name} onChange={e => handleChange('game_name', e.target.value)} className={selectClass}>
                {GAME_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Status</label>
              <select value={formData.status} onChange={e => handleChange('status', e.target.value)} className={selectClass}>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <Input
            label="Tournament Title"
            placeholder="e.g. Pro Scrims: Elite Division"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>Game Mode</label>
              <select value={formData.mode} onChange={e => handleChange('mode', e.target.value)} className={selectClass}>
                {MODE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Start Date & Time</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={e => handleChange('start_time', e.target.value)}
                required
                className={selectClass}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Entry Fee"
              placeholder="₹50"
              value={formData.entry_fee}
              onChange={e => handleChange('entry_fee', e.target.value)}
              required
            />
            <Input
              label="Prize Pool"
              placeholder="₹5,000"
              value={formData.prize}
              onChange={e => handleChange('prize', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Slots"
              type="number"
              value={formData.slots_total}
              onChange={e => handleChange('slots_total', parseInt(e.target.value))}
              required
            />
            <Input
              label="Filled Slots"
              type="number"
              value={formData.slots_filled}
              onChange={e => handleChange('slots_filled', parseInt(e.target.value))}
              required
            />
          </div>
        </Card>

        {/* Banner image */}
        <Card className="p-4 sm:p-6 space-y-5 bg-brand-card/40 border-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Banner Image</h2>
          <Input
            label="Image URL"
            placeholder="https://example.com/banner.jpg"
            value={formData.banner_image}
            onChange={e => handleChange('banner_image', e.target.value)}
          />
          {formData.banner_image ? (
            <div className="rounded-2xl overflow-hidden border border-white/10 w-full h-44">
              <img
                src={formData.banner_image}
                alt="Banner preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-white/10 w-full h-44 flex flex-col items-center justify-center gap-2 text-slate-600">
              <ImageIcon size={32} />
              <span className="text-xs font-bold">Enter a URL above to preview</span>
            </div>
          )}
        </Card>

        {/* Score fields — only visible when status is completed */}
        {formData.status === 'completed' && (
          <Card className="p-4 sm:p-6 space-y-5 bg-brand-card/40 border-white/5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Match Result</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Team 1 Name"
                  value={formData.team1_name}
                  onChange={e => handleChange('team1_name', e.target.value)}
                />
                <Input
                  label="Team 1 Logo URL"
                  placeholder="https://..."
                  value={formData.team1_logo}
                  onChange={e => handleChange('team1_logo', e.target.value)}
                />
                <Input
                  label="Team 1 Score"
                  type="number"
                  placeholder="0"
                  value={(formData as any).team1_score ?? ''}
                  onChange={e => handleChange('team1_score', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-4">
                <Input
                  label="Team 2 Name"
                  value={formData.team2_name}
                  onChange={e => handleChange('team2_name', e.target.value)}
                />
                <Input
                  label="Team 2 Logo URL"
                  placeholder="https://..."
                  value={formData.team2_logo}
                  onChange={e => handleChange('team2_logo', e.target.value)}
                />
                <Input
                  label="Team 2 Score"
                  type="number"
                  placeholder="0"
                  value={(formData as any).team2_score ?? ''}
                  onChange={e => handleChange('team2_score', parseInt(e.target.value))}
                />
              </div>
            </div>
            {/* Team logo previews */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { url: formData.team1_logo, name: formData.team1_name },
                { url: formData.team2_logo, name: formData.team2_name },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden flex-shrink-0 bg-white/5">
                    {t.url ? (
                      <img src={t.url} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-400 truncate">{t.name}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

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
