import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-app-elevated';

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-app-elevated text-text-secondary active:opacity-60 transition-opacity">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[360px] space-y-8"
        >
          {!sent ? (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="w-[72px] h-[72px] bg-brand-primary/15 rounded-[22px] flex items-center justify-center">
                  <Mail size={32} className="text-brand-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-[26px] font-bold text-text-primary tracking-[-0.6px]">Forgot Password?</h1>
                  <p className="text-[15px] text-text-secondary font-normal leading-relaxed">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  className={inputCls}
                />

                {error && (
                  <p className="text-[14px] text-brand-live font-normal px-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-4 bg-brand-primary rounded-[14px] text-white text-[17px] font-semibold transition-opacity active:opacity-75 disabled:opacity-40 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-[15px] text-text-secondary">
                Remember your password?{' '}
                <Link to="/login" className="text-brand-primary font-medium">Sign In</Link>
              </p>
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
                <h2 className="text-[24px] font-bold text-text-primary tracking-[-0.5px]">Check Your Email</h2>
                <p className="text-[15px] text-text-secondary font-normal leading-relaxed">
                  We sent a password reset link to<br />
                  <span className="text-text-primary font-medium">{email}</span>
                </p>
              </div>
              <p className="text-[14px] text-text-muted font-normal">
                Didn't receive it?{' '}
                <button onClick={() => setSent(false)} className="text-brand-primary font-medium">Try again</button>
              </p>
              <Link to="/login"
                className="w-full py-4 bg-app-elevated rounded-[14px] text-text-primary text-[17px] font-semibold text-center active:opacity-75 transition-opacity border border-app-border block">
                Back to Sign In
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
