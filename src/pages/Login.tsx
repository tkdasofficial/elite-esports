import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { motion } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    if (email === 'admin' && password === '123') {
      login({ id:'admin-001', username:'Admin', email:'admin@elite.com', avatar:'', coins:999999, rank:'Administrator' }, true);
    } else if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      setLoading(false);
      return;
    } else {
      login({ id:'1', username: email.split('@')[0] || 'EsportsPro', email, avatar:'', coins:1250, rank:'Diamond' });
    }
    setLoading(false);
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-app-elevated';

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[360px] space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] bg-brand-primary rounded-[22px] flex items-center justify-center shadow-xl shadow-brand-primary/30">
              <Logo size={44} />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.7px]">Elite Esports</h1>
              <p className="text-[15px] text-text-secondary font-normal">The world's premier gaming platform</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2.5">
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email or Username"
                required
                className={inputCls}
              />
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className={`${inputCls} pr-12`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted active:opacity-50">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[14px] text-brand-live font-normal px-1">{error}</p>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[15px] text-brand-primary font-normal">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-primary rounded-[14px] text-white text-[17px] font-semibold transition-opacity active:opacity-75 disabled:opacity-40 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-app-border" />
            <span className="text-[13px] text-text-muted font-medium">or continue with</span>
            <div className="flex-1 h-px bg-app-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['Google', 'Apple'].map(p => (
              <button key={p}
                className="py-3 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-primary active:opacity-60 transition-opacity border border-app-border">
                {p}
              </button>
            ))}
          </div>

          <p className="text-center text-[15px] text-text-secondary">
            New to Elite?{' '}
            <Link to="/signup" className="text-brand-primary font-medium">Create Account</Link>
          </p>
        </motion.div>
      </div>

      <p className="text-center text-[12px] text-text-muted pb-8 font-medium">
        Use <span className="text-text-secondary">admin / 123</span> for admin access
      </p>
    </div>
  );
}
