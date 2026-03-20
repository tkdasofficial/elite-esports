import { ArrowLeft, Zap, Trophy, Users, Shield, Star, Globe } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '@/src/components/common/Logo';

const STATS = [
  { value: '50K+', label: 'Players' },
  { value: '₹10L+', label: 'Prizes Paid' },
  { value: '1,200+', label: 'Tournaments' },
  { value: '99.9%', label: 'Uptime' },
];

const FEATURES = [
  { icon: Trophy, label: 'Fair Competition', desc: 'Transparent match rules and real-time results verified by our team.', color: 'bg-brand-warning/15 text-brand-warning' },
  { icon: Shield, label: 'Anti-Cheat System', desc: 'Advanced detection to ensure a level playing field for all participants.', color: 'bg-brand-success/15 text-brand-success' },
  { icon: Zap, label: 'Instant Payouts', desc: 'Prize money processed quickly with multiple payout methods available.', color: 'bg-brand-primary/15 text-brand-primary' },
  { icon: Users, label: 'Thriving Community', desc: 'Join thousands of players competing across your favourite mobile games.', color: 'bg-brand-cyan/15 text-brand-cyan' },
];

const TEAM = [
  { name: 'Arjun Sharma', role: 'CEO & Co-Founder', avatar: 'AS' },
  { name: 'Priya Patel', role: 'CTO & Co-Founder', avatar: 'PP' },
  { name: 'Rahul Verma', role: 'Head of Esports', avatar: 'RV' },
  { name: 'Ananya Singh', role: 'Community Manager', avatar: 'AS' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-brand-primary active:opacity-60 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">About</h1>
      </header>

      <div className="flex-1 scrollable-content pb-10">
        <div className="relative bg-gradient-to-br from-brand-primary/20 via-brand-primary/8 to-transparent px-4 pt-10 pb-8 flex flex-col items-center gap-4 text-center">
          <div className="w-[80px] h-[80px] bg-brand-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-brand-primary/40">
            <Logo size={48} />
          </div>
          <div className="space-y-1">
            <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.7px]">Elite Esports</h1>
            <p className="text-[15px] text-text-secondary font-normal">The world's premier mobile gaming tournament platform</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/15 rounded-full">
            <Star size={12} className="text-brand-primary fill-brand-primary" />
            <span className="text-[13px] font-medium text-brand-primary">Version 1.0.4 · Build 2026.03.20</span>
          </div>
        </div>

        <div className="px-4 py-6 space-y-7">
          <section className="space-y-3">
            <p className="ios-section-header">Our Mission</p>
            <div className="bg-app-card rounded-[16px] p-4">
              <p className="text-[15px] text-text-secondary font-normal leading-relaxed">
                Elite Esports was founded in 2024 with a single mission: to make competitive gaming accessible and rewarding for everyone. We believe every skilled player deserves a fair platform to showcase their talent and compete for real prizes — regardless of their background.
              </p>
              <p className="text-[15px] text-text-secondary font-normal leading-relaxed mt-3">
                We support BGMI, Valorant, Free Fire, COD Mobile, and more — with new titles added regularly based on community feedback.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <p className="ios-section-header">Platform Stats</p>
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-app-card rounded-[16px] p-4 text-center">
                  <p className="text-[24px] font-bold text-brand-primary tracking-[-0.5px]">{s.value}</p>
                  <p className="text-[13px] text-text-muted font-normal mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="ios-section-header">Why Elite Esports</p>
            <div className="space-y-2">
              {FEATURES.map((f, i) => (
                <div key={i} className="bg-app-card rounded-[14px] flex items-start gap-3.5 px-4 py-4">
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${f.color}`}>
                    <f.icon size={19} />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-text-primary">{f.label}</p>
                    <p className="text-[13px] text-text-secondary font-normal mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="ios-section-header">Meet the Team</p>
            <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
              {TEAM.map((member, i) => (
                <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white text-[14px] font-bold shrink-0">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="text-[15px] font-normal text-text-primary">{member.name}</p>
                    <p className="text-[13px] text-text-muted font-normal">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="ios-section-header">Legal</p>
            <div className="bg-app-card rounded-[16px] overflow-hidden divide-y divide-app-border">
              <Link to="/terms" className="flex items-center justify-between px-4 py-3.5 active:bg-app-elevated transition-colors">
                <span className="text-[16px] font-normal text-text-primary">Terms & Conditions</span>
                <Globe size={15} className="text-text-muted" />
              </Link>
              <Link to="/privacy-policy" className="flex items-center justify-between px-4 py-3.5 active:bg-app-elevated transition-colors">
                <span className="text-[16px] font-normal text-text-primary">Privacy Policy</span>
                <Shield size={15} className="text-text-muted" />
              </Link>
            </div>
          </section>

          <div className="text-center space-y-1 py-4 opacity-50">
            <p className="text-[12px] text-text-muted font-normal">Elite Esports Platform</p>
            <p className="text-[11px] text-text-muted font-normal">© 2026 Elite Esports. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
