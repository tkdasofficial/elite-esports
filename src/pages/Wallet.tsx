import { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { Plus, ArrowUpRight, ArrowDownLeft, Trophy, Gamepad2, X, Copy, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function Wallet() {
  const { user, transactions, addTransaction } = useUserStore();
  const navigate = useNavigate();
  const [showAdd, setShowAdd]   = useState(false);
  const [showWith, setShowWith] = useState(false);
  const [amount, setAmount]     = useState('');
  const [step, setStep]         = useState(1);
  const [utr, setUtr]           = useState('');
  const [method, setMethod]     = useState<'upi'|'giftcard'>('upi');
  const [details, setDetails]   = useState('');
  const [status, setStatus]     = useState<'idle'|'success'>('idle');
  const ADMIN_UPI = 'admin@upi';

  const deposited = transactions.filter(t => t.type==='deposit'    && t.status==='success').reduce((a,t)=>a+t.amount,0);
  const winnings  = transactions.filter(t => t.type==='win'        && t.status==='success').reduce((a,t)=>a+t.amount,0);

  const handleAddCash = () => { if (Number(amount) < 10) return alert('Minimum ₹10'); setStep(2); };
  const submitDeposit = () => {
    if (!utr) return alert('Enter Transaction ID');
    addTransaction({ type:'deposit', amount:Number(amount), status:'pending', method:'upi', details:utr, title:'Deposit Request' });
    setStatus('success');
    setTimeout(() => { setShowAdd(false); setStep(1); setAmount(''); setUtr(''); setStatus('idle'); }, 2200);
  };
  const handleWithdraw = () => {
    const n = Number(amount);
    if (n < 50) return alert('Minimum ₹50');
    if (n > (user?.coins||0)) return alert('Insufficient balance');
    if (!details) return alert(`Enter ${method==='upi'?'UPI ID':'Email'}`);
    addTransaction({ type:'withdrawal', amount:-n, status:'pending', method, details, title:`${method==='upi'?'UPI':'Gift Card'} Withdrawal` });
    useUserStore.getState().updateCoins(-n);
    setStatus('success');
    setTimeout(() => { setShowWith(false); setAmount(''); setDetails(''); setStatus('idle'); }, 2200);
  };

  const txIcon = (type: string) => {
    if (type==='deposit')    return <Plus size={18} />;
    if (type==='win')        return <Trophy size={18} />;
    if (type==='withdrawal') return <ArrowUpRight size={18} />;
    return <Gamepad2 size={18} />;
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none focus:bg-app-elevated transition-colors';

  const Modal = ({ visible, onClose, children }: any) => (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
            transition={{type:'spring',stiffness:300,damping:30}}
            className="relative w-full max-w-[440px] bg-app-card rounded-t-[28px] pb-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="pb-24 space-y-6 pt-2">
      <section className="mx-4">
        <div className="relative rounded-[22px] overflow-hidden p-6 bg-app-elevated border border-app-border" style={{background:'linear-gradient(145deg,#1a1a2e,#16213e,#0f3460)'}}>
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-primary/8 rounded-full blur-3xl pointer-events-none"/>
          <div className="relative space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] text-white/50 font-medium mb-1.5 tracking-wide">Total Balance</p>
                <p className="text-[40px] font-bold text-white leading-none tracking-tight tabular">₹{user?.coins||0}</p>
              </div>
              <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <ArrowUpRight size={20} className="text-white" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-white/8 rounded-2xl p-3.5 border border-white/8">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ArrowDownLeft size={12} className="text-brand-success"/>
                  <p className="text-[11px] font-medium text-white/40 uppercase tracking-wide">Deposited</p>
                </div>
                <p className="text-[15px] font-semibold text-white tabular">₹{deposited}</p>
              </div>
              <div className="flex-1 bg-white/8 rounded-2xl p-3.5 border border-white/8">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp size={12} className="text-brand-warning"/>
                  <p className="text-[11px] font-medium text-white/40 uppercase tracking-wide">Winnings</p>
                </div>
                <p className="text-[15px] font-semibold text-white tabular">₹{winnings}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 mx-4">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 py-4 bg-brand-primary rounded-[16px] text-white text-[16px] font-semibold active:opacity-75 transition-opacity shadow-lg shadow-brand-primary/20">
          <Plus size={19} /> Add Cash
        </button>
        <button onClick={() => setShowWith(true)}
          className="flex items-center justify-center gap-2 py-4 bg-app-elevated rounded-[16px] text-text-primary text-[16px] font-semibold active:opacity-75 transition-opacity border border-app-border">
          <ArrowUpRight size={19} /> Withdraw
        </button>
      </div>

      <section className="mx-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[17px] font-semibold text-text-primary tracking-[-0.3px]">Transactions</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-[15px] text-brand-primary font-normal active:opacity-60 transition-opacity"
          >
            View All
          </button>
        </div>

        {transactions.length === 0 && (
          <div className="py-10 bg-app-card rounded-[16px] text-center text-[15px] text-text-muted font-normal">
            No transactions yet
          </div>
        )}

        {transactions.length > 0 && (
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            {recentTransactions.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
                className="flex items-center gap-3.5 px-4 py-3.5">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  tx.amount>0 ? 'bg-brand-success/15 text-brand-success' : 'bg-brand-live/15 text-brand-live')}>
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-normal text-text-primary truncate">{tx.title || tx.type}</p>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-[16px] font-semibold tabular', tx.amount>0 ? 'text-brand-success':'text-text-primary')}>
                    {tx.amount>0?'+':''}₹{Math.abs(tx.amount)}
                  </p>
                  <p className={cn('text-[12px] font-normal capitalize mt-0.5',
                    tx.status==='success'?'text-brand-success':tx.status==='pending'?'text-brand-warning':'text-brand-live')}>
                    {tx.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {transactions.length > 5 && (
          <button
            onClick={() => navigate('/transactions')}
            className="w-full py-3 bg-app-elevated rounded-[14px] text-[14px] font-medium text-text-secondary active:opacity-60 transition-opacity border border-app-border"
          >
            View all {transactions.length} transactions
          </button>
        )}
      </section>

      <Modal visible={showAdd} onClose={() => setShowAdd(false)}>
        <div className="px-5 pt-2 pb-2 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-semibold text-text-primary">Add Cash</h3>
            <button onClick={() => setShowAdd(false)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
              <X size={15}/>
            </button>
          </div>
          {status==='success' ? (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-brand-success/15 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} className="text-brand-success"/>
              </div>
              <div>
                <p className="text-[18px] font-semibold text-text-primary">Request Submitted!</p>
                <p className="text-[15px] text-text-secondary mt-1 font-normal">Admin will verify and add funds shortly.</p>
              </div>
            </div>
          ) : step===1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[14px] text-text-secondary font-normal">Enter Amount (Min ₹10)</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-text-muted">₹</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"
                    className="w-full bg-app-fill rounded-[12px] py-3 pl-9 pr-4 text-[20px] font-semibold focus:bg-app-elevated text-text-primary outline-none tabular"/>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[50,100,200,500].map(v=>(
                  <button key={v} onClick={()=>setAmount(v.toString())}
                    className="py-2.5 bg-app-elevated rounded-[10px] text-[14px] font-medium text-text-secondary active:opacity-60 transition-opacity">
                    +₹{v}
                  </button>
                ))}
              </div>
              <Button onClick={handleAddCash} fullWidth size="lg">Continue</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-brand-primary/8 rounded-[14px] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-brand-primary-light mb-1 font-medium">Pay via UPI</p>
                    <p className="text-[17px] font-semibold text-text-primary">{ADMIN_UPI}</p>
                  </div>
                  <button onClick={()=>{navigator.clipboard.writeText(ADMIN_UPI);alert('Copied!');}}
                    className="w-9 h-9 bg-brand-primary rounded-full flex items-center justify-center active:opacity-70">
                    <Copy size={15} className="text-white"/>
                  </button>
                </div>
                <div className="space-y-2 pt-3 border-t border-app-border">
                  {['Copy UPI ID', `Pay ₹${amount} using any UPI app`, 'Enter 12-digit UTR below'].map((t,i)=>(
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-brand-primary/15 flex items-center justify-center text-[10px] font-semibold text-brand-primary shrink-0">{i+1}</div>
                      <p className="text-[13px] font-normal text-text-secondary">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[14px] text-text-secondary font-normal">Transaction ID (UTR)</p>
                <input type="text" value={utr} onChange={e=>setUtr(e.target.value)} placeholder="Enter 12-digit UTR"
                  className={inputCls}/>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={()=>setStep(1)} className="flex-1">Back</Button>
                <Button onClick={submitDeposit} className="flex-[2]">Submit</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal visible={showWith} onClose={() => setShowWith(false)}>
        <div className="px-5 pt-2 pb-2 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-semibold text-text-primary">Withdraw</h3>
            <button onClick={() => setShowWith(false)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
              <X size={15}/>
            </button>
          </div>
          {status==='success' ? (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-brand-success/15 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} className="text-brand-success"/>
              </div>
              <div>
                <p className="text-[18px] font-semibold text-text-primary">Withdrawal Requested!</p>
                <p className="text-[15px] text-text-secondary mt-1 font-normal">Funds sent within 24 hours.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[14px] text-text-secondary font-normal">Method</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['upi','giftcard'] as const).map(m=>(
                    <button key={m} onClick={()=>setMethod(m)}
                      className={cn('py-3.5 rounded-[12px] text-[15px] font-medium transition-all active:opacity-60',
                        method===m ? 'bg-brand-primary text-white':'bg-app-elevated text-text-secondary')}>
                      {m==='upi'?'UPI Transfer':'Google Play'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[14px] text-text-secondary font-normal">Amount (Min ₹50)</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-text-muted">₹</span>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"
                    className="w-full bg-app-fill rounded-[12px] py-3 pl-9 pr-4 text-[20px] font-semibold focus:bg-app-elevated text-text-primary outline-none tabular"/>
                </div>
                <p className="text-[13px] text-text-muted font-normal">Available: ₹{user?.coins||0}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[14px] text-text-secondary font-normal">{method==='upi'?'UPI ID':'Email'}</p>
                <input type="text" value={details} onChange={e=>setDetails(e.target.value)}
                  placeholder={method==='upi'?'example@upi':'your@email.com'} className={inputCls}/>
              </div>
              <div className="flex items-start gap-3 p-3.5 bg-brand-warning/8 rounded-[12px]">
                <AlertCircle size={16} className="text-brand-warning shrink-0 mt-0.5"/>
                <p className="text-[13px] text-brand-warning/80 leading-relaxed font-normal">
                  Withdrawals are processed manually and may take up to 24 hours.
                </p>
              </div>
              <Button onClick={handleWithdraw} fullWidth size="lg">Withdraw Now</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
