import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { usePlatformStore } from '@/src/store/platformStore';
import { motion } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SignUp() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useUserStore();
  const { registeredUsers, registerUser } = usePlatformStore();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = 'Username is required';
    else if (form.username.length < 3) e.username = 'At least 3 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';

    const emailTaken = registeredUsers.some(
      u => u.email.toLowerCase() === form.email.trim().toLowerCase()
    );
    if (emailTaken) e.email = 'An account with this email already exists';

    const usernameTaken = registeredUsers.some(
      u => u.username.toLowerCase() === form.username.trim().toLowerCase()
    );
    if (usernameTaken) e.username = 'This username is already taken';

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const newUser = {
      id: Date.now().toString(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      avatar: '',
      coins: 0,
      rank: 'Bronze',
      status: 'active' as const,
      joined: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    registerUser(newUser);
    login({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      avatar: '',
      coins: newUser.coins,
      rank: newUser.rank,
    });

    setLoading(false);
  };

  const inputCls = (field: string) =>
    `w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:bg-app-elevated ${errors[field] ? 'ring-1 ring-brand-live' : ''}`;

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
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
              <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.7px]">Create Account</h1>
              <p className="text-[15px] text-text-secondary font-normal">Join the Elite Esports community</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2.5">
              <div className="space-y-1">
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Username"
                  className={inputCls('username')}
                />
                {errors.username && <p className="text-[13px] text-brand-live px-1">{errors.username}</p>}
              </div>

              <div className="space-y-1">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  className={inputCls('email')}
                />
                {errors.email && <p className="text-[13px] text-brand-live px-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
                    className={`${inputCls('password')} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted active:opacity-50">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-[13px] text-brand-live px-1">{errors.password}</p>}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setForm({ ...form, confirm: e.target.value })}
                    placeholder="Confirm Password"
                    className={`${inputCls('confirm')} pr-12`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted active:opacity-50">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm && <p className="text-[13px] text-brand-live px-1">{errors.confirm}</p>}
              </div>
            </div>

            <p className="text-[13px] text-text-muted leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-brand-primary">Terms of Service</Link> and{' '}
              <Link to="/privacy-policy" className="text-brand-primary">Privacy Policy</Link>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-primary rounded-[14px] text-white text-[17px] font-semibold transition-opacity active:opacity-75 disabled:opacity-40 shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account…</>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[15px] text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary font-medium">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
