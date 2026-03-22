import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const Spinner = ({ light = true }) => (
  <span className={`w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0 ${light ? 'border-white/30 border-t-white' : 'border-gray-300 border-t-gray-700'}`} />
);

export default function SignUp() {
  const [showEmail, setShowEmail]         = useState(false);
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError]                 = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (err) {
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        setError('An account with this email already exists.');
      } else {
        setError(err.message);
      }
    } else {
      navigate('/verify-email', { state: { email: email.trim() } });
    }
  };

  const handleGoogle = async () => {
    setSocialLoading('google'); setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });
    if (err) { setError(err.message); setSocialLoading(null); }
  };

  const handleFacebook = async () => {
    setSocialLoading('facebook'); setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: `${window.location.origin}/` } });
    if (err) { setError(err.message); setSocialLoading(null); }
  };

  const busy = loading || !!socialLoading;

  return (
    <div className="min-h-screen bg-app-bg flex flex-col select-none">
      <div className="h-[48px] px-3 flex items-center flex-shrink-0">
        <AnimatePresence>
          {showEmail && (
            <motion.button
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setShowEmail(false); setError(''); setEmail(''); setPassword(''); }}
              className="flex items-center gap-0.5 text-brand-primary text-[15px] font-normal h-9 px-2 active:opacity-50 transition-opacity"
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
              Back
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex flex-col px-5 overflow-y-auto scrollable-content">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center pt-4 pb-8"
        >
          <div className="w-[56px] h-[56px] bg-brand-primary rounded-[16px] flex items-center justify-center shadow-lg shadow-brand-primary/35 mb-4">
            <Logo size={32} />
          </div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-[-0.6px] mb-1">
            {showEmail ? 'Create Account' : 'Join Elite'}
          </h1>
          <p className="text-[14px] text-text-secondary text-center">
            {showEmail ? 'Enter your email and a password' : "The world's premier gaming platform"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-2.5"
        >
          <AnimatePresence mode="wait" initial={false}>
            {!showEmail ? (
              <motion.div
                key="methods"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-2.5"
              >
                <button
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full h-[44px] bg-white rounded-full flex items-center px-4 gap-3 active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm"
                >
                  <span className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {socialLoading === 'google' ? <Spinner light={false} /> : <GoogleIcon />}
                  </span>
                  <span className="flex-1 text-center text-[14px] font-semibold text-gray-900 pr-7">Continue with Google</span>
                </button>

                <button
                  onClick={handleFacebook}
                  disabled={busy}
                  className="w-full h-[44px] bg-[#1877F2] rounded-full flex items-center px-4 gap-3 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <span className="w-7 h-7 rounded-full bg-[#1464D0] flex items-center justify-center text-white flex-shrink-0">
                    {socialLoading === 'facebook' ? <Spinner /> : <FacebookIcon />}
                  </span>
                  <span className="flex-1 text-center text-[14px] font-semibold text-white pr-7">Continue with Facebook</span>
                </button>

                <button
                  onClick={() => setShowEmail(true)}
                  disabled={busy}
                  className="w-full h-[44px] bg-app-elevated border border-white/[0.08] rounded-full flex items-center px-4 gap-3 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <span className="w-7 h-7 rounded-full bg-app-fill flex items-center justify-center text-text-secondary flex-shrink-0">
                    <MailIcon />
                  </span>
                  <span className="flex-1 text-center text-[14px] font-semibold text-text-primary pr-7">Continue with Email</span>
                </button>

                <div className="flex items-center gap-3 py-0.5">
                  <div className="flex-1 h-px bg-app-border" />
                  <span className="text-[11px] text-text-muted">or</span>
                  <div className="flex-1 h-px bg-app-border" />
                </div>

                <Link
                  to="/login"
                  className="flex w-full h-[44px] bg-app-elevated border border-white/[0.08] rounded-full items-center justify-center active:scale-[0.98] transition-transform"
                >
                  <span className="text-[14px] font-medium text-text-secondary">
                    Have an account? <span className="text-brand-primary font-semibold">Sign In</span>
                  </span>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                  <div className="bg-app-surface rounded-[14px] overflow-hidden divide-y divide-[rgba(84,84,88,0.36)]">
                    <div className="flex items-center h-[48px] px-4">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        autoComplete="email"
                        autoFocus
                        required
                        className="flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted outline-none"
                      />
                    </div>
                    <div className="flex items-center h-[48px] px-4 gap-2">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="new-password"
                        required
                        className="flex-1 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="p-1 text-text-muted active:opacity-50 flex-shrink-0"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-text-muted px-1">
                    Minimum 6 characters. Your profile is set up after sign in.
                  </p>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[12px] text-brand-live px-1"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[44px] bg-brand-primary rounded-full flex items-center justify-center gap-2 text-white text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-brand-primary/30"
                  >
                    {loading ? <><Spinner /> Creating Account…</> : 'Create Account'}
                  </button>

                  <p className="text-center text-[13px] text-text-muted pt-1">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-primary font-medium">Sign In</Link>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <p className="text-center text-[11px] text-text-faint px-6 pb-6 pt-4 leading-relaxed flex-shrink-0">
        By continuing you agree to our{' '}
        <Link to="/terms" className="text-text-muted">Terms of Service</Link>
        {' '}and{' '}
        <Link to="/privacy-policy" className="text-text-muted">Privacy Policy</Link>.
      </p>
    </div>
  );
}
