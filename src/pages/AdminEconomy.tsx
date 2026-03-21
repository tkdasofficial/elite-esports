import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Search, Check, X, ArrowUpRight, ArrowDownLeft, Download, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/src/components/ui/Button';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { cn } from '@/src/utils/helpers';

type Tx = {
  id: string; user: string; amount: number; type: string;
  status: string; date: string; method: string;
};

type Toast = { msg: string; ok: boolean } | null;

const INITIAL_TXS: Tx[] = [
  { id: 'TXN1001', user: 'EsportsPro',  amount: 500,  type: 'deposit',    status: 'pending', date: '20 Mar, 10:30 AM', method: 'UPI' },
  { id: 'TXN1002', user: 'ProSlayer',   amount: 1200, type: 'withdrawal', status: 'pending', date: '20 Mar, 09:15 AM', method: 'Bank Transfer' },
  { id: 'TXN1003', user: 'NoobMaster',  amount: 200,  type: 'deposit',    status: 'success', date: '19 Mar, 08:00 PM', method: 'UPI' },
  { id: 'TXN1004', user: 'EliteGamer',  amount: 5000, type: 'withdrawal', status: 'rejected',date: '18 Mar, 04:30 PM', method: 'UPI' },
  { id: 'TXN1005', user: 'ShadowHunter',amount: 1500, type: 'deposit',    status: 'success', date: '18 Mar, 02:15 PM', method: 'UPI' },
];

export default function AdminEconomy() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactions, setTransactions] = useState<Tx[]>(INITIAL_TXS);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]               = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAction = (id: string, status: 'success' | 'rejected') => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, status } : tx));
    showToast(`Transaction ${status === 'success' ? 'approved' : 'rejected'} successfully`);
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    setConfirmDeleteId(null);
    showToast('Transaction record deleted');
  };

  const exportCSV = () => {
    const headers = ['ID', 'User', 'Amount', 'Type', 'Status', 'Date', 'Method'];
    const rows = transactions.map(tx => [tx.id, tx.user, tx.amount, tx.type, tx.status, tx.date, tx.method]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully');
  };

  const filtered = transactions.filter(tx => {
    const matchesSearch = tx.user.toLowerCase().includes(searchQuery.toLowerCase()) || tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType   = typeFilter   === 'all' || tx.type   === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalDeposits     = transactions.filter(t => t.type === 'deposit'    && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals  = transactions.filter(t => t.type === 'withdrawal' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const pendingWithdrawals= transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Economy</h1>
          <p className="text-xs text-slate-500 font-bold">{transactions.filter(t => t.status === 'pending').length} pending actions</p>
        </div>
        <Button variant="secondary" onClick={exportCSV} size="sm" className="rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center border-white/10">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-brand-green/5 border-brand-green/10">
          <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Total Deposits</p>
          <p className="text-xl font-black text-brand-green mt-1">₹{totalDeposits.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-brand-red/5 border-brand-red/10">
          <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest">Withdrawals</p>
          <p className="text-xl font-black text-brand-red mt-1">₹{totalWithdrawals.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-brand-yellow/5 border-brand-yellow/10">
          <p className="text-[10px] font-bold text-brand-yellow uppercase tracking-widest">Pending Payouts</p>
          <p className="text-xl font-black text-brand-yellow mt-1">₹{pendingWithdrawals.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-brand-blue/5 border-brand-blue/10">
          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Platform Profit</p>
          <p className="text-xl font-black text-brand-blue mt-1">₹{(totalDeposits - totalWithdrawals).toLocaleString()}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search by user or transaction ID..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600" />
        </div>
        <div className="flex gap-2">
          <CustomSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all',        label: 'All Types'    },
              { value: 'deposit',    label: 'Deposits',    emoji: '📥' },
              { value: 'withdrawal', label: 'Withdrawals', emoji: '📤' },
            ]}
            variant="admin"
            className="flex-1 md:flex-none md:w-40"
          />
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all',      label: 'All Status' },
              { value: 'pending',  label: 'Pending',   emoji: '🕐' },
              { value: 'success',  label: 'Success',   emoji: '✅' },
              { value: 'rejected', label: 'Rejected',  emoji: '❌' },
            ]}
            variant="admin"
            className="flex-1 md:flex-none md:w-40"
          />
        </div>
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        {filtered.map((tx, i) => (
          <motion.div key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4 bg-brand-card/40 border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center ${tx.type === 'deposit' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                  {tx.type === 'deposit' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">{tx.user}</h3>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-bold">{tx.method}</span>
                    <span className="text-[10px] text-slate-600 font-bold">#{tx.id}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{tx.date}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-[10px] font-black uppercase',
                      tx.status === 'pending' ? 'text-brand-yellow' : tx.status === 'success' ? 'text-brand-green' : 'text-brand-red'
                    )}>{tx.status}</span>
                    <span className="text-[10px] font-black text-white">₹{tx.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Confirm delete inline */}
              {confirmDeleteId === tx.id ? (
                <div className="mt-3 flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20">
                  <p className="flex-1 text-xs font-bold text-brand-red">Delete record #{tx.id}?</p>
                  <button onClick={() => handleDelete(tx.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  {tx.status === 'pending' ? (
                    <>
                      <button onClick={() => handleAction(tx.id, 'success')}
                        className="flex-1 py-2 bg-brand-green text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => handleAction(tx.id, 'rejected')}
                        className="flex-1 py-2 bg-brand-red text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity">
                        <X size={14} /> Reject
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(tx.id)}
                      className="py-2 px-4 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5">
                      <Trash2 size={13} /> Delete Record
                    </button>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm font-bold">No transactions found</div>
        )}
      </div>
    </div>
  );
}
