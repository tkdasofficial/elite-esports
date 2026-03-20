import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminGames() {
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState([
    { id: '1', name: 'BGMI', category: 'Battle Royale', icon: 'https://picsum.photos/seed/bgmi/100/100', status: 'active', matches: 12 },
    { id: '2', name: 'Free Fire', category: 'Battle Royale', icon: 'https://picsum.photos/seed/ff/100/100', status: 'active', matches: 8 },
    { id: '3', name: 'Valorant', category: 'FPS', icon: 'https://picsum.photos/seed/val/100/100', status: 'active', matches: 5 },
    { id: '4', name: 'Call of Duty', category: 'FPS', icon: 'https://picsum.photos/seed/cod/100/100', status: 'inactive', matches: 0 },
  ]);

  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setGames(prev => prev.map(g => 
      g.id === id ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } : g
    ));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this game? This will affect all associated matches.')) {
      setGames(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleAdd = () => {
    const name = window.prompt('Enter Game Name:');
    if (!name) return;
    const category = window.prompt('Enter Category (e.g., FPS, Battle Royale):');
    if (!category) return;

    const newGame = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      category,
      icon: `https://picsum.photos/seed/${name}/100/100`,
      status: 'inactive',
      matches: 0
    };
    setGames(prev => [...prev, newGame]);
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Game Management</h1>
        <Button onClick={handleAdd} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} />
          Add Game
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search games..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        <Button variant="secondary" className="rounded-2xl border-white/5 w-full md:w-auto">
          <Filter size={18} className="mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGames.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 bg-brand-card/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/5 flex-shrink-0">
                  <img src={game.icon} alt={game.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{game.name}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{game.category}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <button 
                      onClick={() => toggleStatus(game.id)}
                      className={`text-[10px] font-black uppercase hover:opacity-80 transition-all ${
                        game.status === 'active' ? 'text-brand-green' : 'text-slate-600'
                      }`}
                    >
                      {game.status}
                    </button>
                    <span className="text-[10px] font-bold text-slate-600">•</span>
                    <span className="text-[10px] font-black text-white uppercase truncate">{game.matches} Active Matches</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button className="p-2.5 bg-white/5 text-slate-400 hover:text-brand-blue rounded-xl transition-all">
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(game.id)}
                  className="p-2.5 bg-white/5 text-slate-400 hover:text-brand-red rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
