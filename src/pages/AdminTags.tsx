import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, CheckCircle2, X, Check,
  Code2, Globe, Zap, LayoutTemplate, Eye, EyeOff,
  ChevronDown, AlertTriangle, Wifi, WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdTagStore, AdTag, AdTagInput, AdTagType, AdCodeType, AdPosition } from '@/src/store/adTagStore';
import { AdTagRenderer } from '@/src/components/AdTagRenderer';
import { cn } from '@/src/utils/helpers';

type ModalState = { mode: 'add' | 'edit'; tag: Partial<AdTagInput & { id: string }> } | null;
type Toast = { msg: string; ok: boolean } | null;

const TYPE_META: Record<AdTagType, { label: string; color: string; bg: string }> = {
  banner:       { label: 'Banner',       color: 'text-brand-primary',  bg: 'bg-brand-primary/15' },
  interstitial: { label: 'Interstitial', color: 'text-brand-live',     bg: 'bg-brand-live/15' },
  native:       { label: 'Native',       color: 'text-brand-success',  bg: 'bg-brand-success/15' },
  custom:       { label: 'Custom',       color: 'text-text-secondary', bg: 'bg-app-elevated' },
};

const POSITION_META: Record<AdPosition, { label: string }> = {
  home:        { label: 'Home' },
  matches:     { label: 'Matches' },
  leaderboard: { label: 'Leaderboard' },
  wallet:      { label: 'Wallet' },
  global:      { label: 'Global (all pages)' },
};

const CODE_TYPE_META: Record<AdCodeType, { label: string; hint: string; icon: React.ElementType }> = {
  html:       { label: 'HTML',       hint: 'Paste full HTML markup (AdSense, custom banners…)',  icon: Code2 },
  javascript: { label: 'JavaScript', hint: 'Paste a JS script that writes the ad into the page', icon: Zap },
  url:        { label: 'URL / Link', hint: 'Direct URL to an ad page or iframe source',          icon: Globe },
};

const EMPTY_TAG: Partial<AdTagInput> = {
  name:      '',
  type:      'banner',
  code_type: 'html',
  code:      '',
  position:  'global',
  is_active: true,
  priority:  0,
  notes:     '',
};

const IOSToggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={cn(
      'w-[51px] h-[31px] rounded-full relative transition-colors duration-200 shrink-0',
      value ? 'bg-brand-success' : 'bg-app-elevated border border-ios-sep'
    )}
  >
    <motion.div
      animate={{ x: value ? 22 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-[3px] w-[25px] h-[25px] bg-white rounded-full shadow-md"
    />
  </button>
);

const SelectRow = <T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) => (
  <div className="space-y-1.5">
    <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="w-full appearance-none bg-app-elevated border border-ios-sep rounded-[14px] py-3 pl-4 pr-10 text-[15px] text-text-primary outline-none focus:border-brand-primary transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
    </div>
  </div>
);

export default function AdminTags() {
  const { tags, loading, error, fetchAllTags, createTag, updateTag, toggleTag, deleteTag } = useAdTagStore();

  const [search,          setSearch]          = useState('');
  const [filterType,      setFilterType]      = useState<AdTagType | 'all'>('all');
  const [modal,           setModal]           = useState<ModalState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showPreview,     setShowPreview]     = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [toast,           setToast]           = useState<Toast>(null);

  useEffect(() => { fetchAllTags(); }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const openAdd  = () => setModal({ mode: 'add',  tag: { ...EMPTY_TAG } });
  const openEdit = (t: AdTag) => setModal({ mode: 'edit', tag: { ...t } });
  const closeModal = () => { setModal(null); setShowPreview(false); };

  const setField = <K extends keyof (AdTagInput & { id: string })>(key: K, value: any) =>
    setModal(m => m ? { ...m, tag: { ...m.tag, [key]: value } } : m);

  const handleSave = async () => {
    if (!modal) return;
    const { mode, tag } = modal;
    if (!tag.name?.trim()) { showToast('Tag name is required', false); return; }
    if (!tag.code?.trim()) { showToast('Ad code / URL is required', false); return; }

    setSaving(true);
    try {
      const payload: AdTagInput = {
        name:      tag.name!.trim(),
        type:      tag.type as AdTagType       ?? 'banner',
        code_type: tag.code_type as AdCodeType ?? 'html',
        code:      tag.code!.trim(),
        position:  tag.position as AdPosition  ?? 'global',
        is_active: tag.is_active               ?? true,
        priority:  tag.priority                ?? 0,
        notes:     tag.notes                   ?? '',
      };

      if (mode === 'add') {
        await createTag(payload);
        showToast(`"${payload.name}" created`);
      } else {
        await updateTag(tag.id!, payload);
        showToast('Tag updated');
      }
      closeModal();
    } catch (e: any) {
      showToast(e.message ?? 'Save failed', false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTag(id);
      const t = tags.find(t => t.id === id);
      showToast(`"${t?.name}" ${t?.is_active ? 'deactivated' : 'activated'}`);
    } catch (e: any) {
      showToast(e.message ?? 'Toggle failed', false);
    }
  };

  const handleDelete = async (id: string) => {
    const t = tags.find(t => t.id === id);
    try {
      await deleteTag(id);
      setConfirmDeleteId(null);
      showToast(`"${t?.name}" deleted`);
    } catch (e: any) {
      showToast(e.message ?? 'Delete failed', false);
    }
  };

  const filtered = useMemo(() =>
    tags.filter(t => {
      const q = search.toLowerCase();
      const matchesSearch =
        t.name.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q);
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    }),
    [tags, search, filterType]
  );

  const activeCount = tags.filter(t => t.is_active).length;

  const previewTag: AdTag | null = modal?.tag.id
    ? (tags.find(t => t.id === modal.tag.id) ?? null)
    : modal?.tag.code
    ? ({
        id: 'preview',
        name:      modal.tag.name      ?? 'Preview',
        type:      modal.tag.type      ?? 'banner',
        code_type: modal.tag.code_type ?? 'html',
        code:      modal.tag.code      ?? '',
        position:  modal.tag.position  ?? 'global',
        is_active: true,
        priority:  0,
        notes:     '',
        created_at: '',
        updated_at: '',
      })
    : null;

  return (
    <div className="pb-28 pt-2 space-y-5">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-[14px] text-[14px] font-medium shadow-xl flex items-center gap-2 pointer-events-none whitespace-nowrap ${toast.ok ? 'bg-brand-success text-white' : 'bg-brand-live text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Ad Tags</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">
            {tags.length} tags ·{' '}
            <span className="text-brand-success">{activeCount} active</span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
        >
          <Plus size={16} /> Add Tag
        </button>
      </div>

      {/* Supabase connection status */}
      {error && (
        <div className="mx-4 flex items-center gap-2.5 px-4 py-3 bg-brand-warning/8 border border-brand-warning/20 rounded-[14px]">
          <WifiOff size={15} className="text-brand-warning shrink-0" />
          <p className="text-[13px] text-brand-warning">{error}</p>
        </div>
      )}

      {/* Search + Filter */}
      <div className="px-4 space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search tags, code, notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>

        {/* Type filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {(['all', 'banner', 'interstitial', 'native', 'custom'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all',
                filterType === t
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-app-elevated text-text-secondary border-ios-sep'
              )}
            >
              {t === 'all' ? 'All' : TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag list */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'tag' : 'tags'}`}
        </p>

        {!loading && filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <Code2 size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">
              {tags.length === 0 ? 'No ad tags yet — add your first one' : 'No tags match your filter'}
            </p>
            {tags.length === 0 && (
              <button
                onClick={openAdd}
                className="mt-1 px-5 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80"
              >
                Add First Tag
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((tag, i) => {
              const tm = TYPE_META[tag.type];
              const pm = POSITION_META[tag.position];
              const cm = CODE_TYPE_META[tag.code_type];
              const Icon = cm.icon;

              return (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-app-card rounded-[18px] overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Icon */}
                    <div className={cn('w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0', tm.bg)}>
                      <Icon size={18} className={tm.color} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold text-text-primary truncate">{tag.name}</span>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide', tm.bg, tm.color)}>
                          {tm.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] text-text-muted">{pm.label}</span>
                        <span className="text-text-muted text-[10px]">·</span>
                        <span className="text-[12px] text-text-muted">{cm.label}</span>
                        {tag.priority > 0 && (
                          <>
                            <span className="text-text-muted text-[10px]">·</span>
                            <span className="text-[12px] text-brand-warning">P{tag.priority}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <IOSToggle value={tag.is_active} onChange={() => handleToggle(tag.id)} />
                  </div>

                  {/* Code preview */}
                  {tag.code && (
                    <div className="mx-4 mb-3 px-3 py-2.5 bg-app-elevated rounded-[10px] border border-ios-sep">
                      <p className="text-[11px] font-mono text-text-muted line-clamp-2 break-all">
                        {tag.code}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-4 pb-3">
                    {confirmDeleteId === tag.id ? (
                      <div className="flex items-center gap-2 p-3 bg-brand-live/5 rounded-[12px] border border-brand-live/20">
                        <AlertTriangle size={14} className="text-brand-live shrink-0" />
                        <p className="flex-1 text-[13px] text-brand-live">Delete "{tag.name}"?</p>
                        <button onClick={() => handleDelete(tag.id)} className="px-3 py-1.5 bg-brand-live text-white text-[12px] font-medium rounded-[10px] active:opacity-70">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-app-elevated text-text-secondary text-[12px] font-medium rounded-[10px] active:opacity-70 border border-ios-sep">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(tag)}
                          className="flex-1 py-2.5 bg-brand-primary/10 text-brand-primary rounded-[12px] text-[13px] font-medium flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(tag.id)}
                          className="py-2.5 px-4 bg-brand-live/10 text-brand-live rounded-[12px] text-[13px] font-medium active:opacity-70 transition-opacity"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="w-full sm:max-w-lg bg-app-card rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>

              {/* Modal header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-ios-sep">
                <h2 className="text-[18px] font-semibold text-text-primary">
                  {modal.mode === 'add' ? 'New Ad Tag' : 'Edit Ad Tag'}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Preview toggle */}
                  {modal.tag.code && (
                    <button
                      onClick={() => setShowPreview(s => !s)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all',
                        showPreview
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-app-elevated text-text-secondary border-ios-sep'
                      )}
                    >
                      {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showPreview ? 'Hide' : 'Preview'}
                    </button>
                  )}
                  <button onClick={closeModal} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60">
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">

                {/* Live preview panel */}
                <AnimatePresence>
                  {showPreview && previewTag && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border border-ios-sep rounded-[14px] overflow-hidden bg-app-elevated">
                        <div className="px-4 py-2 border-b border-ios-sep flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-brand-success rounded-full animate-pulse" />
                          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Live Preview</span>
                        </div>
                        <div className="p-3">
                          <AdTagRenderer tag={previewTag} height={120} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Tag Name</label>
                  <input
                    value={modal.tag.name ?? ''}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. Home Banner, AdSense Script…"
                    autoFocus
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                {/* Type + Code Type */}
                <div className="grid grid-cols-2 gap-3">
                  <SelectRow
                    label="Ad Type"
                    value={modal.tag.type ?? 'banner'}
                    onChange={v => setField('type', v)}
                    options={Object.entries(TYPE_META).map(([k, v]) => ({ value: k as AdTagType, label: v.label }))}
                  />
                  <SelectRow
                    label="Code Type"
                    value={modal.tag.code_type ?? 'html'}
                    onChange={v => setField('code_type', v)}
                    options={Object.entries(CODE_TYPE_META).map(([k, v]) => ({ value: k as AdCodeType, label: v.label }))}
                  />
                </div>

                {/* Code / URL input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal">
                      {modal.tag.code_type === 'url' ? 'Ad URL' : 'Ad Code'}
                    </label>
                    <span className="text-[11px] text-text-muted">
                      {CODE_TYPE_META[modal.tag.code_type ?? 'html'].hint}
                    </span>
                  </div>

                  {modal.tag.code_type === 'url' ? (
                    <input
                      type="url"
                      value={modal.tag.code ?? ''}
                      onChange={e => setField('code', e.target.value)}
                      placeholder="https://example.com/ad-iframe"
                      className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all font-mono"
                    />
                  ) : (
                    <textarea
                      value={modal.tag.code ?? ''}
                      onChange={e => setField('code', e.target.value)}
                      rows={6}
                      placeholder={
                        modal.tag.code_type === 'javascript'
                          ? 'document.write("<script>…</script>");'
                          : '<ins class="adsbygoogle"\n  style="display:block"\n  data-ad-client="ca-pub-XXXX"\n  data-ad-slot="YYYY"\n  data-ad-format="auto"\n  data-full-width-responsive="true">\n</ins>'
                      }
                      spellCheck={false}
                      className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all font-mono resize-none leading-relaxed"
                    />
                  )}
                </div>

                {/* Position + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <SelectRow
                    label="Position"
                    value={modal.tag.position ?? 'global'}
                    onChange={v => setField('position', v)}
                    options={Object.entries(POSITION_META).map(([k, v]) => ({ value: k as AdPosition, label: v.label }))}
                  />
                  <div className="space-y-1.5">
                    <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
                      Priority <span className="normal-case tracking-normal text-text-muted">(0 = low)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={modal.tag.priority ?? 0}
                      onChange={e => setField('priority', parseInt(e.target.value) || 0)}
                      className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary outline-none focus:border-brand-primary transition-all"
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between py-3 px-4 bg-app-elevated rounded-[14px] border border-ios-sep">
                  <div>
                    <p className="text-[15px] font-normal text-text-primary">Active</p>
                    <p className="text-[12px] text-text-muted font-normal">Show this ad in the app right now</p>
                  </div>
                  <IOSToggle
                    value={modal.tag.is_active ?? true}
                    onChange={() => setField('is_active', !(modal.tag.is_active ?? true))}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
                    Notes <span className="normal-case tracking-normal text-text-muted">(optional)</span>
                  </label>
                  <input
                    value={modal.tag.notes ?? ''}
                    onChange={e => setField('notes', e.target.value)}
                    placeholder="Internal note about this ad…"
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                {/* Security notice */}
                <div className="flex items-start gap-3 px-4 py-3.5 bg-brand-warning/5 border border-brand-warning/20 rounded-[14px]">
                  <AlertTriangle size={15} className="text-brand-warning mt-[1px] shrink-0" />
                  <p className="text-[12px] text-brand-warning leading-relaxed">
                    Ad code runs in a sandboxed iframe. Only add code from trusted ad networks.
                    Scripts cannot access app data or cookies.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-5 pt-4 flex gap-3 border-t border-ios-sep">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-secondary active:opacity-70 border border-ios-sep"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-[15px] font-medium text-white active:opacity-80 flex items-center gap-2 justify-center disabled:opacity-60"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Check size={16} />
                  )}
                  {saving ? 'Saving…' : modal.mode === 'add' ? 'Create Tag' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
