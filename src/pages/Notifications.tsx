import { Card } from '@/src/components/ui/Card';
import { motion } from 'motion/react';
import { Bell, Trophy, Wallet, User, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const notifications = [
    { id: '1', type: 'match', title: 'Match Starting Soon!', message: 'Pro League Finals starts in 15 minutes. Get ready!', time: '10m ago', icon: Trophy, color: 'text-brand-yellow' },
    { id: '2', type: 'wallet', title: 'Coins Added', message: '₹500 has been successfully added to your wallet.', time: '2h ago', icon: Wallet, color: 'text-brand-green' },
    { id: '3', type: 'system', title: 'Profile Verified', message: 'Your account has been successfully verified.', time: '1d ago', icon: User, color: 'text-brand-blue' },
  ];

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 px-6 flex items-center gap-4 bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Notifications</h1>
      </header>

      <div className="flex-1 scrollable-content p-6 space-y-4">
        {notifications.map((notif, index) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-5 flex gap-5 bg-brand-card/40 border-none shadow-lg">
              <div className={`p-3 rounded-2xl bg-white/5 ${notif.color} h-fit`}>
                <notif.icon size={24} />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black tracking-tight">{notif.title}</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{notif.message}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

