import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

export default function ResetPassword() {
  const [form, setForm]         = useState({ password: '', confirm: '' });
  const [showPw, setShowPw]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
    }
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-app-elevated';

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <div className="px-4 pt-4">
        <button onClick={() => navigate('/login')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-app-elevated text-text-secondary active:opacity-60 transition-opacity">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[360px] space-y-8"
        >
          {!done ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="w-[72px] h-[72px] bg-brand-primary/15 rounded-[22px] flex items-center justify-center">
                  <Lock size={32} className="text-brand-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-[26px] font-bold text-text-primary tracking-[-0.6px]">Set New Password</h1>
                  <p className="text-[15px] text-text-secondary font-normal">Must be at least 6 characters long</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2.5">
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="New Password"
                      autoComplete="new-password"
                      required
                      className={`${inputCls} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted active:opacity-50">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={e => setForm({ ...form, confirm: e.target.value })}
                      placeholder="Confirm New Password"
                      autoComplete="new-password"
                      required
                      className={`${inputCls} pr-12`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted active:opacity-50">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-[14px] text-brand-live font-normal px-1">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-brand-primary rounded-[14px] text-white text-[17px] font-semibold transition-opacity active:opacity-75 disabled:opacity-40 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                  ) : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="w-[88px] h-[88px] bg-brand-success/15 rounded-full flex items-center justify-center">
                <CheckCircle2 size={44} className="text-brand-success" />
              </div>
              <div className="space-y-2">
                <h2 className="text-[24px] font-bold text-text-primary tracking-[-0.5px]">Password Updated!</h2>
                <p className="text-[15px] text-text-secondary font-normal">Your password has been successfully reset.</p>
              </div>
              <Link to="/login"
                className="w-full py-4 bg-brand-primary rounded-[14px] text-white text-[17px] font-semibold text-center active:opacity-75 transition-opacity shadow-lg shadow-brand-primary/25 block">
                Sign In Now
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
