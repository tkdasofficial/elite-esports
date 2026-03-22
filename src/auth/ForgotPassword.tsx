import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

const Spinner = () => (
  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
);

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col select-none">
      {/* Nav */}
      <div className="h-[52px] px-2 flex items-center flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-0.5 text-brand-primary text-[17px] font-normal h-11 px-2 active:opacity-50 transition-opacity"
        >
          <ChevronLeft size={22} strokeWidth={2.2} />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <AnimatePresence mode="wait">
          {!sent ? (
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
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="3"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.7px] mb-1.5 text-center">
                  Forgot Password?
                </h1>
                <p className="text-[15px] text-text-secondary text-center leading-relaxed max-w-[280px]">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="bg-app-surface rounded-[14px] overflow-hidden">
                  <div className="flex items-center h-[52px] px-4">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Email address"
                      autoComplete="email"
                      autoFocus
                      required
                      className="flex-1 bg-transparent text-[17px] text-text-primary placeholder:text-text-muted outline-none"
                    />
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
                  disabled={loading || !email.trim()}
                  className="w-full h-[54px] bg-brand-primary rounded-[14px] flex items-center justify-center gap-2 text-white text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-brand-primary/30"
                >
                  {loading ? <><Spinner /> Sending…</> : 'Send Reset Link'}
                </button>

                <p className="text-center text-[14px] text-text-muted pt-1">
                  Remembered it?{' '}
                  <Link to="/login" className="text-brand-primary font-medium">Sign In</Link>
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-full max-w-[360px] flex flex-col items-center text-center"
            >
              {/* Success icon */}
              <div className="w-[96px] h-[96px] bg-brand-success/12 rounded-full flex items-center justify-center mb-7">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>

              <h2 className="text-[28px] font-bold text-text-primary tracking-[-0.7px] mb-2">
                Email Sent
              </h2>
              <p className="text-[15px] text-text-secondary leading-relaxed mb-1">
                We sent a reset link to
              </p>
              <p className="text-[15px] font-semibold text-text-primary mb-8">{email}</p>

              <div className="w-full space-y-3">
                <p className="text-[13px] text-text-muted">
                  Didn't get it?{' '}
                  <button onClick={() => setSent(false)} className="text-brand-primary font-medium active:opacity-60">
                    Try again
                  </button>
                </p>

                <Link
                  to="/login"
                  className="block w-full h-[54px] bg-brand-primary rounded-[14px] flex items-center justify-center text-white text-[17px] font-semibold active:scale-[0.98] transition-transform shadow-lg shadow-brand-primary/30"
                >
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
