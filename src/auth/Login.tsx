import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const Spinner = ({ light = true }) => (
  <span className={`w-[18px] h-[18px] border-2 rounded-full animate-spin flex-shrink-0 ${light ? 'border-white/30 border-t-white' : 'border-gray-300 border-t-gray-700'}`} />
);

export default function Login() {
  const [showEmail, setShowEmail]         = useState(false);
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError]                 = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      if (err.message.includes('Email not confirmed')) setError('Verify your email first — check your inbox.');
      else if (err.message.includes('Invalid login credentials')) setError('Incorrect email or password.');
      else setError(err.message);
    }
  };

  const handleGoogle = async () => {
    setSocialLoading('google'); setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });
    if (err) { setError(err.message); setSocialLoading(null); }
  };

  const handleApple = async () => {
    setSocialLoading('apple'); setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}/` } });
    if (err) { setError(err.message); setSocialLoading(null); }
  };

  const busy = loading || !!socialLoading;

  return (
    <div className="min-h-screen bg-app-bg flex flex-col select-none">
      {/* Safe-area top nav — only visible in email mode */}
      <div className="h-[52px] px-2 flex items-center flex-shrink-0">
        <AnimatePresence>
          {showEmail && (
            <motion.button
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setShowEmail(false); setError(''); setEmail(''); setPassword(''); }}
              className="flex items-center gap-0.5 text-brand-primary text-[17px] font-normal h-11 px-2 active:opacity-50 transition-opacity"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
              Back
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 flex flex-col px-6 overflow-y-auto scrollable-content">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center pt-6 pb-10"
        >
          <div className="w-[64px] h-[64px] bg-brand-primary rounded-[18px] flex items-center justify-center shadow-lg shadow-brand-primary/35 mb-5">
            <Logo size={38} />
          </div>
          <h1 className="text-[30px] font-bold text-text-primary tracking-[-0.8px] mb-1">
            {showEmail ? 'Sign In' : 'Welcome Back'}
          </h1>
          <p className="text-[15px] text-text-secondary">
            {showEmail ? 'Enter your email and password' : 'Sign in to Elite Esports'}
          </p>
        </motion.div>

        {/* Auth area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-3"
        >
          <AnimatePresence mode="wait" initial={false}>
            {!showEmail ? (
              /* ── 3 Method Buttons ── */
              <motion.div
                key="methods"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={busy}
                  className="relative w-full h-[54px] bg-white rounded-[14px] flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm"
                >
                  <span className="absolute left-[18px] flex items-center">
                    {socialLoading === 'google' ? <Spinner light={false} /> : <GoogleIcon />}
                  </span>
                  <span className="text-[16px] font-semibold text-gray-900">Continue with Google</span>
                </button>

                {/* Apple */}
                <button
                  onClick={handleApple}
                  disabled={busy}
                  className="relative w-full h-[54px] bg-[#1C1C1E] border border-white/10 rounded-[14px] flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <span className="absolute left-[18px] flex items-center">
                    {socialLoading === 'apple' ? <Spinner /> : <AppleIcon />}
                  </span>
                  <span className="text-[16px] font-semibold text-white">Continue with Apple</span>
                </button>

                {/* Email */}
                <button
                  onClick={() => setShowEmail(true)}
                  disabled={busy}
                  className="relative w-full h-[54px] bg-app-elevated border border-white/[0.08] rounded-[14px] flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <span className="absolute left-[18px] flex items-center text-text-secondary">
                    <MailIcon />
                  </span>
                  <span className="text-[16px] font-semibold text-text-primary">Continue with Email</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-app-border" />
                  <span className="text-[12px] text-text-muted">or</span>
                  <div className="flex-1 h-px bg-app-border" />
                </div>

                {/* Sign up link as button */}
                <Link
                  to="/signup"
                  className="block w-full h-[54px] bg-app-elevated border border-white/[0.08] rounded-[14px] flex items-center justify-center active:scale-[0.98] transition-transform"
                >
                  <span className="text-[16px] font-medium text-text-secondary">
                    New here? <span className="text-brand-primary font-semibold">Create Account</span>
                  </span>
                </Link>
              </motion.div>
            ) : (
              /* ── Email Form ── */
              <motion.div
                key="email-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  {/* Grouped input card — iOS style */}
                  <div className="bg-app-surface rounded-[14px] overflow-hidden divide-y divide-[rgba(84,84,88,0.36)]">
                    <div className="flex items-center h-[52px] px-4">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        autoComplete="email"
                        autoFocus
                        required
                        className="flex-1 bg-transparent text-[17px] text-text-primary placeholder:text-text-muted outline-none"
                      />
                    </div>
                    <div className="flex items-center h-[52px] px-4 gap-2">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        required
                        className="flex-1 bg-transparent text-[17px] text-text-primary placeholder:text-text-muted outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="p-1 text-text-muted active:opacity-50 flex-shrink-0"
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[13px] text-brand-live px-1"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* Forgot */}
                  <div className="flex justify-end px-1">
                    <Link to="/forgot-password" className="text-[14px] text-brand-primary font-medium active:opacity-60">
                      Forgot Password?
                    </Link>
                  </div>

                  {/* CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[54px] bg-brand-primary rounded-[14px] flex items-center justify-center gap-2 text-white text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-brand-primary/30"
                  >
                    {loading ? <><Spinner /> Signing in…</> : 'Sign In'}
                  </button>

                  <p className="text-center text-[14px] text-text-muted pt-1">
                    No account?{' '}
                    <Link to="/signup" className="text-brand-primary font-medium">Sign Up</Link>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Legal */}
      <p className="text-center text-[12px] text-text-faint px-6 pb-8 pt-4 leading-relaxed flex-shrink-0">
        By continuing you agree to our{' '}
        <Link to="/terms" className="text-text-muted">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy-policy" className="text-text-muted">Privacy Policy</Link>.
      </p>
    </div>
  );
}
