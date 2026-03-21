import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';
import { Eye, EyeOff } from 'lucide-react';
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox.');
      } else if (signInError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(signInError.message);
      }
    }
  };

  const handleGoogle = async () => {
    setSocialLoading('google');
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setSocialLoading(null);
    }
  };

  const handleApple = async () => {
    setSocialLoading('apple');
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setSocialLoading(null);
    }
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-app-elevated';

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[360px] space-y-7"
        >
          {/* Logo & Title */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-brand-primary rounded-[22px] flex items-center justify-center shadow-xl shadow-brand-primary/30">
              <Logo size={44} />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.7px]">Welcome Back</h1>
              <p className="text-[15px] text-text-secondary font-normal">Sign in to Elite Esports</p>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoogle}
              disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white rounded-[14px] text-[15px] font-semibold text-gray-800 transition-opacity active:opacity-75 disabled:opacity-50 shadow-sm"
            >
              {socialLoading === 'google' ? (
                <span className="w-[18px] h-[18px] border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <button
              onClick={handleApple}
              disabled={!!socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#1C1C1E] border border-white/10 rounded-[14px] text-[15px] font-semibold text-white transition-opacity active:opacity-75 disabled:opacity-50"
            >
              {socialLoading === 'apple' ? (
                <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <AppleIcon />
              )}
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[13px] text-text-muted font-normal">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
              className={inputCls}
            />
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                className={`${inputCls} pr-12`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted active:opacity-50">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-[14px] text-brand-live font-normal px-1">{error}</p>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[14px] text-brand-primary font-normal">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !!socialLoading}
              className="w-full py-4 bg-brand-primary rounded-[14px] text-white text-[17px] font-semibold transition-opacity active:opacity-75 disabled:opacity-40 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[15px] text-text-secondary">
            New to Elite?{' '}
            <Link to="/signup" className="text-brand-primary font-medium">Create Account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
