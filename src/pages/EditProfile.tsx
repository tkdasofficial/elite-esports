import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { ChevronLeft, Camera, User, Mail, Phone, AlignLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const { user, updateProfile } = useUserStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: user?.username || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    bio:      user?.bio      || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(form);
    navigate('/profile');
  };

  const inputCls = 'w-full bg-app-elevated border border-app-border rounded-2xl py-3.5 px-4 text-sm font-medium text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition-colors';
  const labelCls = 'flex items-center gap-2 text-xs font-semibold text-text-secondary';

  const fields = [
    { icon: User,       label:'Username',     key:'username', type:'text',  ph:'Enter username' },
    { icon: Mail,       label:'Email',        key:'email',    type:'email', ph:'Enter email' },
    { icon: Phone,      label:'Phone',        key:'phone',    type:'tel',   ph:'Enter phone number' },
  ];

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[60px] px-5 flex items-center gap-3 glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-elevated border border-app-border text-text-secondary active:scale-90 transition-transform">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-[17px] font-bold text-text-primary">Edit Profile</h1>
      </header>

      <div className="flex-1 scrollable-content px-4 py-6 pb-10">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative">
            <div className="p-1 rounded-full bg-app-bg border-4 border-app-bg">
              <LetterAvatar name={form.username} size="xl" className="border-2 border-brand-primary/30" />
            </div>
            <button className="absolute bottom-1 right-0 w-9 h-9 bg-brand-primary rounded-full flex items-center justify-center border-2 border-app-bg text-white shadow-lg active:scale-90 transition-transform">
              <Camera size={15} />
            </button>
          </div>
          <p className="text-xs text-text-muted font-medium">Tap to change photo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className={labelCls}>
                <f.icon size={13} className="text-brand-primary-light" /> {f.label}
              </label>
              <input
                type={f.type}
                value={(form as any)[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.ph}
                className={inputCls}
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className={labelCls}>
              <AlignLeft size={13} className="text-brand-primary-light" /> Bio
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself"
              className={`${inputCls} min-h-[100px] resize-none`}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth size="lg">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
