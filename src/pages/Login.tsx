import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { useUserStore } from '@/src/store/userStore';
import { motion } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useUserStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin login check
    if (email === 'admin' && password === '123') {
      login({
        id: 'admin-001',
        username: 'Admin',
        email: 'admin@elite.com',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
        coins: 999999,
        rank: 'Administrator',
      }, true);
      return;
    }

    // Simulate regular user login
    login({
      id: '1',
      username: email.split('@')[0] || 'EsportsPro',
      email,
      avatar: 'https://picsum.photos/seed/avatar/200',
      coins: 1250,
      rank: 'Diamond',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-brand-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-brand-card border border-white/5 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <Logo size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Elite Esports</h1>
          <p className="text-slate-400 text-sm">Enter your details to start competing</p>
        </div>

        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Username"
              type="text"
              placeholder="admin or name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="text-right">
              <button type="button" className="text-xs text-brand-blue font-medium">Forgot Password?</button>
            </div>
            <Button type="submit" fullWidth size="lg">Sign In</Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-brand-card px-2 text-slate-500">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="text-xs">Google</Button>
            <Button variant="secondary" className="text-xs">Facebook</Button>
          </div>
        </Card>

        <p className="text-center text-sm text-slate-400">
          Don't have an account? <button className="text-brand-blue font-bold">Sign Up</button>
        </p>
      </motion.div>
    </div>
  );
}
