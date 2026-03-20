import { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { ArrowLeft, Plus, ArrowUpRight, Trophy, Gamepad2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type TxFilter = 'all' | 'deposit' | 'withdrawal' | 'win' | 'entry';

const FILTER_LABELS: Record<TxFilter, string> = {
  all: 'All',
  deposit: 'Deposits',
  withdrawal: 'Withdrawals',
  win: 'Winnings',
  entry: 'Entry Fees',
};

export default function AllTransactions() {
  const { transactions } = useUserStore();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<TxFilter>('all');

  const filtered = activeFilter === 'all' ? transactions : transactions.filter(t => t.type === activeFilter);

  const txIcon = (type: string) => {
    if (type === 'deposit')    return <Plus size={18} />;
    if (type === 'win')        return <Trophy size={18} />;
    if (type === 'withdrawal') return <ArrowUpRight size={18} />;
    return <Gamepad2 size={18} />;
  };

  const txColor = (type: string, amount: number) => {
    if (amount > 0) return 'bg-brand-success/15 text-brand-success';
    if (type === 'withdrawal') return 'bg-brand-live/15 text-brand-live';
    return 'bg-app-elevated text-text-secondary';
  };

  const totalIn  = transactions.filter(t => t.amount > 0 && t.status === 'success').reduce((a, t) => a + t.amount, 0);
  const totalOut = transactions.filter(t => t.amount < 0 && t.status === 'success').reduce((a, t) => a + t.amount, 0);

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Transactions</h1>
        <span className="ml-auto text-[13px] text-text-muted font-normal">{filtered.length} records</span>
      </header>

      <div className="flex-1 scrollable-content px-4 pt-4 pb-10 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-app-card rounded-[14px] p-3.5 space-y-1">
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wide">Total In</p>
            <p className="text-[18px] font-bold text-brand-success tabular">+₹{totalIn}</p>
          </div>
          <div className="bg-app-card rounded-[14px] p-3.5 space-y-1">
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wide">Total Out</p>
            <p className="text-[18px] font-bold text-brand-live tabular">₹{Math.abs(totalOut)}</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(Object.keys(FILTER_LABELS) as TxFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'px-3.5 py-[7px] rounded-full text-[13px] font-medium whitespace-nowrap transition-all duration-150 active:opacity-60 shrink-0',
                activeFilter === f
                  ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                  : 'bg-app-elevated text-text-secondary'
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-[72px] h-[72px] bg-app-card rounded-[22px] flex items-center justify-center">
              <Filter size={28} className="text-text-muted" />
            </div>
            <p className="text-[17px] font-semibold text-text-primary">No Transactions</p>
            <p className="text-[15px] text-text-secondary font-normal">No {activeFilter === 'all' ? '' : FILTER_LABELS[activeFilter].toLowerCase()} found</p>
          </div>
        ) : (
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            {filtered.map((tx, i) => (
              <motion.div key={tx.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3.5 px-4 py-3.5">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', txColor(tx.type, tx.amount))}>
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-normal text-text-primary truncate">{tx.title || tx.type}</p>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">{tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('text-[16px] font-semibold tabular', tx.amount > 0 ? 'text-brand-success' : 'text-text-primary')}>
                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                  </p>
                  <p className={cn('text-[12px] font-normal capitalize mt-0.5',
                    tx.status === 'success' ? 'text-brand-success' : tx.status === 'pending' ? 'text-brand-warning' : 'text-brand-live')}>
                    {tx.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
