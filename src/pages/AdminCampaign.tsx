import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Plus, Edit2, Trash2, ExternalLink, Eye, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminCampaign() {
  const [banners, setBanners] = useState([
    { id: '1', title: 'BGMI Pro League', image: 'https://picsum.photos/seed/bgmi/800/450', link: '/match/1', status: 'active' },
    { id: '2', title: 'Valorant Challengers', image: 'https://picsum.photos/seed/valorant/800/450', link: '/match/2', status: 'active' },
    { id: '3', title: 'Free Fire Elite', image: 'https://picsum.photos/seed/ff/800/450', link: '/match/3', status: 'inactive' },
  ]);

  const [settings, setSettings] = useState({
    autoRotate: true,
    mobileOnly: false,
  });

  const [editingBanner, setEditingBanner] = useState<any>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      setBanners(prev => prev.filter(b => b.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setBanners(prev => prev.map(b => 
      b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b
    ));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner.id === 'new') {
      setBanners(prev => [...prev, { ...editingBanner, id: Math.random().toString(36).substr(2, 9) }]);
    } else {
      setBanners(prev => prev.map(b => b.id === editingBanner.id ? editingBanner : b));
    }
    setEditingBanner(null);
  };

  const startAdd = () => {
    setEditingBanner({
      id: 'new',
      title: '',
      image: 'https://picsum.photos/seed/new/800/450',
      link: '/',
      status: 'inactive'
    });
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Campaign Banners</h1>
        <Button onClick={startAdd} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {banners.map((banner, i) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden bg-brand-card/40 border-white/5 group h-full flex flex-col">
              <div className="relative aspect-video flex-shrink-0">
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3">
                  <button 
                    onClick={() => toggleStatus(banner.id)}
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 transition-colors ${
                      banner.status === 'active' ? 'bg-brand-green/80 text-white' : 'bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    {banner.status}
                  </button>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    onClick={() => setEditingBanner(banner)}
                    className="p-3 bg-brand-blue text-white rounded-2xl active:scale-90 transition-all hover:shadow-lg hover:shadow-brand-blue/20"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    className="p-3 bg-brand-red text-white rounded-2xl active:scale-90 transition-all hover:shadow-lg hover:shadow-brand-red/20"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-4 flex-1">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-sm truncate group-hover:text-brand-blue transition-colors">{banner.title}</h3>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <ExternalLink size={12} className="flex-shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">{banner.link}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  <button onClick={() => setEditingBanner(banner)} className="p-2 bg-white/5 rounded-xl text-slate-400"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(banner.id)} className="p-2 bg-white/5 rounded-xl text-slate-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">Banner Settings</h2>
        <Card className="p-6 bg-brand-card/40 border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold">Auto-rotate Banners</p>
              <p className="text-xs text-slate-500">Switch banners automatically every 5 seconds</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, autoRotate: !s.autoRotate }))}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.autoRotate ? 'bg-brand-blue' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoRotate ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold">Show on Mobile Only</p>
              <p className="text-xs text-slate-500">Hide banners on desktop viewports</p>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, mobileOnly: !s.mobileOnly }))}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.mobileOnly ? 'bg-brand-blue' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.mobileOnly ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {editingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-brand-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-black">{editingBanner.id === 'new' ? 'Add Banner' : 'Edit Banner'}</h2>
                <button onClick={() => setEditingBanner(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={editingBanner.title}
                    onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Image URL</label>
                  <input
                    type="url"
                    required
                    value={editingBanner.image}
                    onChange={e => setEditingBanner({ ...editingBanner, image: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Redirect Link</label>
                  <input
                    type="text"
                    required
                    value={editingBanner.link}
                    onChange={e => setEditingBanner({ ...editingBanner, link: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setEditingBanner(null)} className="flex-1 rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl">
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
