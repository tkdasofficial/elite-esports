import React, { useState, useMemo } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import {
  Plus, Trash2, Edit2, Copy, Check, X, CheckCircle2, Minus,
  Search, Code2, Globe, Smartphone, Monitor, Layers,
  Clock, MousePointer, Timer, AlertTriangle, Power,
  ShieldOff, Zap, ToggleLeft, ToggleRight, ExternalLink,
  Megaphone, Filter, TestTube2, Eye, EyeOff, Shield,
  RefreshCw, Settings2, ChevronDown, ChevronUp,
  Gauge, Ban, WifiOff, LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';
import {
  useTagStore,
  AdTag, AdType, AdPlatform, AdPlacement, TriggerType,
  ScriptLoadMode, FallbackBehavior,
} from '@/src/store/tagStore';

type Toast = { msg: string; ok: boolean } | null;
type ModalState = { isNew: boolean; tag: Partial<AdTag> } | null;

const AD_TYPES: AdType[] = ['AdMob', 'AdSense', 'Custom Script', 'URL Redirect'];
const PLATFORMS: AdPlatform[] = ['All', 'Web', 'Android', 'iOS'];
const PLACEMENTS: AdPlacement[] = [
  'join_button_ad',
  'leave_button_ad',
  'welcome_ad',
  'get_reward_ad',
  'timer_ad',
];

const PLACEMENT_META: Record<AdPlacement, { label: string; desc: string; category: string }> = {
  join_button_ad:  { label: 'Join Button Ad',  desc: 'Triggered when user joins a match',             category: 'User Action' },
  leave_button_ad: { label: 'Leave Button Ad', desc: 'Triggered when user leaves a match',            category: 'User Action' },
  welcome_ad:      { label: 'Welcome Ad',      desc: 'Shown when app opens or user enters',           category: 'System'      },
  get_reward_ad:   { label: 'Get Reward Ad',   desc: 'Triggered when user claims a reward',           category: 'Reward'      },
  timer_ad:        { label: 'Timer Ad',        desc: 'Auto-shown based on admin-defined time interval', category: 'Timer'       },
};
const TRIGGERS: TriggerType[] = ['On Load', 'On Click', 'Timed'];

const FREQ_PRESETS = ['Once per session', '1 per hour', '3 per day', '5 per day', 'Unlimited'];

const EMPTY_TAG: Partial<AdTag> = {
  name: '',
  type: 'AdSense',
  platform: 'All',
  placement: 'welcome_ad',
  code: '',
  triggerType: 'On Load',
  delay: 0,
  priority: 1,
  frequencyLimit: 'Once per session',
  status: 'inactive',
};

const typeStyle: Record<AdType, { bg: string; text: string; border: string }> = {
  'AdMob':         { bg: 'bg-green-500/10',   text: 'text-green-400',   border: 'border-green-500/20'   },
  'AdSense':       { bg: 'bg-brand-blue/10',   text: 'text-brand-blue',  border: 'border-brand-blue/20'  },
  'Custom Script': { bg: 'bg-yellow-500/10',   text: 'text-yellow-400',  border: 'border-yellow-500/20'  },
  'URL Redirect':  { bg: 'bg-purple-500/10',   text: 'text-purple-400',  border: 'border-purple-500/20'  },
};

const platformIcon: Record<AdPlatform, React.ReactNode> = {
  'All':     <Layers size={11} />,
  'Web':     <Monitor size={11} />,
  'Android': <Smartphone size={11} />,
  'iOS':     <Smartphone size={11} />,
};

const triggerIcon: Record<TriggerType, React.ReactNode> = {
  'On Load':  <Clock size={11} />,
  'On Click': <MousePointer size={11} />,
  'Timed':    <Timer size={11} />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{children}</label>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn('w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0', value ? 'bg-brand-green' : 'bg-white/10')}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  );
}

export default function AdminTags() {
  const {
    tags, killSwitch, testMode, safeBrowsing, adBlockDetection, adBlockMessage,
    lazyLoad, scriptLoadMode, fallbackBehavior,
    frequencyCap, sessionResetHours, enabledPlacements,
    addTag, updateTag, deleteTag, toggleStatus,
    setKillSwitch, setTestMode, setSafeBrowsing, setAdBlockDetection, setAdBlockMessage,
    setLazyLoad, setScriptLoadMode, setFallbackBehavior,
    setFrequencyCap, setSessionResetHours, setPlacementEnabled,
  } = useTagStore();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    global: true, loading: false, frequency: false, placements: false,
  });

  const toggleSection = (key: string) =>
    setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('all');
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [copiedId, setCopiedId]         = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [modal, setModal]               = useState<ModalState>(null);
  const [toast, setToast]               = useState<Toast>(null);
  const [showFilters, setShowFilters]   = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Code copied to clipboard');
  };

  const handleDelete = (id: string) => {
    const tag = tags.find(t => t.id === id);
    deleteTag(id);
    setConfirmDeleteId(null);
    showToast(`"${tag?.name}" deleted`);
  };

  const handleToggle = (id: string) => {
    const tag = tags.find(t => t.id === id);
    toggleStatus(id);
    showToast(`${tag?.name} ${tag?.status === 'active' ? 'deactivated' : 'activated'}`);
  };

  const openNew = () => setModal({ isNew: true, tag: { ...EMPTY_TAG } });
  const openEdit = (tag: AdTag) => setModal({ isNew: false, tag: { ...tag } });

  const updateModal = (patch: Partial<AdTag>) =>
    setModal(m => m ? { ...m, tag: { ...m.tag, ...patch } } : m);

  const handleSave = () => {
    if (!modal) return;
    const t = modal.tag;
    if (!t.name?.trim()) { showToast('Tag name is required', false); return; }
    if (!t.code?.trim()) { showToast('Ad code / unit ID is required', false); return; }
    if (modal.isNew) {
      addTag({
        name: t.name!.trim(),
        type: t.type ?? 'AdSense',
        platform: t.platform ?? 'All',
        placement: t.placement ?? 'welcome_ad',
        code: t.code!.trim(),
        triggerType: t.triggerType ?? 'On Load',
        delay: t.delay ?? 0,
        priority: t.priority ?? 1,
        frequencyLimit: t.frequencyLimit ?? 'Once per session',
        status: t.status ?? 'inactive',
      });
      showToast('Tag added successfully');
    } else {
      updateTag(t.id!, {
        name: t.name!.trim(),
        type: t.type,
        platform: t.platform,
        placement: t.placement,
        code: t.code!.trim(),
        triggerType: t.triggerType,
        delay: t.delay,
        priority: t.priority,
        frequencyLimit: t.frequencyLimit,
        status: t.status,
      });
      showToast('Tag updated successfully');
    }
    setModal(null);
  };

  const filtered = useMemo(() => tags.filter(t => {
    const q = search.toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.type.toLowerCase().includes(q)) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterPlacement !== 'all' && t.placement !== filterPlacement) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPlatform !== 'all' && t.platform !== filterPlatform) return false;
    return true;
  }), [tags, search, filterType, filterPlacement, filterStatus, filterPlatform]);

  const active   = tags.filter(t => t.status === 'active').length;
  const inactive = tags.filter(t => t.status === 'inactive').length;

  const activeFilters = [filterType, filterPlacement, filterStatus, filterPlatform].filter(f => f !== 'all').length;

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kill Switch Banner */}
      <AnimatePresence>
        {killSwitch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 bg-brand-red/15 border border-brand-red/30 rounded-2xl"
          >
            <ShieldOff size={18} className="text-brand-red flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-brand-red">Global Kill Switch is ON</p>
              <p className="text-xs text-brand-red/70">All ads are disabled across every platform</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ad Tags Manager</h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            {active} active · {inactive} inactive · {tags.length} total
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="rounded-xl px-4 flex items-center gap-2 flex-shrink-0">
          <Plus size={16} /> New Tag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 bg-brand-green/5 border-brand-green/10 text-center">
          <p className="text-[9px] font-black text-brand-green uppercase tracking-widest">Active</p>
          <p className="text-xl font-black text-brand-green mt-0.5">{active}</p>
        </Card>
        <Card className="p-3 bg-white/5 border-white/5 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inactive</p>
          <p className="text-xl font-black text-slate-400 mt-0.5">{inactive}</p>
        </Card>
        <Card className="p-3 bg-brand-blue/5 border-brand-blue/10 text-center">
          <p className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Total</p>
          <p className="text-xl font-black text-brand-blue mt-0.5">{tags.length}</p>
        </Card>
        <Card className={cn('p-3 text-center border', killSwitch ? 'bg-brand-red/10 border-brand-red/20' : 'bg-white/3 border-white/5')}>
          <p className={cn('text-[9px] font-black uppercase tracking-widest', killSwitch ? 'text-brand-red' : 'text-slate-500')}>Kill Sw.</p>
          <p className={cn('text-[11px] font-black mt-0.5', killSwitch ? 'text-brand-red' : 'text-slate-500')}>
            {killSwitch ? 'ON' : 'OFF'}
          </p>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-black transition-all',
              showFilters || activeFilters > 0
                ? 'bg-brand-blue/15 border-brand-blue/30 text-brand-blue'
                : 'bg-brand-card/40 border-white/5 text-slate-400 hover:text-white'
            )}
          >
            <Filter size={15} />
            {activeFilters > 0 && (
              <span className="w-4 h-4 bg-brand-blue text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <CustomSelect
                  value={filterType}
                  onChange={setFilterType}
                  options={[
                    { value: 'all',           label: 'All Types'      },
                    { value: 'AdMob',         label: 'AdMob'          },
                    { value: 'AdSense',       label: 'AdSense'        },
                    { value: 'Custom Script', label: 'Custom Script'  },
                    { value: 'URL Redirect',  label: 'URL Redirect'   },
                  ]}
                  placeholder="Type"
                  variant="admin"
                />
                <CustomSelect
                  value={filterPlacement}
                  onChange={setFilterPlacement}
                  options={[
                    { value: 'all',            label: 'All Placements'  },
                    ...PLACEMENTS.map(p => ({ value: p, label: PLACEMENT_META[p].label })),
                  ]}
                  placeholder="Placement"
                  variant="admin"
                />
                <CustomSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all',      label: 'All Status',  },
                    { value: 'active',   label: 'Active',      icon: Zap       },
                    { value: 'inactive', label: 'Inactive',    icon: Power     },
                  ]}
                  placeholder="Status"
                  variant="admin"
                />
                <CustomSelect
                  value={filterPlatform}
                  onChange={setFilterPlatform}
                  options={[
                    { value: 'all',     label: 'All Platforms', },
                    { value: 'Web',     label: 'Web',     icon: Monitor     },
                    { value: 'Android', label: 'Android', icon: Smartphone  },
                    { value: 'iOS',     label: 'iOS',     icon: Smartphone  },
                    { value: 'All',     label: 'All',     icon: Layers      },
                  ]}
                  placeholder="Platform"
                  variant="admin"
                />
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setFilterType('all'); setFilterPlacement('all'); setFilterStatus('all'); setFilterPlatform('all'); }}
                  className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-red transition-colors px-1"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tag List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-center text-slate-600">
            <Megaphone size={36} />
            <div>
              <p className="font-bold text-sm">
                {tags.length === 0 ? 'No ad tags yet' : 'No tags match your filters'}
              </p>
              {tags.length === 0 && (
                <p className="text-xs mt-1">Add your first ad tag to start managing ads dynamically</p>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {filtered.map((tag, i) => {
            const st = typeStyle[tag.type];
            return (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={cn(
                  'p-4 bg-brand-card/40 border-white/5 space-y-3',
                  killSwitch && tag.status === 'active' && 'opacity-50'
                )}>
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border', st.bg, st.text, st.border)}>
                      <Code2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm">{tag.name}</h3>
                        <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full border', st.bg, st.text, st.border)}>
                          {tag.type}
                        </span>
                        <span className={cn(
                          'text-[9px] font-black uppercase px-2 py-0.5 rounded-full',
                          tag.status === 'active'
                            ? 'bg-brand-green/10 text-brand-green'
                            : 'bg-white/5 text-slate-500'
                        )}>
                          {tag.status}
                        </span>
                      </div>

                      {/* Meta pills */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                          {platformIcon[tag.platform]} {tag.platform}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                          <Layers size={10} /> {PLACEMENT_META[tag.placement]?.label ?? tag.placement}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                          {triggerIcon[tag.triggerType]} {tag.triggerType}
                          {tag.triggerType === 'Timed' && tag.delay > 0 && ` (${tag.delay}s)`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">P{tag.priority}</span>
                      </div>
                    </div>

                    {/* Quick toggle */}
                    <button
                      onClick={() => handleToggle(tag.id)}
                      title={tag.status === 'active' ? 'Deactivate' : 'Activate'}
                      className={cn(
                        'flex-shrink-0 p-1.5 rounded-xl transition-all',
                        tag.status === 'active'
                          ? 'text-brand-green hover:bg-brand-red/10 hover:text-brand-red'
                          : 'text-slate-600 hover:bg-brand-green/10 hover:text-brand-green'
                      )}
                    >
                      {tag.status === 'active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </div>

                  {/* Code preview */}
                  <div className="relative">
                    <pre className="bg-black/50 p-3 pr-10 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto border border-white/5 max-h-[80px] scrollable-content leading-relaxed whitespace-pre-wrap break-all">
                      {tag.code}
                    </pre>
                    <button
                      onClick={() => handleCopy(tag.id, tag.code)}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md border border-white/10"
                      title="Copy code"
                    >
                      {copiedId === tag.id ? <Check size={12} className="text-brand-green" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold px-0.5">
                    <span>Freq: {tag.frequencyLimit}</span>
                    <span>Updated {timeAgo(tag.updatedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openEdit(tag)}
                      className="py-2 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggle(tag.id)}
                      className={cn(
                        'py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5',
                        tag.status === 'active'
                          ? 'bg-white/5 text-slate-400 hover:bg-brand-yellow/10 hover:text-brand-yellow'
                          : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                      )}
                    >
                      {tag.status === 'active' ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
                      {tag.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(tag.id)}
                      className="py-2 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>

                  {/* Delete confirm */}
                  <AnimatePresence>
                    {confirmDeleteId === tag.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20"
                      >
                        <p className="flex-1 text-xs font-bold text-brand-red">Delete "{tag.name}"?</p>
                        <button onClick={() => handleDelete(tag.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Global Settings */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Ad Settings</h2>

        {/* Section 1 — Global Controls */}
        <SettingSection
          title="Global Controls"
          icon={<Settings2 size={14} />}
          open={openSections.global}
          onToggle={() => toggleSection('global')}
          danger={killSwitch}
        >
          <SettingRow
            icon={<ShieldOff size={15} className={killSwitch ? 'text-brand-red' : 'text-slate-500'} />}
            label="Global Kill Switch"
            desc="Instantly disable ALL ads across every platform"
            danger={killSwitch}
          >
            <Toggle value={killSwitch} onChange={v => { setKillSwitch(v); showToast(v ? 'All ads disabled globally' : 'Kill switch off', !v); }} />
          </SettingRow>

          <SettingRow
            icon={<TestTube2 size={15} className={testMode ? 'text-yellow-400' : 'text-slate-500'} />}
            label="Test Mode"
            desc="Serve dummy test ads instead of live ad codes"
          >
            <Toggle value={testMode} onChange={v => { setTestMode(v); showToast(`Test mode ${v ? 'enabled' : 'disabled'}`); }} />
          </SettingRow>

          <SettingRow
            icon={<Shield size={15} className="text-slate-500" />}
            label="Safe Browsing Filter"
            desc="Block ads flagged as unsafe or malicious"
          >
            <Toggle value={safeBrowsing} onChange={v => { setSafeBrowsing(v); showToast(`Safe browsing ${v ? 'on' : 'off'}`); }} />
          </SettingRow>
        </SettingSection>

        {/* Section 2 — Ad-Block Detection */}
        <SettingSection
          title="Ad-Block Detection"
          icon={<Ban size={14} />}
          open={openSections.adblock}
          onToggle={() => toggleSection('adblock')}
        >
          <SettingRow
            icon={<WifiOff size={15} className="text-slate-500" />}
            label="Detect Ad Blockers"
            desc="Show a message to users with ad blockers enabled"
          >
            <Toggle value={adBlockDetection} onChange={v => { setAdBlockDetection(v); showToast(`Ad-block detection ${v ? 'enabled' : 'disabled'}`); }} />
          </SettingRow>

          {adBlockDetection && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Custom Message</label>
              <input
                value={adBlockMessage}
                onChange={e => setAdBlockMessage(e.target.value)}
                placeholder="Message shown to users with ad blockers"
                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
              />
            </div>
          )}
        </SettingSection>

        {/* Section 3 — Loading Behaviour */}
        <SettingSection
          title="Loading Behaviour"
          icon={<RefreshCw size={14} />}
          open={openSections.loading}
          onToggle={() => toggleSection('loading')}
        >
          <SettingRow
            icon={<Eye size={15} className="text-slate-500" />}
            label="Lazy Load Ads"
            desc="Only load ad scripts when they scroll into view"
          >
            <Toggle value={lazyLoad} onChange={v => { setLazyLoad(v); showToast(`Lazy load ${v ? 'enabled' : 'disabled'}`); }} />
          </SettingRow>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Script Load Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['async', 'defer', 'sync'] as ScriptLoadMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setScriptLoadMode(mode); showToast(`Scripts load ${mode}`); }}
                  className={cn(
                    'py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all',
                    scriptLoadMode === mode
                      ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/15'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 px-1">
              {scriptLoadMode === 'async' && 'Scripts load without blocking page render (recommended)'}
              {scriptLoadMode === 'defer' && 'Scripts execute after HTML is fully parsed'}
              {scriptLoadMode === 'sync' && 'Scripts block render — use only if required by the ad network'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fallback Behaviour</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'hide',        label: 'Hide',        desc: 'Remove the slot entirely' },
                { v: 'placeholder', label: 'Placeholder', desc: 'Show an empty box' },
                { v: 'house-ad',    label: 'House Ad',    desc: 'Show an internal promo' },
              ] as { v: FallbackBehavior; label: string; desc: string }[]).map(opt => (
                <button
                  key={opt.v}
                  onClick={() => { setFallbackBehavior(opt.v); showToast(`Fallback: ${opt.label}`); }}
                  className={cn(
                    'py-2 px-2 rounded-xl border text-left transition-all',
                    fallbackBehavior === opt.v
                      ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/15'
                  )}
                >
                  <p className="text-[11px] font-black uppercase tracking-widest">{opt.label}</p>
                  <p className="text-[9px] mt-0.5 leading-tight opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </SettingSection>

        {/* Section 4 — Frequency & Session */}
        <SettingSection
          title="Frequency & Session"
          icon={<Gauge size={14} />}
          open={openSections.frequency}
          onToggle={() => toggleSection('frequency')}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Global Frequency Cap</p>
              <p className="text-xs text-slate-500 mt-0.5">Max ads shown per user per session</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setFrequencyCap(Math.max(1, frequencyCap - 1))}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-300 transition-colors active:scale-90">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-black">{frequencyCap}</span>
              <button onClick={() => setFrequencyCap(Math.min(20, frequencyCap + 1))}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-300 transition-colors active:scale-90">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Session Reset</p>
              <p className="text-xs text-slate-500 mt-0.5">Hours before frequency cap resets</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setSessionResetHours(Math.max(1, sessionResetHours - 1))}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-300 transition-colors active:scale-90">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-black">{sessionResetHours}h</span>
              <button onClick={() => setSessionResetHours(Math.min(72, sessionResetHours + 1))}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-slate-300 transition-colors active:scale-90">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Section 5 — Placement Controls */}
        <SettingSection
          title="Placement Controls"
          icon={<LayoutGrid size={14} />}
          open={openSections.placements}
          onToggle={() => toggleSection('placements')}
        >
          <p className="text-xs text-slate-500 -mt-1">Enable or disable each ad placement independently</p>
          {PLACEMENTS.map(p => (
            <SettingRow
              key={p}
              icon={
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border',
                  PLACEMENT_META[p].category === 'User Action' ? 'text-brand-blue border-brand-blue/30 bg-brand-blue/10' :
                  PLACEMENT_META[p].category === 'System'      ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                  PLACEMENT_META[p].category === 'Reward'      ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                                                                  'text-brand-orange border-brand-orange/30 bg-brand-orange/10'
                )}>
                  {PLACEMENT_META[p].category}
                </span>
              }
              label={PLACEMENT_META[p].label}
              desc={`${p} — ${PLACEMENT_META[p].desc}`}
            >
              <Toggle
                value={enabledPlacements[p] ?? true}
                onChange={v => { setPlacementEnabled(p, v); showToast(`${PLACEMENT_META[p].label} ${v ? 'enabled' : 'disabled'}`); }}
              />
            </SettingRow>
          ))}
        </SettingSection>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full sm:max-w-lg bg-[#0f0f14] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                <h2 className="text-lg font-black">{modal.isNew ? 'Add New Tag' : 'Edit Tag'}</h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4 overscroll-contain">

                {/* Tag Name */}
                <div className="space-y-1.5">
                  <FieldLabel>Tag Name *</FieldLabel>
                  <input
                    value={modal.tag.name ?? ''}
                    onChange={e => updateModal({ name: e.target.value })}
                    placeholder="e.g. Welcome Ad – AdSense"
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Type + Platform */}
                <div className="grid grid-cols-2 gap-3">
                  <CustomSelect
                    label="Ad Type *"
                    value={modal.tag.type ?? 'AdSense'}
                    onChange={v => updateModal({ type: v as AdType })}
                    options={AD_TYPES.map(t => ({ value: t, label: t }))}
                    variant="admin"
                  />
                  <CustomSelect
                    label="Platform *"
                    value={modal.tag.platform ?? 'All'}
                    onChange={v => updateModal({ platform: v as AdPlatform })}
                    options={[
                      { value: 'All',     label: 'All',     icon: Layers     },
                      { value: 'Web',     label: 'Web',     icon: Monitor    },
                      { value: 'Android', label: 'Android', icon: Smartphone },
                      { value: 'iOS',     label: 'iOS',     icon: Smartphone },
                    ]}
                    variant="admin"
                  />
                </div>

                {/* Placement */}
                <CustomSelect
                  label="Placement *"
                  value={modal.tag.placement ?? 'welcome_ad'}
                  onChange={v => updateModal({ placement: v as AdPlacement })}
                  options={PLACEMENTS.map(p => ({ value: p, label: PLACEMENT_META[p].label }))}
                  variant="admin"
                />

                {/* Trigger + Delay */}
                <div className="grid grid-cols-2 gap-3">
                  <CustomSelect
                    label="Trigger Type"
                    value={modal.tag.triggerType ?? 'On Load'}
                    onChange={v => updateModal({ triggerType: v as TriggerType })}
                    options={[
                      { value: 'On Load',  label: 'On Load',  icon: Clock         },
                      { value: 'On Click', label: 'On Click', icon: MousePointer  },
                      { value: 'Timed',    label: 'Timed',    icon: Timer         },
                    ]}
                    variant="admin"
                  />
                  <div className="space-y-1.5">
                    <FieldLabel>Delay (seconds)</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={modal.tag.delay ?? 0}
                      onChange={e => updateModal({ delay: Number(e.target.value) })}
                      disabled={modal.tag.triggerType !== 'Timed'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all disabled:opacity-30"
                    />
                  </div>
                </div>

                {/* Priority + Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Priority (1 = highest)</FieldLabel>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={modal.tag.priority ?? 1}
                      onChange={e => updateModal({ priority: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all"
                    />
                  </div>
                  <CustomSelect
                    label="Frequency Limit"
                    value={modal.tag.frequencyLimit ?? 'Once per session'}
                    onChange={v => updateModal({ frequencyLimit: v })}
                    options={FREQ_PRESETS.map(f => ({ value: f, label: f }))}
                    variant="admin"
                  />
                </div>

                {/* Ad Code / Unit ID */}
                <div className="space-y-1.5">
                  <FieldLabel>
                    {modal.tag.type === 'AdMob' ? 'Ad Unit ID *' : modal.tag.type === 'URL Redirect' ? 'Redirect URL *' : 'Ad Code *'}
                  </FieldLabel>
                  {modal.tag.type === 'URL Redirect' ? (
                    <div className="relative">
                      <ExternalLink size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="url"
                        value={modal.tag.code ?? ''}
                        onChange={e => updateModal({ code: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
                      />
                    </div>
                  ) : modal.tag.type === 'AdMob' ? (
                    <input
                      value={modal.tag.code ?? ''}
                      onChange={e => updateModal({ code: e.target.value })}
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
                    />
                  ) : (
                    <textarea
                      value={modal.tag.code ?? ''}
                      onChange={e => updateModal({ code: e.target.value })}
                      placeholder={modal.tag.type === 'AdSense'
                        ? '<ins class="adsbygoogle"...'
                        : '<!-- Paste your script or HTML here -->'}
                      className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-[12px] font-mono outline-none focus:border-brand-blue transition-all resize-none placeholder:text-slate-600 scrollable-content"
                      style={{ minHeight: '120px' }}
                    />
                  )}
                  {modal.tag.type === 'AdMob' && (
                    <p className="text-[10px] text-slate-500 px-1">AdMob uses the SDK — enter only the Ad Unit ID, not a script tag</p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-bold">Active Status</p>
                    <p className="text-[10px] text-slate-500">Enable to serve this ad immediately</p>
                  </div>
                  <Toggle
                    value={modal.tag.status === 'active'}
                    onChange={v => updateModal({ status: v ? 'active' : 'inactive' })}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-5 py-4 border-t border-white/5 flex-shrink-0">
                <Button variant="secondary" onClick={() => setModal(null)} className="flex-1 rounded-xl border-white/10">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                  <Check size={15} /> {modal.isNew ? 'Add Tag' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingSection({
  title, icon, open, onToggle, danger, children,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn('bg-brand-card/40 border-white/5 overflow-hidden', danger && 'border-brand-red/20 bg-brand-red/5')}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 gap-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className={cn('flex-shrink-0', danger ? 'text-brand-red' : 'text-slate-400')}>{icon}</span>
          <p className={cn('text-sm font-black', danger ? 'text-brand-red' : 'text-white')}>{title}</p>
        </div>
        <span className="text-slate-600 flex-shrink-0">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function SettingRow({
  icon, label, desc, danger, children,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="flex-shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className={cn('text-sm font-bold', danger ? 'text-brand-red' : '')}>{label}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
