import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { motion } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    if (email === 'admin' && password === '123') {
      login({
        id: 'admin-001', username: 'Admin',
        email: 'admin@elite.com',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
        coins: 999999, rank: 'Administrator',
      }, true);
    } else {
      login({
        id: '1',
        username: email.split('@')[0] || 'EsportsPro',
        email,
        avatar: 'https://picsum.photos/seed/avatar/200',
        coins: 1250, rank: 'Diamond',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-app-bg overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-brand-primary/8 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-brand-cyan/6 blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0, 0.67, 0] }}
          className="w-full max-w-[360px] space-y-8"
        >
          {/* Brand */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-[68px] h-[68px] bg-app-elevated rounded-[22px] border border-app-border flex items-center justify-center shadow-2xl">
                <Logo size={42} />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Elite Esports</h1>
              <p className="text-sm text-text-muted font-medium">Sign in to start competing</p>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-app-card border border-app-border rounded-2xl p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary tracking-wide">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin or name@example.com"
                    required
                    className="w-full bg-app-elevated border border-app-border rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-app-elevated border border-app-border rounded-xl py-3 pl-10 pr-11 text-sm font-medium text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold text-brand-primary-light hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-light text-white text-sm font-bold rounded-xl shadow-lg shadow-brand-primary/30 transition-all active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-app-border" />
              <span className="text-xs font-medium text-text-muted">or</span>
              <div className="flex-1 h-px bg-app-border" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              {['Google', 'Facebook'].map((p) => (
                <button
                  key={p}
                  className="py-2.5 bg-app-elevated border border-app-border rounded-xl text-xs font-semibold text-text-secondary hover:border-brand-primary/40 hover:text-text-primary transition-all active:scale-95"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-text-muted font-medium">
            Don't have an account?{' '}
            <button className="text-brand-primary-light font-semibold hover:underline">
              Sign Up
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
