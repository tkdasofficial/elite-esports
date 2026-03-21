import React, { useState, useMemo } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { ImageUpload } from '@/src/components/ui/ImageUpload';
import {
  Plus, Edit2, Trash2, X, Check, Eye, EyeOff,
  Image, Video, LayoutTemplate, Zap, LogIn, LogOut,
  Gift, Timer, ChevronRight, Search, Filter,
  ToggleLeft, ToggleRight, CheckCircle2, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useCampaignStore, Campaign,
  CampaignAdType, CampaignTrigger,
} from '@/src/store/campaignStore';
import { cn } from '@/src/utils/helpers';

const AD_TYPES: CampaignAdType[] = ['Image', 'Video', 'Banner'];
const TRIGGERS: CampaignTrigger[] = ['Welcome', 'Join', 'Leave', 'Reward', 'Timer'];

const TRIGGER_META: Record<CampaignTrigger, { icon: React.ReactNode; label: string; desc: string; color: string }> = {
  Welcome: { icon: <Zap size={14} />,      label: 'Welcome Ad',    desc: 'Once per day on app open',         color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  Join:    { icon: <LogIn size={14} />,     label: 'Join Ad',       desc: 'Before user joins a match',        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  Leave:   { icon: <LogOut size={14} />,    label: 'Leave Ad',      desc: 'Before user leaves a match',       color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  Reward:  { icon: <Gift size={14} />,      label: 'Reward Ad',     desc: 'After winning before reward',      color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  Timer:   { icon: <Timer size={14} />,     label: 'Timer Ad',      desc: 'Shown at a set interval',          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

const AD_TYPE_META: Record<CampaignAdType, { icon: React.ReactNode; label: string; color: string }> = {
  Image:  { icon: <Image size={13} />,          label: 'Image',  color: 'text-blue-400' },
  Video:  { icon: <Video size={13} />,           label: 'Video',  color: 'text-purple-400' },
  Banner: { icon: <LayoutTemplate size={13} />,  label: 'Banner', color: 'text-green-400' },
};

const EMPTY: Omit<Campaign, 'id' | 'createdAt'> = {
  name: '',
  adType: 'Image',
  triggerType: 'Welcome',
  mediaUrl: '',
  duration: 5,
  isSkippable: true,
  skipAfter: 3,
  intervalMinutes: 30,
  priority: 1,
  status: 'inactive',
  title: '',
  description: '',
  buttonText: '',
  linkUrl: '',
};

type ModalCampaign = Omit<Campaign, 'id' | 'createdAt'> & { id?: string };
type Toast = { msg: string; ok: boolean } | null;

export default function AdminCampaign() {
  const {
    campaigns, addCampaign, updateCampaign, deleteCampaign, toggleStatus,
  } = useCampaignStore();

  const [modal, setModal] = useState<ModalCampaign | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTrigger, setFilterTrigger] = useState<CampaignTrigger | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openNew = () => {
    setModal({ ...EMPTY });
    setIsNew(true);
  };

  const openEdit = (c: Campaign) => {
    setModal({ ...c });
    setIsNew(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    if (!modal.name.trim()) { showToast('Campaign name is required', false); return; }
    if (!modal.mediaUrl.trim()) { showToast('Media URL or image is required', false); return; }

    if (isNew) {
      addCampaign(modal);
      showToast('Campaign created');
    } else {
      updateCampaign(modal.id!, modal);
      showToast('Campaign updated');
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!confirmDeleteId) return;
    deleteCampaign(confirmDeleteId);
    setConfirmDeleteId(null);
    showToast('Campaign deleted');
  };

  const patch = (p: Partial<ModalCampaign>) =>
    setModal(m => m ? { ...m, ...p } : m);

  const filtered = useMemo(() => campaigns.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q)) return false;
    if (filterTrigger !== 'all' && c.triggerType !== filterTrigger) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  }), [campaigns, search, filterTrigger, filterStatus]);

  const active = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-28 pt-6 text-white relative">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Campaign Manager</h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            {active} active · {campaigns.length} total
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="rounded-xl px-4 flex items-center gap-2 flex-shrink-0">
          <Plus size={16} /> New Campaign
        </Button>
      </div>

      {/* Trigger Type Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TRIGGERS.map(t => {
          const meta = TRIGGER_META[t];
          const count = campaigns.filter(c => c.triggerType === t && c.status === 'active').length;
          return (
            <button
              key={t}
              onClick={() => setFilterTrigger(filterTrigger === t ? 'all' : t)}
              className={cn(
                'p-3 rounded-2xl border text-left transition-all',
                filterTrigger === t
                  ? `${meta.color} border-current/30`
                  : 'bg-white/3 border-white/5 hover:border-white/10'
              )}
            >
              <div className={cn('flex items-center gap-1.5 mb-1', filterTrigger === t ? meta.color.split(' ')[0] : 'text-slate-400')}>
                {meta.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">{meta.desc}</p>
              {count > 0 && (
                <span className="mt-1.5 inline-block text-[9px] font-black text-green-400">{count} active</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-black transition-all',
              showFilters ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-slate-400'
            )}
          >
            <Filter size={15} />
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 flex-wrap pt-1">
                {(['all', 'active', 'inactive'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all',
                      filterStatus === s ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-600 text-center">
            <Zap size={36} />
            <p className="font-bold text-sm">
              {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match filters'}
            </p>
            {campaigns.length === 0 && (
              <p className="text-xs">Create your first campaign to start showing ads</p>
            )}
          </div>
        )}

        <AnimatePresence>
          {filtered.map((c, i) => {
            const tMeta = TRIGGER_META[c.triggerType];
            const aMeta = AD_TYPE_META[c.adType];
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="bg-white/3 border-white/5 overflow-hidden">
                  <div className="flex items-stretch">
                    {/* Media thumb */}
                    <div className="w-24 flex-shrink-0 relative bg-black/40">
                      {c.mediaUrl ? (
                        <img
                          src={c.mediaUrl}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          {aMeta.icon}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f0f14]/50" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 space-y-2.5 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-sm truncate">{c.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={cn('flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border', tMeta.color)}>
                              {tMeta.icon} {tMeta.label}
                            </span>
                            <span className={cn('flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/5', aMeta.color)}>
                              {aMeta.icon} {aMeta.label}
                            </span>
                            <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full',
                              c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-slate-500'
                            )}>
                              {c.status}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => { toggleStatus(c.id); showToast(`${c.name} ${c.status === 'active' ? 'deactivated' : 'activated'}`); }}
                          className="flex-shrink-0 p-1 text-slate-500 hover:text-white transition-colors"
                        >
                          {c.status === 'active' ? <ToggleRight size={22} className="text-green-400" /> : <ToggleLeft size={22} />}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold">
                        <span>{c.duration}s</span>
                        {c.isSkippable && <span>Skip after {c.skipAfter}s</span>}
                        {c.triggerType === 'Timer' && <span>Every {c.intervalMinutes}min</span>}
                        <span>P{c.priority}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                        >
                          <Edit2 size={10} /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                        <a
                          href={c.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto p-1.5 text-slate-600 hover:text-slate-300 transition-colors"
                          title="Open media"
                        >
                          <ChevronRight size={14} />
                        </a>
                      </div>

                      {/* Delete confirm inline */}
                      <AnimatePresence>
                        {confirmDeleteId === c.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 p-2.5 bg-red-500/10 rounded-xl border border-red-500/20"
                          >
                            <p className="flex-1 text-xs font-bold text-red-400">Delete "{c.name}"?</p>
                            <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Ad Trigger Info Box */}
      <Card className="p-5 bg-blue-500/5 border-blue-500/10 space-y-3">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-blue-400 flex-shrink-0" />
          <h2 className="text-sm font-black text-blue-400">How Ad Triggers Work</h2>
        </div>
        <div className="space-y-2">
          {TRIGGERS.map(t => {
            const meta = TRIGGER_META[t];
            return (
              <div key={t} className="flex items-start gap-3">
                <span className={cn('flex-shrink-0 mt-0.5', meta.color.split(' ')[0])}>{meta.icon}</span>
                <div>
                  <p className="text-xs font-black text-slate-300">{meta.label}</p>
                  <p className="text-[11px] text-slate-500">{meta.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <CampaignModal
            campaign={modal}
            isNew={isNew}
            onClose={() => setModal(null)}
            onSave={handleSave}
            onChange={patch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CampaignModal({
  campaign, isNew, onClose, onSave, onChange,
}: {
  campaign: ModalCampaign;
  isNew: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChange: (p: Partial<ModalCampaign>) => void;
}) {
  const tMeta = TRIGGER_META[campaign.triggerType];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="w-full sm:max-w-lg bg-[#0f0f14] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-black">{isNew ? 'New Campaign' : 'Edit Campaign'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <form onSubmit={onSave} className="p-5 space-y-5">

            {/* Name */}
            <Field label="Campaign Name" required>
              <input
                type="text"
                required
                value={campaign.name}
                onChange={e => onChange({ name: e.target.value })}
                placeholder="e.g. Summer Tournament Welcome Ad"
                className={inputCls}
              />
            </Field>

            {/* Ad Type */}
            <Field label="Ad Type">
              <div className="grid grid-cols-3 gap-2">
                {AD_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ adType: t })}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all',
                      campaign.adType === t
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/15'
                    )}
                  >
                    {AD_TYPE_META[t].icon} {t}
                  </button>
                ))}
              </div>
            </Field>

            {/* Trigger Type */}
            <Field label="Trigger Type">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRIGGERS.map(t => {
                  const meta = TRIGGER_META[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChange({ triggerType: t })}
                      disabled={campaign.adType === 'Banner'}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-black transition-all',
                        campaign.triggerType === t
                          ? `${meta.color}`
                          : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/15',
                        campaign.adType === 'Banner' && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {meta.icon} {t}
                    </button>
                  );
                })}
              </div>
              {campaign.adType === 'Banner' && (
                <p className="text-[10px] text-slate-500 mt-1.5 px-1">Banner ads show in the home carousel — trigger is not applicable.</p>
              )}
            </Field>

            {/* Trigger summary */}
            {campaign.adType !== 'Banner' && (
              <div className={cn('flex items-start gap-2 p-3 rounded-xl border text-xs', tMeta.color)}>
                <span className="flex-shrink-0 mt-0.5">{tMeta.icon}</span>
                <p>{tMeta.desc}</p>
              </div>
            )}

            {/* Media */}
            {campaign.adType === 'Video' ? (
              <Field label="Video URL" required>
                <input
                  type="url"
                  value={campaign.mediaUrl}
                  onChange={e => onChange({ mediaUrl: e.target.value })}
                  placeholder="https://example.com/ad.mp4"
                  className={inputCls}
                />
              </Field>
            ) : (
              <ImageUpload
                label={campaign.adType === 'Banner' ? 'Banner Image' : 'Ad Image'}
                value={campaign.mediaUrl}
                onChange={v => onChange({ mediaUrl: v })}
                aspect={campaign.adType === 'Banner' ? 'wide' : 'wide'}
                hint={campaign.adType === 'Banner' ? 'Landscape image for the home carousel' : 'Fullscreen ad image shown to users'}
                required
              />
            )}

            {/* Banner-specific fields */}
            {campaign.adType === 'Banner' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Banner Title" required>
                    <input type="text" required value={campaign.title || ''} onChange={e => onChange({ title: e.target.value })} placeholder="Elite Pro Series" className={inputCls} />
                  </Field>
                  <Field label="Button Text">
                    <input type="text" value={campaign.buttonText || ''} onChange={e => onChange({ buttonText: e.target.value })} placeholder="Register Now" className={inputCls} />
                  </Field>
                </div>
                <Field label="Description">
                  <input type="text" value={campaign.description || ''} onChange={e => onChange({ description: e.target.value })} placeholder="₹1,00,000 prize pool · 100 squads" className={inputCls} />
                </Field>
                <Field label="Link URL">
                  <input type="text" value={campaign.linkUrl || ''} onChange={e => onChange({ linkUrl: e.target.value })} placeholder="/match/1 or https://..." className={inputCls} />
                </Field>
              </>
            )}

            {/* Duration & Skip settings (non-banner) */}
            {campaign.adType !== 'Banner' && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Duration (seconds)">
                  <input
                    type="number"
                    min={3} max={120}
                    value={campaign.duration}
                    onChange={e => onChange({ duration: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Priority">
                  <input
                    type="number"
                    min={1} max={10}
                    value={campaign.priority}
                    onChange={e => onChange({ priority: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            {campaign.adType !== 'Banner' && (
              <div className="space-y-3">
                <Toggle
                  label="Skippable"
                  description="User can skip the ad after a delay"
                  value={campaign.isSkippable}
                  onChange={v => onChange({ isSkippable: v })}
                />
                {campaign.isSkippable && (
                  <Field label="Skip button appears after (seconds)">
                    <input
                      type="number"
                      min={1} max={campaign.duration}
                      value={campaign.skipAfter}
                      onChange={e => onChange({ skipAfter: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                )}
              </div>
            )}

            {/* Timer-specific */}
            {campaign.triggerType === 'Timer' && campaign.adType !== 'Banner' && (
              <Field label="Show every (minutes)">
                <input
                  type="number"
                  min={1}
                  value={campaign.intervalMinutes}
                  onChange={e => onChange({ intervalMinutes: Number(e.target.value) })}
                  className={inputCls}
                />
              </Field>
            )}

            {/* Status */}
            <Toggle
              label="Active on save"
              description="Campaign will immediately start showing"
              value={campaign.status === 'active'}
              onChange={v => onChange({ status: v ? 'active' : 'inactive' })}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-2 pb-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xl">
                {isNew ? 'Create Campaign' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 px-3 bg-white/5 rounded-xl">
      <div className="space-y-0.5">
        <p className="text-sm font-bold">{label}</p>
        {description && <p className="text-[11px] text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="flex-shrink-0"
      >
        {value
          ? <ToggleRight size={28} className="text-blue-400" />
          : <ToggleLeft size={28} className="text-slate-600" />
        }
      </button>
    </div>
  );
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-600';
