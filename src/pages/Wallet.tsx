import { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import {
  Plus, ArrowUpRight, ArrowDownLeft, Trophy,
  Gamepad2, X, Copy, CheckCircle2, AlertCircle,
  TrendingUp, Wallet as WalletIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

export default function Wallet() {
  const { user, transactions, addTransaction } = useUserStore();
  const [showAdd, setShowAdd]           = useState(false);
  const [showWith, setShowWith]         = useState(false);
  const [amount, setAmount]             = useState('');
  const [step, setStep]                 = useState(1);
  const [utr, setUtr]                   = useState('');
  const [method, setMethod]             = useState<'upi'|'giftcard'>('upi');
  const [details, setDetails]           = useState('');
  const [status, setStatus]             = useState<'idle'|'success'>('idle');
  const ADMIN_UPI                       = 'admin@upi';

  const depositedAmt = transactions.filter(t => t.type === 'deposit' && t.status === 'success').reduce((a,t) => a+t.amount,0);
  const winningsAmt  = transactions.filter(t => t.type === 'win'     && t.status === 'success').reduce((a,t) => a+t.amount,0);

  const handleAddCash = () => {
    if (Number(amount) < 10) return alert('Minimum deposit is ₹10');
    setStep(2);
  };

  const submitDeposit = () => {
    if (!utr) return alert('Enter Transaction ID');
    addTransaction({ type:'deposit', amount:Number(amount), status:'pending', method:'upi', details:utr, title:'Deposit Request' });
    setStatus('success');
    setTimeout(() => { setShowAdd(false); setStep(1); setAmount(''); setUtr(''); setStatus('idle'); }, 2200);
  };

  const handleWithdraw = () => {
    const n = Number(amount);
    if (n < 50) return alert('Minimum withdrawal ₹50');
    if (n > (user?.coins||0)) return alert('Insufficient balance');
    if (!details) return alert(`Enter ${method==='upi'?'UPI ID':'Email'}`);
    addTransaction({ type:'withdrawal', amount:-n, status:'pending', method, details, title:`${method==='upi'?'UPI':'Gift Card'} Withdrawal` });
    useUserStore.getState().updateCoins(-n);
    setStatus('success');
    setTimeout(() => { setShowWith(false); setAmount(''); setDetails(''); setStatus('idle'); }, 2200);
  };

  const txIcon = (type: string) => {
    if (type==='deposit')    return <Plus className="w-5 h-5" />;
    if (type==='win')        return <Trophy className="w-5 h-5" />;
    if (type==='withdrawal') return <ArrowUpRight className="w-5 h-5" />;
    return <Gamepad2 className="w-5 h-5" />;
  };

  return (
    <div className="pb-28 space-y-6 px-4">
      {/* Balance card */}
      <section className="pt-3">
        <div className="relative rounded-[24px] overflow-hidden p-6 bg-gradient-to-br from-[#312E81] via-[#1e1b4b] to-[#0E1626] border border-brand-primary/20 shadow-2xl shadow-brand-primary/20">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-white/50 tracking-wide uppercase mb-1.5">Total Balance</p>
                <p className="text-4xl font-extrabold text-white tracking-tight">₹{user?.coins||0}<span className="text-lg font-semibold">.00</span></p>
              </div>
              <div className="w-11 h-11 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/15">
                <WalletIcon size={20} className="text-white" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-white/8 backdrop-blur rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownLeft size={12} className="text-brand-success" />
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">Deposited</p>
                </div>
                <p className="text-sm font-bold text-white">₹{depositedAmt}</p>
              </div>
              <div className="flex-1 bg-white/8 backdrop-blur rounded-2xl p-3.5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={12} className="text-brand-warning" />
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">Winnings</p>
                </div>
                <p className="text-sm font-bold text-white">₹{winningsAmt}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 py-4 bg-brand-primary hover:bg-brand-primary-light text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-primary/25 transition-all active:scale-95"
        >
          <Plus size={18} /> Add Cash
        </button>
        <button
          onClick={() => setShowWith(true)}
          className="flex items-center justify-center gap-2 py-4 bg-app-card border border-app-border text-text-primary text-sm font-bold rounded-2xl hover:border-brand-primary/30 transition-all active:scale-95"
        >
          <ArrowUpRight size={18} /> Withdraw
        </button>
      </div>

      {/* Transactions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-text-primary">Transactions</h3>
          <button className="text-xs font-semibold text-brand-primary-light hover:underline">View All</button>
        </div>

        {transactions.length === 0 && (
          <div className="py-10 text-center text-sm text-text-muted font-medium">No transactions yet</div>
        )}

        <div className="space-y-2.5">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between bg-app-card border border-app-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-3.5">
                <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', tx.amount>0 ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-live/10 text-brand-live')}>
                  {txIcon(tx.type)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{tx.title || tx.type}</p>
                  <p className="text-xs text-text-muted font-medium">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-bold', tx.amount>0 ? 'text-brand-success' : 'text-text-primary')}>
                  {tx.amount>0?'+':''}₹{Math.abs(tx.amount)}
                </p>
                <p className={cn('text-[10px] font-semibold capitalize', tx.status==='success'?'text-brand-success/70':tx.status==='pending'?'text-brand-warning/70':'text-brand-live/70')}>
                  {tx.status}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Add Cash Modal ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowAdd(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} exit={{y:60,opacity:0}}
              transition={{type:'spring',stiffness:260,damping:26}}
              className="relative w-full max-w-md bg-app-card border border-app-border rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Add Cash</h3>
                <button onClick={()=>setShowAdd(false)} className="w-8 h-8 bg-app-elevated rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>

              {status==='success' ? (
                <div className="py-10 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-brand-success/15 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-brand-success" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Request Submitted!</p>
                    <p className="text-sm text-text-muted font-medium mt-1">Admin will verify and add funds shortly.</p>
                  </div>
                </div>
              ) : step===1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary">Amount (Min ₹10)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">₹</span>
                      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"
                        className="w-full bg-app-elevated border border-app-border rounded-2xl py-3.5 pl-9 pr-4 text-lg font-bold focus:border-brand-primary outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[50,100,200,500].map(v=>(
                      <button key={v} onClick={()=>setAmount(v.toString())}
                        className="py-2.5 bg-app-elevated border border-app-border rounded-xl text-xs font-semibold text-text-secondary hover:border-brand-primary/40 hover:text-text-primary transition-all active:scale-95">
                        +₹{v}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleAddCash} fullWidth size="lg">Continue</Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-brand-primary/8 border border-brand-primary/20 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-brand-primary-light mb-0.5">Pay via UPI</p>
                        <p className="text-base font-bold text-text-primary">{ADMIN_UPI}</p>
                      </div>
                      <button onClick={()=>{navigator.clipboard.writeText(ADMIN_UPI);alert('Copied!');}}
                        className="p-2.5 bg-brand-primary text-white rounded-xl active:scale-90 transition-transform">
                        <Copy size={15} />
                      </button>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-app-border">
                      {['Copy the UPI ID','Pay ₹'+amount+' using any UPI app','Enter the 12-digit UTR below'].map((t,i)=>(
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-brand-primary/15 flex items-center justify-center text-[9px] font-bold text-brand-primary shrink-0">{i+1}</div>
                          <p className="text-xs font-medium text-text-secondary">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Transaction ID (UTR)</label>
                    <input type="text" value={utr} onChange={e=>setUtr(e.target.value)} placeholder="Enter 12-digit ID"
                      className="w-full bg-app-elevated border border-app-border rounded-2xl py-3.5 px-4 text-sm font-medium focus:border-brand-primary outline-none transition-colors" />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={()=>setStep(1)} className="flex-1">Back</Button>
                    <Button onClick={submitDeposit} className="flex-[2]">Submit</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Withdraw Modal ── */}
      <AnimatePresence>
        {showWith && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowWith(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} exit={{y:60,opacity:0}}
              transition={{type:'spring',stiffness:260,damping:26}}
              className="relative w-full max-w-md bg-app-card border border-app-border rounded-3xl p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Withdraw Funds</h3>
                <button onClick={()=>setShowWith(false)} className="w-8 h-8 bg-app-elevated rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                  <X size={16} />
                </button>
              </div>

              {status==='success' ? (
                <div className="py-10 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-brand-success/15 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-brand-success" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">Withdrawal Requested!</p>
                    <p className="text-sm text-text-muted font-medium mt-1">Funds sent within 24 hours.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary">Method</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(['upi','giftcard'] as const).map(m=>(
                        <button key={m} onClick={()=>setMethod(m)}
                          className={cn('py-3.5 rounded-2xl text-xs font-semibold border transition-all',
                            method===m ? 'bg-brand-primary border-brand-primary text-white' : 'bg-app-elevated border-app-border text-text-secondary hover:border-brand-primary/30')}>
                          {m==='upi'?'UPI Transfer':'Google Play'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">Amount (Min ₹50)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">₹</span>
                      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"
                        className="w-full bg-app-elevated border border-app-border rounded-2xl py-3.5 pl-9 pr-4 text-lg font-bold focus:border-brand-primary outline-none transition-colors" />
                    </div>
                    <p className="text-xs text-text-muted font-medium">Available: ₹{user?.coins||0}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary">{method==='upi'?'UPI ID':'Email Address'}</label>
                    <input type="text" value={details} onChange={e=>setDetails(e.target.value)}
                      placeholder={method==='upi'?'example@upi':'your@email.com'}
                      className="w-full bg-app-elevated border border-app-border rounded-2xl py-3.5 px-4 text-sm font-medium focus:border-brand-primary outline-none transition-colors" />
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-brand-warning/8 border border-brand-warning/20 rounded-2xl">
                    <AlertCircle size={16} className="text-brand-warning shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-brand-warning/80 leading-relaxed">
                      Withdrawals are processed manually and may take up to 24 hours.
                    </p>
                  </div>

                  <Button onClick={handleWithdraw} fullWidth size="lg">Withdraw Now</Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
