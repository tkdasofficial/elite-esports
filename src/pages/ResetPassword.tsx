import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

const Spinner = () => (
  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
);

export default function ResetPassword() {
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { /* ready */ }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) setError(err.message);
    else setDone(true);
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col select-none">
      {/* Nav */}
      <div className="h-[52px] px-2 flex items-center flex-shrink-0">
        <AnimatePresence>
          {!done && (
            <motion.button
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => navigate('/login')}
              className="flex items-center gap-0.5 text-brand-primary text-[17px] font-normal h-11 px-2 active:opacity-50 transition-opacity"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
              Back
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-[360px]"
            >
              {/* Icon */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-[80px] h-[80px] bg-brand-primary/12 rounded-[24px] flex items-center justify-center mb-5">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.7px] mb-1.5 text-center">
                  New Password
                </h1>
                <p className="text-[15px] text-text-secondary text-center">
                  Must be at least 6 characters
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Grouped inputs */}
                <div className="bg-app-surface rounded-[14px] overflow-hidden divide-y divide-[rgba(84,84,88,0.36)]">
                  <div className="flex items-center h-[52px] px-4 gap-2">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="New Password"
                      autoComplete="new-password"
                      autoFocus
                      required
                      className="flex-1 bg-transparent text-[17px] text-text-primary placeholder:text-text-muted outline-none"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="p-1 text-text-muted active:opacity-50 flex-shrink-0">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center h-[52px] px-4 gap-2">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      required
                      className="flex-1 bg-transparent text-[17px] text-text-primary placeholder:text-text-muted outline-none"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="p-1 text-text-muted active:opacity-50 flex-shrink-0">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[13px] text-brand-live px-1"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[54px] bg-brand-primary rounded-[14px] flex items-center justify-center gap-2 text-white text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-brand-primary/30"
                >
                  {loading ? <><Spinner /> Updating…</> : 'Reset Password'}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-full max-w-[360px] flex flex-col items-center text-center"
            >
              {/* Success */}
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-[100px] h-[100px] bg-brand-success/12 rounded-full flex items-center justify-center mb-7"
              >
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </motion.div>

              <h2 className="text-[28px] font-bold text-text-primary tracking-[-0.7px] mb-2">
                Password Updated!
              </h2>
              <p className="text-[15px] text-text-secondary leading-relaxed mb-10">
                Your password has been reset successfully.
              </p>

              <Link
                to="/login"
                className="w-full h-[54px] bg-brand-primary rounded-[14px] flex items-center justify-center text-white text-[17px] font-semibold active:scale-[0.98] transition-transform shadow-lg shadow-brand-primary/30"
              >
                Sign In Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
