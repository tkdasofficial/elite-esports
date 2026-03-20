import { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, Trophy, Gamepad2, X, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import { Tag } from '@/src/components/ui/Tag';

export default function Wallet() {
  const { user, transactions, addTransaction } = useUserStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1);
  const [utr, setUtr] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'giftcard'>('upi');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const ADMIN_UPI = "admin@upi";

  const handleAddCash = () => {
    const numAmount = Number(amount);
    if (numAmount < 10) return alert("Minimum deposit is ₹10");
    setStep(2);
  };

  const submitDeposit = () => {
    if (!utr) return alert("Please enter Transaction ID (UTR)");
    addTransaction({
      type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      method: 'upi',
      details: utr,
      title: 'Deposit Request'
    });
    setStatus('success');
    setTimeout(() => {
      setShowAddModal(false);
      setStep(1);
      setAmount('');
      setUtr('');
      setStatus('idle');
    }, 2000);
  };

  const handleWithdraw = () => {
    const numAmount = Number(amount);
    if (numAmount < 50) return alert("Minimum withdrawal is ₹50");
    if (numAmount > (user?.coins || 0)) return alert("Insufficient balance");
    if (!withdrawDetails) return alert(`Please enter ${withdrawMethod === 'upi' ? 'UPI ID' : 'Email Address'}`);

    addTransaction({
      type: 'withdrawal',
      amount: -numAmount,
      status: 'pending',
      method: withdrawMethod,
      details: withdrawDetails,
      title: `${withdrawMethod === 'upi' ? 'UPI' : 'Gift Card'} Withdrawal`
    });
    
    // Deduct coins immediately for withdrawal request
    useUserStore.getState().updateCoins(-numAmount);

    setStatus('success');
    setTimeout(() => {
      setShowWithdrawModal(false);
      setAmount('');
      setWithdrawDetails('');
      setStatus('idle');
    }, 2000);
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(ADMIN_UPI);
    alert("UPI ID Copied!");
  };

  const depositedAmount = transactions
    .filter(tx => tx.type === 'deposit' && tx.status === 'success')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const winningsAmount = transactions
    .filter(tx => tx.type === 'win' && tx.status === 'success')
    .reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="px-6 space-y-8 pb-24">
      {/* Balance Card */}
      <section className="pt-4">
        <div className="relative h-56 rounded-[32px] overflow-hidden bg-gradient-to-br from-brand-blue to-indigo-600 p-8 flex flex-col justify-between shadow-2xl shadow-brand-blue/30">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Balance</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">₹{user?.coins || 0}.00</h2>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Deposited</p>
              <p className="text-sm font-black text-white">₹{depositedAmount}</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">Winnings</p>
              <p className="text-sm font-black text-white">₹{winningsAmount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-blue text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" /> Add Cash
        </button>
        <button 
          onClick={() => setShowWithdrawModal(true)}
          className="bg-brand-card text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <ArrowUpRight className="w-5 h-5" /> Withdraw
        </button>
      </section>

      {/* Transactions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Recent Transactions</h3>
          <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest">View All</button>
        </div>

        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 flex items-center justify-between bg-brand-card/40 border-none shadow-lg">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    tx.amount > 0 ? "bg-brand-green/10 text-brand-green" : "bg-brand-red/10 text-brand-red"
                  )}>
                    {tx.type === 'deposit' ? <Plus className="w-5 h-5" /> : 
                     tx.type === 'win' ? <Trophy className="w-5 h-5" /> : 
                     tx.type === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> : <Gamepad2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight capitalize">{tx.title || (tx.type === 'deposit' ? 'Added to Wallet' : 'Withdrawal')}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-black tracking-tighter",
                    tx.amount > 0 ? "text-brand-green" : "text-white"
                  )}>{tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}</p>
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    tx.status === 'success' ? "text-brand-green/60" : 
                    tx.status === 'pending' ? "text-brand-yellow/60" : "text-brand-red/60"
                  )}>{tx.status}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Add Cash Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-brand-card rounded-[32px] p-6 sm:p-8 space-y-6 border border-white/5 max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl"
            >
              <div className="flex justify-between items-center sticky top-0 bg-brand-card z-10 pb-4">
                <h3 className="text-xl font-black tracking-tighter">Add Cash</h3>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {status === 'success' ? (
                <div className="py-12 flex flex-col items-center space-y-4 text-center">
                  <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black tracking-tighter">Request Submitted</h4>
                    <p className="text-sm text-slate-400 font-bold">Admin will verify and add funds shortly.</p>
                  </div>
                </div>
              ) : step === 1 ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enter Amount (Min ₹10)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black">₹</span>
                      <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-xl font-black focus:border-brand-blue outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[50, 100, 500].map(val => (
                      <button 
                        key={val}
                        onClick={() => setAmount(val.toString())}
                        className="bg-white/5 py-3 rounded-xl font-black text-xs hover:bg-white/10 transition-colors"
                      >
                        +₹{val}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleAddCash} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-br from-brand-blue/20 to-indigo-600/20 rounded-2xl border border-brand-blue/20 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">Pay to UPI ID</p>
                        <p className="text-lg font-black tracking-tight text-white">{ADMIN_UPI}</p>
                      </div>
                      <button 
                        onClick={copyUpi} 
                        className="p-3 bg-brand-blue text-white rounded-xl shadow-lg shadow-brand-blue/30 active:scale-90 transition-transform"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Instructions</p>
                      <div className="space-y-2">
                        {[
                          "Copy the UPI ID above",
                          "Pay ₹" + amount + " using any UPI app",
                          "Copy the 12-digit UTR/Ref No."
                        ].map((text, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-brand-blue/20 flex items-center justify-center text-[8px] font-black text-brand-blue">
                              {i + 1}
                            </div>
                            <p className="text-[10px] font-bold text-slate-300">{text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction ID (UTR)</label>
                    <input 
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter 12-digit ID"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-black focus:border-brand-blue outline-none transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button onClick={submitDeposit} className="flex-[2]">Submit Request</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-brand-card rounded-[32px] p-6 sm:p-8 space-y-6 border border-white/5 max-h-[90vh] overflow-y-auto scrollbar-hide shadow-2xl"
            >
              <div className="flex justify-between items-center sticky top-0 bg-brand-card z-10 pb-4">
                <h3 className="text-xl font-black tracking-tighter">Withdraw Funds</h3>
                <button 
                  onClick={() => setShowWithdrawModal(false)} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {status === 'success' ? (
                <div className="py-12 flex flex-col items-center space-y-4 text-center">
                  <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-brand-green" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black tracking-tighter">Withdrawal Requested</h4>
                    <p className="text-sm text-slate-400 font-bold">Funds will be sent to your account within 24 hours.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Withdrawal Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setWithdrawMethod('upi')}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                          withdrawMethod === 'upi' ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/20" : "bg-white/5 border-white/10 text-slate-400"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          withdrawMethod === 'upi' ? "bg-white/20" : "bg-white/5"
                        )}>
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        UPI Transfer
                      </button>
                      <button 
                        onClick={() => setWithdrawMethod('giftcard')}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                          withdrawMethod === 'giftcard' ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/20" : "bg-white/5 border-white/10 text-slate-400"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          withdrawMethod === 'giftcard' ? "bg-white/20" : "bg-white/5"
                        )}>
                          <Gamepad2 className="w-5 h-5" />
                        </div>
                        Google Play
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount (Min ₹50)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black">₹</span>
                      <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-xl font-black focus:border-brand-blue outline-none transition-colors"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">Available: ₹{user?.coins || 0}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {withdrawMethod === 'upi' ? 'UPI ID' : 'Email Address'}
                    </label>
                    <input 
                      type="text"
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      placeholder={withdrawMethod === 'upi' ? 'example@upi' : 'your@email.com'}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-black focus:border-brand-blue outline-none transition-colors"
                    />
                  </div>

                  <div className="p-4 bg-brand-yellow/10 rounded-2xl border border-brand-yellow/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-brand-yellow shrink-0" />
                    <p className="text-[10px] font-bold text-brand-yellow/80 leading-relaxed">
                      Withdrawals are processed manually and may take up to 24 hours to reflect in your account.
                    </p>
                  </div>

                  <Button onClick={handleWithdraw} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest">
                    Withdraw Now
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
