import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Search, Check, X, ArrowUpRight, ArrowDownLeft, Filter, Download, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/src/components/ui/Button';

export default function AdminEconomy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactions, setTransactions] = useState([
    { id: 'TXN1001', user: 'EsportsPro', amount: 500, type: 'deposit', status: 'pending', date: '20 Mar, 10:30 AM', method: 'UPI' },
    { id: 'TXN1002', user: 'ProSlayer', amount: 1200, type: 'withdrawal', status: 'pending', date: '20 Mar, 09:15 AM', method: 'Bank Transfer' },
    { id: 'TXN1003', user: 'NoobMaster69', amount: 200, type: 'deposit', status: 'success', date: '19 Mar, 08:00 PM', method: 'UPI' },
    { id: 'TXN1004', user: 'EliteGamer', amount: 5000, type: 'withdrawal', status: 'rejected', date: '18 Mar, 04:30 PM', method: 'UPI' },
    { id: 'TXN1005', user: 'ShadowHunter', amount: 1500, type: 'deposit', status: 'success', date: '18 Mar, 02:15 PM', method: 'UPI' },
  ]);

  const handleAction = (id: string, status: 'success' | 'rejected') => {
    if (window.confirm(`Are you sure you want to mark this transaction as ${status}?`)) {
      setTransactions(prev => prev.map(tx => 
        tx.id === id ? { ...tx, status } : tx
      ));
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this transaction record?')) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.user.toLowerCase().includes(searchQuery.toLowerCase()) || tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalDeposits = transactions
    .filter(tx => tx.type === 'deposit' && tx.status === 'success')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalWithdrawals = transactions
    .filter(tx => tx.type === 'withdrawal' && tx.status === 'success')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingWithdrawals = transactions
    .filter(tx => tx.type === 'withdrawal' && tx.status === 'pending')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Economy Management</h1>
        <Button variant="secondary" className="rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-brand-green/5 border-brand-green/10">
          <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Total Deposits</p>
          <p className="text-xl sm:text-2xl font-black text-brand-green">₹{totalDeposits.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-brand-red/5 border-brand-red/10">
          <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest">Total Withdrawals</p>
          <p className="text-xl sm:text-2xl font-black text-brand-red">₹{totalWithdrawals.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-brand-yellow/5 border-brand-yellow/10">
          <p className="text-[10px] font-bold text-brand-yellow uppercase tracking-widest">Pending Payouts</p>
          <p className="text-xl sm:text-2xl font-black text-brand-yellow">₹{pendingWithdrawals.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-brand-blue/5 border-brand-blue/10">
          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Platform Profit</p>
          <p className="text-xl sm:text-2xl font-black text-brand-blue">₹{(totalDeposits - totalWithdrawals).toLocaleString()}</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 md:flex-none bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none bg-brand-card/40 border border-white/5 rounded-2xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTransactions.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 bg-brand-card/40 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${tx.type === 'deposit' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                  {tx.type === 'deposit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm truncate">{tx.user}</h3>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-bold">{tx.method}</span>
                    <span className="text-[10px] text-slate-600 font-bold truncate">#{tx.id}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tx.date}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-black uppercase ${
                      tx.status === 'pending' ? 'text-brand-yellow' : 
                      tx.status === 'success' ? 'text-brand-green' : 'text-brand-red'
                    }`}>{tx.status}</span>
                    <span className="text-[10px] font-bold text-slate-600">•</span>
                    <span className="text-[10px] font-black text-white uppercase">₹{tx.amount}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {tx.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => handleAction(tx.id, 'success')}
                      className="p-2.5 bg-brand-green text-white rounded-xl shadow-lg shadow-brand-green/20 active:scale-90 transition-all"
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={() => handleAction(tx.id, 'rejected')}
                      className="p-2.5 bg-brand-red text-white rounded-xl shadow-lg shadow-brand-red/20 active:scale-90 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleDelete(tx.id)}
                    className="p-2.5 bg-white/5 text-slate-400 hover:text-brand-red rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
