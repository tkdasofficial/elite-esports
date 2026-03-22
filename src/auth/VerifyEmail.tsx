import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

export default function VerifyEmail() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const email     = (location.state as any)?.email ?? '';
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [error, setError]         = useState('');

  const handleResend = async () => {
    if (!email) return;
    setResending(true); setError('');
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setResending(false);
    if (err) { setError(err.message); }
    else { setResent(true); setTimeout(() => setResent(false), 5000); }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col select-none">
      {/* Nav */}
      <div className="h-[52px] px-2 flex items-center flex-shrink-0">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-0.5 text-brand-primary text-[17px] font-normal h-11 px-2 active:opacity-50 transition-opacity"
        >
          <ChevronLeft size={22} strokeWidth={2.2} />
          Back
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[360px] flex flex-col items-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative mb-8"
          >
            <div className="w-[96px] h-[96px] bg-brand-primary/12 rounded-[28px] flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            {/* Badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-[30px] h-[30px] bg-brand-success rounded-full flex items-center justify-center border-[2.5px] border-app-bg shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.7px] mb-2 text-center">
            Check Your Email
          </h1>
          <p className="text-[15px] text-text-secondary text-center leading-relaxed mb-1">
            We sent a verification link to
          </p>
          {email && (
            <p className="text-[15px] font-semibold text-text-primary text-center mb-7">
              {email}
            </p>
          )}

          {/* Steps card */}
          <div className="w-full bg-app-surface rounded-[16px] overflow-hidden divide-y divide-[rgba(84,84,88,0.36)] mb-7">
            {[
              { n: '1', label: 'Open your email inbox' },
              { n: '2', label: 'Find the email from Elite Esports' },
              { n: '3', label: 'Tap "Verify Email" to activate' },
            ].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3.5 px-4 h-[52px]">
                <div className="w-[26px] h-[26px] rounded-full bg-brand-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[12px] font-bold text-brand-primary">{n}</span>
                </div>
                <p className="text-[15px] text-text-secondary">{label}</p>
              </div>
            ))}
          </div>

          {/* Inline feedback */}
          <AnimatePresence>
            {resent && (
              <motion.p
                key="resent"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[13px] text-brand-success mb-3"
              >
                Verification email resent!
              </motion.p>
            )}
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[13px] text-brand-live mb-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="flex items-center gap-2 text-[15px] text-brand-primary font-medium mb-7 active:opacity-60 transition-opacity disabled:opacity-40"
          >
            {resending && (
              <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
            )}
            {resending ? 'Resending…' : "Didn't receive it? Resend"}
          </button>

          {/* Back to sign in */}
          <Link
            to="/login"
            className="w-full h-[54px] bg-app-elevated border border-white/[0.08] rounded-[14px] flex items-center justify-center text-[17px] font-semibold text-text-primary active:scale-[0.98] transition-transform"
          >
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
