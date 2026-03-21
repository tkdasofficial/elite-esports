import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Button } from '@/src/components/ui/Button';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
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

  const handleSave = () => {
    updateProfile(form);
    navigate('/profile');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const inputCls = 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary placeholder:text-text-muted outline-none focus:bg-app-elevated transition-colors';

  const FIELDS = [
    { label:'Username', key:'username', type:'text',  placeholder:'Enter username' },
    { label:'Email',    key:'email',    type:'email', placeholder:'Enter email' },
    { label:'Phone',    key:'phone',    type:'tel',   placeholder:'Enter phone number' },
  ];

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <header className="h-[56px] px-5 flex items-center glass-dark border-b border-app-border sticky top-0 z-50">
        <Link to="/profile" className="text-[17px] text-brand-primary font-normal">Cancel</Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-text-primary">Edit Profile</h1>
        <button onClick={handleSave} className="ml-auto text-[17px] text-brand-primary font-semibold">Done</button>
      </header>

      <div className="flex-1 scrollable-content px-4 py-6 pb-10">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <LetterAvatar name={form.username || 'U'} size="xl" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text fields */}
          {FIELDS.map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-[13px] text-text-secondary font-normal px-1">{f.label}</label>
              <input
                type={f.type}
                value={(form as any)[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className={inputCls}
              />
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-[13px] text-text-secondary font-normal px-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself…"
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
