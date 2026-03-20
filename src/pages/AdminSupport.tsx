import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { MessageSquare, Search, Filter, Check, X, User, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSupport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState([
    { id: '1', user: 'EsportsPro', subject: 'Withdrawal Pending', status: 'open', date: '20 Mar, 10:30 AM', priority: 'high' },
    { id: '2', user: 'ProSlayer', subject: 'Match Result Issue', status: 'pending', date: '20 Mar, 09:15 AM', priority: 'medium' },
    { id: '3', user: 'NoobMaster69', subject: 'Login Problem', status: 'closed', date: '19 Mar, 08:00 PM', priority: 'low' },
  ]);

  const filteredTickets = tickets.filter(t => 
    t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResolve = (id: string) => {
    setTickets(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'closed' } : t
    ));
    alert('Ticket marked as resolved!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this ticket?')) {
      setTickets(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Support Tickets</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="p-3 bg-white/5 text-slate-400 rounded-2xl active:scale-95 transition-all w-full sm:w-auto flex justify-center">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-brand-red/5 border-brand-red/10 flex flex-col justify-between h-full">
          <p className="text-[10px] font-black text-brand-red uppercase tracking-widest opacity-70">Open Tickets</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-red leading-none">
              {tickets.filter(t => t.status === 'open').length}
            </p>
            <MessageSquare size={20} className="text-brand-red opacity-30" />
          </div>
        </Card>
        <Card className="p-5 bg-brand-yellow/5 border-brand-yellow/10 flex flex-col justify-between h-full">
          <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest opacity-70">Pending Reply</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-yellow leading-none">
              {tickets.filter(t => t.status === 'pending').length}
            </p>
            <Clock size={20} className="text-brand-yellow opacity-30" />
          </div>
        </Card>
        <Card className="p-5 bg-brand-green/5 border-brand-green/10 flex flex-col justify-between h-full sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black text-brand-green uppercase tracking-widest opacity-70">Resolved Today</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-black text-brand-green leading-none">
              {tickets.filter(t => t.status === 'closed').length}
            </p>
            <Check size={20} className="text-brand-green opacity-30" />
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search tickets by user or subject..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      <div className="space-y-4">
        {filteredTickets.map((ticket, i) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 bg-brand-card/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  ticket.priority === 'high' ? 'bg-brand-red/10 text-brand-red' : 
                  ticket.priority === 'medium' ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-brand-blue/10 text-brand-blue'
                }`}>
                  <MessageSquare size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm truncate">{ticket.subject}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                      ticket.status === 'open' ? 'bg-brand-red/20 text-brand-red' : 
                      ticket.status === 'pending' ? 'bg-brand-yellow/20 text-brand-yellow' : 'bg-brand-green/20 text-brand-green'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                      <User size={10} className="flex-shrink-0" />
                      {ticket.user}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                      <Clock size={10} className="flex-shrink-0" />
                      {ticket.date}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleResolve(ticket.id)}
                  className="p-2.5 bg-brand-blue text-white rounded-xl shadow-lg shadow-brand-blue/20 active:scale-95 transition-all"
                >
                  <Check size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(ticket.id)}
                  className="p-2.5 bg-white/5 text-slate-400 hover:text-brand-red rounded-xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
