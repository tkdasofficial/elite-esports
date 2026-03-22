import React, { useState, useEffect } from 'react';
import { Search, Check, X, ArrowUpRight, ArrowDownLeft, Download, Trash2, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, Clock, CircleCheck, CircleX, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { cn } from '@/src/utils/helpers';
import { usePlatformStore } from '@/src/store/platformStore';

type Toast = { msg: string; ok: boolean } | null;

export default function AdminEconomy() {
  const { adminTransactions, fetchTransactions, approveTransaction, rejectTransaction, deleteTransaction } = usePlatformStore();
  const [searchQuery, setSearchQuery]         = useState('');
  const [typeFilter, setTypeFilter]           = useState('all');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]                     = useState<Toast>(null);

  useEffect(() => { fetchTransactions(); }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleApprove = async (id: string) => {
    await approveTransaction(id);
    showToast('Transaction approved');
  };

  const handleReject = async (id: string) => {
    await rejectTransaction(id);
    showToast('Transaction rejected', false);
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setConfirmDeleteId(null);
    showToast('Record deleted');
  };

  const exportCSV = () => {
    const headers = ['ID', 'User', 'Amount', 'Type', 'Status', 'Date', 'Method'];
    const rows = adminTransactions.map(tx => [tx.id, tx.user, tx.amount, tx.type, tx.status, tx.date, tx.method]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported');
  };

  const filtered = adminTransactions.filter(tx => {
    const matchesSearch = tx.user.toLowerCase().includes(searchQuery.toLowerCase()) || tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType   = typeFilter   === 'all' || tx.type   === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalDeposits    = adminTransactions.filter(t => t.type === 'deposit'    && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = adminTransactions.filter(t => t.type === 'withdrawal' && t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const pendingCount     = adminTransactions.filter(t => t.status === 'pending').length;

  const stats = [
    { label: 'Deposits',    value: `₹${totalDeposits.toLocaleString()}`,                      color: 'text-brand-success', bg: 'bg-brand-success/15', icon: ArrowDownLeft   },
    { label: 'Withdrawals', value: `₹${totalWithdrawals.toLocaleString()}`,                   color: 'text-brand-live',    bg: 'bg-brand-live/15',    icon: ArrowUpRight    },
    { label: 'Profit',      value: `₹${(totalDeposits - totalWithdrawals).toLocaleString()}`, color: 'text-brand-primary', bg: 'bg-brand-primary/15', icon: ArrowDownToLine },
    { label: 'Pending',     value: pendingCount.toString(),                                    color: 'text-brand-warning', bg: 'bg-brand-warning/15', icon: Clock           },
  ];

  const statusColor = (s: string) => {
    if (s === 'pending')  return 'text-brand-warning';
    if (s === 'success')  return 'text-brand-success';
    if (s === 'rejected') return 'text-brand-live';
    return 'text-text-muted';
  };

  return (
    <div className="pb-24 pt-2 space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-[14px] text-[14px] font-medium shadow-xl flex items-center gap-2 pointer-events-none whitespace-nowrap ${toast.ok ? 'bg-brand-success text-white' : 'bg-brand-live text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Finance</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">{pendingCount} pending actions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchTransactions()}
            className="w-9 h-9 bg-app-elevated rounded-full flex items-center justify-center border border-ios-sep active:opacity-60 transition-opacity">
            <RefreshCw size={15} className="text-text-secondary" />
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-app-elevated rounded-full text-text-secondary text-[14px] font-medium active:opacity-60 transition-opacity border border-ios-sep">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <section className="px-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-app-card rounded-[18px] p-4 space-y-3">
              <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center', s.bg)}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-[22px] font-bold text-text-primary tracking-tight">{s.value}</p>
                <p className="text-[12px] text-text-muted font-normal mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by user or transaction ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      <div className="px-4 flex gap-2">
        <CustomSelect value={typeFilter} onChange={setTypeFilter}
          options={[
            { value: 'all',        label: 'All Types'   },
            { value: 'deposit',    label: 'Deposits',    icon: ArrowDownToLine },
            { value: 'withdrawal', label: 'Withdrawals', icon: ArrowUpFromLine },
          ]}
          variant="admin" className="flex-1"
        />
        <CustomSelect value={statusFilter} onChange={setStatusFilter}
          options={[
            { value: 'all',      label: 'All Status' },
            { value: 'pending',  label: 'Pending',   icon: Clock       },
            { value: 'success',  label: 'Success',   icon: CircleCheck },
            { value: 'rejected', label: 'Rejected',  icon: CircleX     },
          ]}
          variant="admin" className="flex-1"
        />
      </div>

      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-14 text-center">
            <p className="text-[15px] text-text-muted font-normal">
              {adminTransactions.length === 0 ? 'No transactions yet' : 'No results match your filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-app-card rounded-[18px] overflow-hidden">
                <div className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center shrink-0',
                    tx.type === 'deposit' ? 'bg-brand-success/15 text-brand-success' : 'bg-brand-live/15 text-brand-live'
                  )}>
                    {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[15px] font-medium text-text-primary">{tx.user}</p>
                      {tx.method && <span className="text-[11px] bg-app-elevated px-2 py-0.5 rounded-full text-text-muted border border-ios-sep">{tx.method}</span>}
                    </div>
                    <p className="text-[12px] text-text-muted mt-0.5">{tx.date} · #{tx.id.slice(0, 8)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-[12px] font-semibold capitalize', statusColor(tx.status))}>{tx.status}</span>
                      <span className="text-[12px] font-semibold text-text-primary">₹{tx.amount.toLocaleString()}</span>
                      {tx.details && (
                        <span className="text-[11px] text-text-muted truncate max-w-[120px]">UTR: {tx.details}</span>
                      )}
                    </div>
                  </div>
                </div>

                {confirmDeleteId === tx.id ? (
                  <div className="mx-4 mb-3 flex items-center gap-2 p-3 bg-brand-live/5 rounded-[12px] border border-brand-live/20">
                    <p className="flex-1 text-[13px] text-brand-live">Delete this record?</p>
                    <button onClick={() => handleDelete(tx.id)} className="px-3 py-1.5 bg-brand-live text-white text-[12px] font-medium rounded-[10px] active:opacity-70">Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-app-elevated text-text-secondary text-[12px] font-medium rounded-[10px] active:opacity-70">Cancel</button>
                  </div>
                ) : (
                  <div className="mx-4 mb-3 flex items-center gap-2">
                    {tx.status === 'pending' ? (
                      <>
                        <button onClick={() => handleApprove(tx.id)}
                          className="flex-1 py-2.5 bg-brand-success text-white rounded-[12px] text-[13px] font-medium flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity">
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => handleReject(tx.id)}
                          className="flex-1 py-2.5 bg-brand-live text-white rounded-[12px] text-[13px] font-medium flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity">
                          <X size={14} /> Reject
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(tx.id)}
                        className="py-2.5 px-4 bg-app-elevated rounded-[12px] text-[13px] font-medium text-text-secondary active:opacity-70 transition-opacity flex items-center gap-1.5 border border-ios-sep">
                        <Trash2 size={13} /> Delete Record
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
