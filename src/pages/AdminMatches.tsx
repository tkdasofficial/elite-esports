import React, { useState } from 'react';
import { useMatchStore } from '@/src/store/matchStore';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Tag } from '@/src/components/ui/Tag';

export default function AdminMatches() {
  const { matches, deleteMatch } = useMatchStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      deleteMatch(id);
    }
  };

  const filteredMatches = matches.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.game_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-4 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/admin')} className="p-2 bg-white/5 rounded-xl text-slate-400 flex-shrink-0">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-black tracking-tight truncate">Tournaments</h1>
        </div>
        <Link to="/admin/matches/new" className="flex-shrink-0">
          <Button size="sm" className="rounded-xl px-4 flex items-center gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search tournaments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all"
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredMatches.map((match, i) => (
          <motion.div
            key={match.match_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 bg-brand-card/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 flex-shrink-0">
                  <img src={match.banner_image} alt={match.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Tag variant={match.status as any}>{match.status}</Tag>
                    <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest truncate">{match.game_name}</span>
                  </div>
                  <h3 className="font-bold text-sm truncate">{match.title}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{match.mode} • {match.prize}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => navigate(`/admin/matches/edit/${match.match_id}`)}
                  className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:bg-brand-blue/10 hover:text-brand-blue transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(match.match_id)}
                  className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:bg-brand-red/10 hover:text-brand-red transition-all"
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
