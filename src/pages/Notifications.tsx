import { motion } from 'motion/react';
import { Bell, Trophy, Wallet, User, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const NOTIFICATIONS = [
  {
    id:'1', unread:true,
    title:'Match Starting Soon!',
    message:'Pro League Finals starts in 15 minutes. Get ready to compete!',
    time:'10m ago', icon:Trophy,
    iconColor:'text-brand-warning', iconBg:'bg-brand-warning/15',
  },
  {
    id:'2', unread:true,
    title:'₹500 Added to Wallet',
    message:'Your deposit has been successfully verified and credited to your account.',
    time:'2h ago', icon:Wallet,
    iconColor:'text-brand-success', iconBg:'bg-brand-success/15',
  },
  {
    id:'3', unread:false,
    title:'Account Verified',
    message:'Your account has been successfully verified by our team. You\'re all set!',
    time:'1d ago', icon:User,
    iconColor:'text-brand-primary-light', iconBg:'bg-brand-primary/15',
  },
  {
    id:'4', unread:false,
    title:'Tournament Results Available',
    message:'BGMI Solo Championship results are now available. Check your placement.',
    time:'2d ago', icon:Trophy,
    iconColor:'text-brand-warning', iconBg:'bg-brand-warning/15',
  },
  {
    id:'5', unread:false,
    title:'New Tournament Available',
    message:'Free Fire Max Cup has just opened registration. Only 20 slots remaining.',
    time:'3d ago', icon:Bell,
    iconColor:'text-brand-cyan', iconBg:'bg-brand-cyan/15',
  },
];

export default function Notifications() {
  const unread = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/" className="text-[17px] text-brand-primary font-normal mr-auto">‹ Back</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Notifications</h1>
        {unread > 0 && (
          <button className="ml-auto flex items-center gap-1.5 text-[15px] text-brand-primary font-normal">
            <CheckCheck size={15} /> Mark all
          </button>
        )}
      </header>

      <div className="flex-1 scrollable-content">
        {/* Unread */}
        {NOTIFICATIONS.some(n => n.unread) && (
          <div className="pt-5 px-4 pb-2 space-y-2">
            <p className="ios-section-header">New</p>
            <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
              {NOTIFICATIONS.filter(n => n.unread).map((n, i) => (
                <motion.div key={n.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
                  className="flex gap-3.5 px-4 py-4 active:bg-app-elevated transition-colors">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${n.iconBg}`}>
                    <n.icon size={20} className={n.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-semibold text-text-primary leading-snug">{n.title}</p>
                      <span className="text-[12px] text-text-muted font-normal shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[14px] text-text-secondary font-normal leading-relaxed line-clamp-2">{n.message}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-2" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Earlier */}
        <div className="pt-5 px-4 pb-8 space-y-2">
          <p className="ios-section-header">Earlier</p>
          <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
            {NOTIFICATIONS.filter(n => !n.unread).map((n, i) => (
              <motion.div key={n.id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: (i+2)*0.07 }}
                className="flex gap-3.5 px-4 py-4 active:bg-app-elevated transition-colors">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${n.iconBg} opacity-60`}>
                  <n.icon size={20} className={n.iconColor} />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[15px] font-normal text-text-secondary leading-snug">{n.title}</p>
                    <span className="text-[12px] text-text-muted font-normal shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[14px] text-text-muted font-normal leading-relaxed line-clamp-2">{n.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
