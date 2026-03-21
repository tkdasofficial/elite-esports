import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as any)?.email ?? '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError('');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <div className="px-4 pt-4">
        <button onClick={() => navigate('/login')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-app-elevated text-text-secondary active:opacity-60 transition-opacity">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[360px] flex flex-col items-center gap-8 text-center"
        >
          {/* Animated envelope icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            <div className="w-[100px] h-[100px] bg-brand-primary/15 rounded-[30px] flex items-center justify-center">
              <Mail size={48} className="text-brand-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-success rounded-full flex items-center justify-center border-2 border-app-bg">
              <CheckCircle2 size={16} className="text-white" />
            </div>
          </motion.div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-[26px] font-bold text-text-primary tracking-[-0.6px]">
              Check Your Email
            </h1>
            <p className="text-[15px] text-text-secondary font-normal leading-relaxed">
              We sent a verification link to
            </p>
            {email && (
              <p className="text-[16px] font-semibold text-text-primary bg-app-elevated rounded-[12px] px-4 py-2.5 border border-white/6">
                {email}
              </p>
            )}
            <p className="text-[14px] text-text-muted font-normal leading-relaxed">
              Click the link in your email to activate your account. It may take a minute or two.
            </p>
          </div>

          {/* Steps */}
          <div className="w-full bg-app-elevated rounded-[16px] p-4 space-y-3 text-left border border-white/6">
            {[
              { step: '1', text: 'Open your email inbox' },
              { step: '2', text: 'Find the email from Elite Esports' },
              { step: '3', text: 'Click "Verify Email" to activate' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[12px] font-bold text-brand-primary">{step}</span>
                </div>
                <p className="text-[14px] text-text-secondary">{text}</p>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[14px] text-brand-live font-normal">{error}</p>
          )}

          {resent && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[14px] text-brand-success font-normal"
            >
              Verification email resent successfully!
            </motion.p>
          )}

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="flex items-center gap-2 text-[15px] text-brand-primary font-medium active:opacity-60 transition-opacity disabled:opacity-40"
          >
            {resending ? (
              <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {resending ? 'Resending…' : "Didn't receive it? Resend"}
          </button>

          <Link to="/login"
            className="w-full py-4 bg-app-elevated rounded-[14px] text-text-primary text-[16px] font-semibold text-center active:opacity-75 transition-opacity border border-white/8 block">
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
