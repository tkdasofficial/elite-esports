import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/store/authStore';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { Logo } from '@/src/components/common/Logo';
import { User, AtSign, Phone, FileText, ChevronRight } from 'lucide-react';

const Spinner = () => (
  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
);

interface Field {
  key: 'name' | 'username' | 'phone' | 'bio';
  label: string;
  placeholder: string;
  type: string;
  icon: React.ReactNode;
  multiline?: boolean;
  required?: boolean;
}

const FIELDS: Field[] = [
  { key: 'name',     label: 'Full Name',    placeholder: 'Your full name',      type: 'text', icon: <User size={17} />,     required: true },
  { key: 'username', label: 'Username',     placeholder: 'Choose a username',   type: 'text', icon: <AtSign size={17} />,   required: true },
  { key: 'phone',    label: 'Phone Number', placeholder: 'Optional',            type: 'tel',  icon: <Phone size={17} /> },
  { key: 'bio',      label: 'Bio',          placeholder: 'Tell us about yourself…', type: 'text', icon: <FileText size={17} />, multiline: true },
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { login, setProfileSetupComplete } = useUserStore();
  const { session } = useAuthStore();

  const [form, setForm] = useState({ name: '', username: '', phone: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Full name is required.'); return; }
    if (!form.username.trim()) { setError('Username is required.'); return; }
    if (form.username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (/\s/.test(form.username.trim())) { setError('Username cannot contain spaces.'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    login({
      id: session?.user?.id ?? '',
      username: form.username.trim().toLowerCase(),
      email: session?.user?.email ?? '',
      avatar: '',
      coins: 0,
      rank: 'Bronze',
      bio: form.bio.trim(),
      phone: form.phone.trim(),
    });

    setProfileSetupComplete(true);
    setLoading(false);
    navigate('/', { replace: true });
  };

  const displayName = form.name || form.username || 'You';

  return (
    <div className="min-h-screen bg-app-bg flex flex-col select-none">
      {/* Header */}
      <div className="h-[52px] px-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-primary rounded-[8px] flex items-center justify-center">
            <Logo size={16} />
          </div>
          <span className="text-[15px] font-semibold text-text-primary">Elite Esports</span>
        </div>
        <button
          onClick={() => { setProfileSetupComplete(true); navigate('/', { replace: true }); }}
          className="text-[15px] text-text-muted active:opacity-50 transition-opacity flex items-center gap-0.5"
        >
          Skip <ChevronRight size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 sm:px-8 overflow-y-auto scrollable-content pb-10">
        <div className="w-full max-w-md mx-auto">

          {/* Avatar & intro */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center pt-6 pb-8 gap-3"
          >
            <div className="relative">
              <LetterAvatar name={displayName} size="xl" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center shadow-md shadow-brand-primary/40">
                <User size={14} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-[26px] sm:text-[30px] font-bold text-text-primary tracking-[-0.6px]">Set Up Profile</h1>
              <p className="text-[14px] sm:text-[15px] text-text-secondary mt-1">Tell us a bit about yourself to get started</p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-3"
          >
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-[12px] font-medium text-text-secondary uppercase tracking-wider px-1 flex items-center gap-1.5">
                  <span className="text-text-muted">{field.icon}</span>
                  {field.label}
                  {field.required && <span className="text-brand-live">*</span>}
                </label>
                {field.multiline ? (
                  <textarea
                    value={form[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full bg-app-surface border border-app-border rounded-[14px] py-3.5 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary/50 transition-colors resize-none"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => {
                      let val = e.target.value;
                      if (field.key === 'username') val = val.replace(/\s/g, '').toLowerCase();
                      setForm(f => ({ ...f, [field.key]: val }));
                    }}
                    placeholder={field.placeholder}
                    autoComplete={field.key === 'phone' ? 'tel' : field.key === 'name' ? 'name' : 'off'}
                    className="w-full bg-app-surface border border-app-border rounded-[14px] py-3.5 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary/50 transition-colors"
                  />
                )}
              </div>
            ))}

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] text-brand-live px-1"
              >
                {error}
              </motion.p>
            )}

            {/* Step hint */}
            <p className="text-[12px] text-text-muted px-1 pt-1">
              Fields marked <span className="text-brand-live">*</span> are required. You can update your profile anytime from Settings.
            </p>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[54px] bg-brand-primary rounded-[14px] flex items-center justify-center gap-2 text-white text-[17px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg shadow-brand-primary/30"
              >
                {loading ? <><Spinner /> Saving…</> : 'Continue to Elite'}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
