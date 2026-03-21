import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  Plus, Edit2, Trash2, ExternalLink, Eye, X, Check,
  ChevronUp, ChevronDown, ImageOff, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBannerStore } from '@/src/store/bannerStore';
import { Banner } from '@/src/types';
import { ImageUpload } from '@/src/components/ui/ImageUpload';

type EditingBanner = Omit<Banner, 'id'> & { id: string };

const EMPTY_BANNER: EditingBanner = {
  id: 'new',
  title: '',
  description: '',
  image: '',
  buttonText: 'Register Now',
  link: '/',
  isActive: true,
};

export default function AdminCampaign() {
  const {
    banners, autoRotate, mobileOnly,
    addBanner, updateBanner, deleteBanner, toggleBannerStatus,
    reorderBanner, setAutoRotate, setMobileOnly,
  } = useBannerStore();

  const [editingBanner, setEditingBanner] = useState<EditingBanner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    deleteBanner(confirmDeleteId);
    setConfirmDeleteId(null);
    showToast('Banner deleted');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    if (editingBanner.id === 'new') {
      const { id: _, ...rest } = editingBanner;
      addBanner(rest);
      showToast('Banner added');
    } else {
      const { id, ...rest } = editingBanner;
      updateBanner(id, rest);
      showToast('Banner updated');
    }
    setEditingBanner(null);
  };

  const activeBanners = banners.filter(b => b.isActive).length;

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white relative">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 ${toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {toast.ok ? <Check size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Campaign Banners</h1>
          <p className="text-xs text-slate-500 mt-1">
            {banners.length} total · <span className="text-green-400 font-bold">{activeBanners} active</span>
          </p>
        </div>
        <Button
          onClick={() => { setImgError(false); setEditingBanner({ ...EMPTY_BANNER }); }}
          size="sm"
          className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Add Banner
        </Button>
      </div>

      {/* Banner Cards */}
      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
          <ImageOff size={40} />
          <p className="font-bold">No banners yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map((banner, i) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              layout
            >
              <Card className="overflow-hidden bg-brand-card/40 border-white/5 group h-full flex flex-col">
                {/* Thumbnail */}
                <div className="relative aspect-video flex-shrink-0">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=60'; }}
                  />
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <button
                      onClick={() => toggleBannerStatus(banner.id)}
                      title="Toggle status"
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 transition-colors ${banner.isActive ? 'bg-green-500/80 text-white' : 'bg-slate-800/80 text-slate-300'}`}
                    >
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  {/* Hover overlay actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setPreviewBanner(banner)}
                      title="Preview"
                      className="p-3 bg-white/10 text-white rounded-2xl active:scale-90 transition-all hover:bg-white/20 backdrop-blur-sm"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => { setImgError(false); setEditingBanner({ ...banner }); }}
                      title="Edit"
                      className="p-3 bg-blue-500 text-white rounded-2xl active:scale-90 transition-all hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(banner.id)}
                      title="Delete"
                      className="p-3 bg-red-500 text-white rounded-2xl active:scale-90 transition-all hover:shadow-lg hover:shadow-red-500/20"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Card footer */}
                <div className="p-4 flex items-center gap-3">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => reorderBanner(banner.id, 'up')}
                      disabled={i === 0}
                      className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => reorderBanner(banner.id, 'down')}
                      disabled={i === banners.length - 1}
                      className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-all"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h3 className="font-bold text-sm truncate">{banner.title}</h3>
                    <p className="text-[10px] text-slate-500 truncate">{banner.description}</p>
                    <div className="flex items-center gap-1 text-slate-600 mt-0.5">
                      <ExternalLink size={10} className="flex-shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-widest truncate">{banner.link}</span>
                    </div>
                  </div>

                  {/* Mobile quick actions */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <button onClick={() => setPreviewBanner(banner)} className="p-2 bg-white/5 rounded-xl text-slate-400"><Eye size={14} /></button>
                    <button onClick={() => { setImgError(false); setEditingBanner({ ...banner }); }} className="p-2 bg-white/5 rounded-xl text-slate-400"><Edit2 size={14} /></button>
                    <button onClick={() => setConfirmDeleteId(banner.id)} className="p-2 bg-white/5 rounded-xl text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">Display Settings</h2>
        <Card className="p-6 bg-brand-card/40 border-white/5 space-y-5">
          <SettingRow
            title="Auto-rotate Banners"
            description="Automatically cycle through active banners every 4.5 seconds"
            value={autoRotate}
            onChange={setAutoRotate}
          />
          <div className="border-t border-white/5" />
          <SettingRow
            title="Show on Mobile Only"
            description="Hide the banner carousel on desktop-width viewports"
            value={mobileOnly}
            onChange={setMobileOnly}
          />
        </Card>
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <Modal onClose={() => setConfirmDeleteId(null)}>
            <div className="p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-black">Delete Banner?</h2>
                <p className="text-sm text-slate-400 mt-1">
                  "{banners.find(b => b.id === confirmDeleteId)?.title}" will be permanently removed.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleDelete} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 border-red-500">
                  Delete
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editingBanner && (
          <Modal onClose={() => setEditingBanner(null)} wide>
            {/* Sticky header — never scrolls */}
            <div className="flex-shrink-0 p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black">{editingBanner.id === 'new' ? 'Add Banner' : 'Edit Banner'}</h2>
              <button onClick={() => setEditingBanner(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <ImageUpload
                  label="Banner Image"
                  value={editingBanner.image}
                  onChange={v => setEditingBanner({ ...editingBanner, image: v })}
                  aspect="wide"
                  hint="Landscape image shown in the campaign carousel"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Campaign Title"
                    type="text"
                    required
                    value={editingBanner.title}
                    onChange={v => setEditingBanner({ ...editingBanner, title: v })}
                    placeholder="Elite Pro Series S4"
                  />
                  <FormField
                    label="Button Text"
                    type="text"
                    required
                    value={editingBanner.buttonText}
                    onChange={v => setEditingBanner({ ...editingBanner, buttonText: v })}
                    placeholder="Register Now"
                  />
                </div>
                <FormField
                  label="Description"
                  type="text"
                  value={editingBanner.description}
                  onChange={v => setEditingBanner({ ...editingBanner, description: v })}
                  placeholder="₹1,00,000 prize pool · 100 squads · Starts tonight"
                />
                <FormField
                  label="Redirect Link"
                  type="text"
                  required
                  value={editingBanner.link}
                  onChange={v => setEditingBanner({ ...editingBanner, link: v })}
                  placeholder="/match/1"
                />

                {/* Active toggle */}
                <div className="flex items-center justify-between py-2 px-4 bg-white/5 rounded-xl">
                  <span className="text-sm font-bold">Active on launch</span>
                  <button
                    type="button"
                    onClick={() => setEditingBanner({ ...editingBanner, isActive: !editingBanner.isActive })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${editingBanner.isActive ? 'bg-brand-primary' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingBanner.isActive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-2 pb-2">
                  <Button type="button" variant="secondary" onClick={() => setEditingBanner(null)} className="flex-1 rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl">
                    {editingBanner.id === 'new' ? 'Add Banner' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewBanner && (
          <Modal onClose={() => setPreviewBanner(null)} wide>
            <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Banner Preview</h2>
              <button onClick={() => setPreviewBanner(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="relative aspect-video w-full bg-black overflow-hidden">
                <img
                  src={previewBanner.image}
                  alt={previewBanner.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex flex-col gap-2.5">
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight drop-shadow">{previewBanner.title}</h2>
                    <p className="text-white/60 text-sm mt-0.5">{previewBanner.description}</p>
                  </div>
                  <div className="inline-block self-start px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-primary/30">
                    {previewBanner.buttonText}
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><ExternalLink size={12} />{previewBanner.link}</span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${previewBanner.isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-slate-500'}`}>
                  {previewBanner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
        className={`w-full ${wide ? 'sm:max-w-lg' : 'sm:max-w-sm'} bg-[#0f0f14] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}

function FormField({
  label, type, value, onChange, placeholder, required,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
      />
    </div>
  );
}

function SettingRow({
  title, description, value, onChange,
}: {
  title: string; description: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5 flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
      >
        {value
          ? <ToggleRight size={32} className="text-blue-500" />
          : <ToggleLeft size={32} />}
      </button>
    </div>
  );
}
