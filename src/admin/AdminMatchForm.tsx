import React, { useState, useEffect } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { useGameStore } from '@/src/store/gameStore';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { ArrowLeft, Save, ImageIcon, Clock, Radio, CheckCircle2, Users, Sword, Swords, Trophy, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Match } from '@/src/types';
import { cn } from '@/src/utils/helpers';

const STATUS_OPTIONS = [
  { value: 'upcoming',  label: 'Upcoming',  icon: Clock,        description: 'Not started yet' },
  { value: 'live',      label: 'Live',      icon: Radio,        description: 'Currently in progress' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, description: 'Match has ended' },
];

const MODE_OPTIONS = [
  { value: 'Squad', label: 'Squad', icon: Users,  description: '4 players per team' },
  { value: '1v1',   label: '1v1',   icon: Sword,  description: 'Solo duel' },
  { value: '2v2',   label: '2v2',   icon: Swords, description: 'Duo vs duo' },
  { value: '4v4',   label: '4v4',   icon: Trophy, description: 'Team battle' },
];

const labelClass = 'text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1';
const inputClass = 'w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all';

export default function AdminMatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMatch, updateMatch, getMatchById } = useMatchStore();
  const allGames         = useGameStore(s => s.games);
  const activeGames      = allGames.filter(g => g.status === 'active');
  const getGame          = useGameStore(s => s.getGameByName);
  const incrementMatches = useGameStore(s => s.incrementMatches);
  const isEditing        = !!id;

  const gameOptions = activeGames.map(g => ({
    value: g.name,
    label: g.name,
    image: g.logo,
    description: g.category,
  }));

  const defaultGameName = activeGames[0]?.name ?? 'BGMI';
  const defaultBanner   = activeGames[0]?.banner ?? '';

  const [formData, setFormData] = useState<Partial<Match>>({
    game_name: defaultGameName,
    title: '',
    mode: 'Squad',
    banner_image: defaultBanner,
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
      const match = getMatchById(id!);
      if (match) setFormData(match);
    }
  }, [id, isEditing, getMatchById]);

  const handleGameChange = (gameName: string) => {
    const game = getGame(gameName);
    setFormData(prev => ({
      ...prev,
      game_name: gameName,
      banner_image: game?.banner ?? prev.banner_image,
    }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMatch(id!, formData);
    } else {
      const newMatch: Match = {
        ...(formData as Match),
        match_id: Math.random().toString(36).substr(2, 9),
      };
      addMatch(newMatch);
      if (newMatch.game_name) incrementMatches(newMatch.game_name);
    }
    navigate('/admin/matches');
  };

  const selectedGame = getGame(formData.game_name ?? '');

  return (
    <div className="pb-24 pt-2 space-y-5">
      {/* Header */}
      <div className="px-4 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/matches')}
            className="w-10 h-10 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60 transition-opacity border border-ios-sep"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">
              {isEditing ? 'Edit Tournament' : 'New Tournament'}
            </h1>
            <p className="text-[13px] text-text-muted font-normal mt-0.5">
              {isEditing ? 'Update tournament details' : 'Set up a new tournament'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
        >
          <Save size={15} /> Save
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 px-4">
        {/* Basic Info */}
        <section className="space-y-4">
          <p className={labelClass}>Basic Info</p>
          <div className="bg-app-card rounded-[18px] p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect
                label="Game"
                value={formData.game_name ?? defaultGameName}
                onChange={handleGameChange}
                options={gameOptions}
                variant="admin"
              />
              <CustomSelect
                label="Status"
                value={formData.status ?? 'upcoming'}
                onChange={v => handleChange('status', v)}
                options={STATUS_OPTIONS}
                variant="admin"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Tournament Title</label>
              <input
                placeholder="e.g. Pro Scrims: Elite Division"
                value={formData.title ?? ''}
                onChange={e => handleChange('title', e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomSelect
                label="Game Mode"
                value={formData.mode ?? 'Squad'}
                onChange={v => handleChange('mode', v)}
                options={MODE_OPTIONS}
                variant="admin"
              />
              <div className="space-y-2">
                <label className={labelClass}>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_time ?? ''}
                  onChange={e => handleChange('start_time', e.target.value)}
                  required
                  className={cn(inputClass)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Entry Fee</label>
                <input
                  placeholder="₹50"
                  value={formData.entry_fee ?? ''}
                  onChange={e => handleChange('entry_fee', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Prize Pool</label>
                <input
                  placeholder="₹5,000"
                  value={formData.prize ?? ''}
                  onChange={e => handleChange('prize', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={labelClass}>Total Slots</label>
                <input
                  type="number"
                  value={formData.slots_total ?? ''}
                  onChange={e => handleChange('slots_total', parseInt(e.target.value))}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Filled Slots</label>
                <input
                  type="number"
                  value={formData.slots_filled ?? ''}
                  onChange={e => handleChange('slots_filled', parseInt(e.target.value))}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Banner Preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className={labelClass}>Match Banner</p>
            <span className="text-[10px] font-semibold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">Auto from game</span>
          </div>
          <div className="bg-app-card rounded-[18px] overflow-hidden">
            {formData.banner_image ? (
              <div className="relative h-44">
                <img
                  src={formData.banner_image}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {selectedGame && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-[12px] px-3 py-1.5">
                    <img src={selectedGame.logo} alt={selectedGame.name} className="w-5 h-5 rounded-[6px] object-cover" referrerPolicy="no-referrer" />
                    <span className="text-[11px] font-semibold text-white">{selectedGame.name}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center gap-2 text-text-muted">
                <ImageIcon size={28} />
                <span className="text-[13px] font-normal">Select a game above to load banner</span>
              </div>
            )}
            <p className="text-[12px] text-text-muted font-normal px-4 py-3 border-t border-ios-sep">
              Banner is auto-set from the selected game. Edit in the Games section to change it.
            </p>
          </div>
        </section>

        {/* Match Result (only for completed) */}
        {formData.status === 'completed' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className={labelClass}>Match Result</p>
            <div className="bg-app-card rounded-[18px] p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Team 1', nameKey: 'team1_name', logoKey: 'team1_logo', scoreKey: 'team1_score' },
                  { label: 'Team 2', nameKey: 'team2_name', logoKey: 'team2_logo', scoreKey: 'team2_score' },
                ].map(team => (
                  <div key={team.label} className="space-y-3">
                    <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-[0.06em]">{team.label}</p>
                    <div className="space-y-2.5">
                      <input
                        placeholder="Team name"
                        value={(formData as any)[team.nameKey] ?? ''}
                        onChange={e => handleChange(team.nameKey, e.target.value)}
                        className={cn(inputClass, 'py-2.5 text-[14px]')}
                      />
                      <input
                        placeholder="Logo URL"
                        value={(formData as any)[team.logoKey] ?? ''}
                        onChange={e => handleChange(team.logoKey, e.target.value)}
                        className={cn(inputClass, 'py-2.5 text-[13px]')}
                      />
                      <input
                        type="number"
                        placeholder="Score"
                        value={(formData as any)[team.scoreKey] ?? ''}
                        onChange={e => handleChange(team.scoreKey, parseInt(e.target.value))}
                        className={cn(inputClass, 'py-2.5 text-[14px]')}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Logo preview */}
              <div className="flex items-center justify-center gap-6 pt-2 border-t border-ios-sep">
                {[
                  { url: formData.team1_logo, name: formData.team1_name },
                  { url: formData.team2_logo, name: formData.team2_name },
                ].map((t, i) => (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-[14px] border border-ios-sep overflow-hidden bg-app-elevated flex items-center justify-center">
                        {t.url ? (
                          <img src={t.url} alt={t.name ?? 'team'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon size={18} className="text-text-muted" />
                        )}
                      </div>
                      <span className="text-[12px] font-medium text-text-secondary truncate max-w-[70px] text-center">{t.name || `Team ${i + 1}`}</span>
                    </div>
                    {i === 0 && <span className="text-[16px] font-bold text-text-muted">vs</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="flex-1 py-4 bg-brand-primary rounded-[14px] text-[16px] font-semibold text-white active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <Check size={18} /> {isEditing ? 'Update Tournament' : 'Create Tournament'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/matches')}
            className="flex-1 py-4 bg-app-elevated rounded-[14px] text-[16px] font-medium text-text-secondary active:opacity-70 transition-opacity border border-ios-sep"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
