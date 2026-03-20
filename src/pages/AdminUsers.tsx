import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { ArrowLeft, Search, User, Shield, Ban, CheckCircle2, Coins, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/src/components/ui/Button';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([
    { id: '1', username: 'EsportsPro', email: 'pro@elite.com', rank: 'Diamond', coins: 1250, status: 'active', joined: '2024-01-15' },
    { id: '2', username: 'ProSlayer', email: 'slayer@gmail.com', rank: 'Master', coins: 4500, status: 'active', joined: '2024-02-10' },
    { id: '3', username: 'NoobMaster69', email: 'noob@yahoo.com', rank: 'Bronze', coins: 10, status: 'banned', joined: '2024-03-01' },
  ]);

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(user => 
      user.id === id 
        ? { ...user, status: user.status === 'active' ? 'banned' : 'active' }
        : user
    ));
  };

  const addCoins = (id: string) => {
    const amount = window.prompt('Enter amount of coins to add:');
    if (!amount || isNaN(Number(amount))) return;
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, coins: user.coins + Number(amount) } : user
    ));
  };

  const deleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
      setUsers(prev => prev.filter(user => user.id !== id));
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-4 text-white">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 bg-white/5 rounded-xl text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black tracking-tight">Users</h1>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search users..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 bg-brand-card/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center text-slate-400">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{user.username}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <span className="text-[10px] font-black text-brand-blue uppercase">{user.rank}</span>
                    <span className="text-[10px] font-bold text-slate-600">•</span>
                    <span className="text-[10px] font-black text-brand-green uppercase">₹{user.coins}</span>
                    <span className="text-[10px] font-bold text-slate-600">•</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Joined {user.joined}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => addCoins(user.id)}
                  className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-green transition-all"
                  title="Add Coins"
                >
                  <Coins size={16} />
                </button>
                <button 
                  onClick={() => toggleStatus(user.id)}
                  className={`p-2.5 rounded-xl transition-all ${user.status === 'banned' ? 'bg-brand-red text-white' : 'bg-white/5 text-slate-400 hover:text-brand-red'}`}
                  title={user.status === 'banned' ? 'Unban' : 'Ban'}
                >
                  {user.status === 'banned' ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                </button>
                <button 
                  onClick={() => deleteUser(user.id)}
                  className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-red transition-all"
                  title="Delete User"
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
