import React, { useState } from 'react';
import { useUserStore } from '@/src/store/userStore';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { LetterAvatar } from '@/src/components/ui/LetterAvatar';
import { ChevronLeft, Camera, User, Mail, Phone, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const { user, updateProfile } = useUserStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    navigate('/profile');
  };

  return (
    <div className="h-full flex flex-col">
      <header className="h-16 px-6 flex items-center gap-4 bg-brand-dark/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <Link to="/profile" className="p-2.5 bg-white/5 rounded-full text-slate-300 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Edit Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide pb-10">
        {/* Avatar Edit */}
        <section className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <div className="p-1.5 rounded-full border-4 border-brand-blue shadow-2xl shadow-brand-blue/20">
              <LetterAvatar 
                name={formData.username} 
                size="xl" 
                className="border-none shadow-none"
              />
            </div>
            <button className="absolute bottom-1 right-1 bg-brand-blue p-3 rounded-full border-4 border-brand-dark shadow-lg text-white active:scale-90 transition-transform hover:scale-110">
              <Camera size={18} />
            </button>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tap to change avatar</p>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 pb-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <User size={12} className="text-brand-blue" /> Username
              </label>
              <input 
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue focus:bg-brand-card/60 transition-all shadow-inner"
                placeholder="Enter username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <Mail size={12} className="text-brand-blue" /> Email Address
              </label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue focus:bg-brand-card/60 transition-all shadow-inner"
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <Phone size={12} className="text-brand-blue" /> Phone Number
              </label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue focus:bg-brand-card/60 transition-all shadow-inner"
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <Info size={12} className="text-brand-blue" /> Bio
              </label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-brand-card/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-black tracking-tight focus:outline-none focus:border-brand-blue focus:bg-brand-card/60 transition-all shadow-inner min-h-[120px] resize-none"
                placeholder="Tell us about yourself"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              fullWidth
              size="lg"
              className="rounded-2xl font-black uppercase tracking-widest text-xs py-4 shadow-xl shadow-brand-blue/20 active:scale-[0.98] transition-all"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
