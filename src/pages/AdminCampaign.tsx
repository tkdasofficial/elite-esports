import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, CheckCircle2, X, Check, Tag, Percent, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformStore, PromoCode } from '@/src/store/platformStore';
import { cn } from '@/src/utils/helpers';

type ModalState = { mode: 'add' | 'edit'; promo: Partial<PromoCode> } | null;
type Toast = { msg: string; ok: boolean } | null;

const EMPTY_PROMO: Partial<PromoCode> = {
  code: '', discount: 10, type: 'percentage', maxUses: 100, expiry: '', isActive: true,
};

export default function AdminCampaign() {
  const { promoCodes, addPromoCode, updatePromoCode, deletePromoCode, togglePromoCode } = usePlatformStore();
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState<ModalState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast]     = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openAdd  = () => setModal({ mode: 'add',  promo: { ...EMPTY_PROMO } });
  const openEdit = (p: PromoCode) => setModal({ mode: 'edit', promo: { ...p } });

  const handleSave = () => {
    if (!modal) return;
    const { mode, promo } = modal;
    if (!promo.code?.trim())   { showToast('Code is required', false); return; }
    if (!promo.discount)       { showToast('Discount value is required', false); return; }
    if (!promo.expiry?.trim()) { showToast('Expiry date is required', false); return; }

    if (mode === 'add') {
      const exists = promoCodes.some(p => p.code.toUpperCase() === promo.code!.toUpperCase().trim());
      if (exists) { showToast('Code already exists', false); return; }
      addPromoCode({
        code: promo.code!.toUpperCase().trim(),
        discount: Number(promo.discount),
        type: promo.type as 'percentage' | 'flat',
        maxUses: Number(promo.maxUses) || 100,
        expiry: promo.expiry!,
        isActive: true,
      });
      showToast(`"${promo.code!.toUpperCase()}" added`);
    } else {
      updatePromoCode(promo.id!, {
        code: promo.code!.toUpperCase().trim(),
        discount: Number(promo.discount),
        type: promo.type as 'percentage' | 'flat',
        maxUses: Number(promo.maxUses),
        expiry: promo.expiry!,
        isActive: promo.isActive,
      });
      showToast('Promo updated');
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    const p = promoCodes.find(p => p.id === id);
    deletePromoCode(id);
    setConfirmDeleteId(null);
    showToast(`"${p?.code}" deleted`);
  };

  const handleToggle = (id: string) => {
    const p = promoCodes.find(p => p.id === id);
    togglePromoCode(id);
    showToast(`${p?.code} ${p?.isActive ? 'deactivated' : 'activated'}`);
  };

  const setField = (key: keyof PromoCode, value: any) =>
    setModal(m => m ? { ...m, promo: { ...m.promo, [key]: value } } : m);

  const filtered = useMemo(() =>
    promoCodes.filter(p => p.code.toLowerCase().includes(search.toLowerCase())),
    [promoCodes, search]
  );

  const isExpired = (expiry: string) => new Date(expiry) < new Date();
  const activeCount = promoCodes.filter(p => p.isActive && !isExpired(p.expiry)).length;

  return (
    <div className="pb-24 pt-2 space-y-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-[14px] text-[14px] font-medium shadow-xl flex items-center gap-2 pointer-events-none whitespace-nowrap ${toast.ok ? 'bg-brand-success text-white' : 'bg-brand-live text-white'}`}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary tracking-[-0.5px]">Promo Codes</h1>
          <p className="text-[13px] text-text-muted font-normal mt-0.5">
            {promoCodes.length} total · <span className="text-brand-success">{activeCount} active</span>
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Search */}
      <div className="px-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search promo codes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-app-elevated rounded-[14px] py-3 pl-11 pr-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none border border-ios-sep focus:border-brand-primary transition-all"
          />
        </div>
      </div>

      {/* List */}
      <section className="px-4 space-y-2">
        <p className="text-[13px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
          {filtered.length} {filtered.length === 1 ? 'code' : 'codes'}
        </p>

        {filtered.length === 0 ? (
          <div className="bg-app-card rounded-[18px] py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-app-elevated flex items-center justify-center">
              <Tag size={24} className="text-text-muted" />
            </div>
            <p className="text-[15px] text-text-muted font-normal">
              {promoCodes.length === 0 ? 'No promo codes yet' : 'No codes match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((promo, i) => {
              const expired = isExpired(promo.expiry);
              const pct     = Math.round(((promo.usedCount ?? 0) / (promo.maxUses ?? 1)) * 100);
              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-app-card rounded-[18px] overflow-hidden"
                >
                  <div className="px-4 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[17px] font-bold text-text-primary tracking-wider">{promo.code}</span>
                          {expired ? (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-live/10 text-brand-live">Expired</span>
                          ) : promo.isActive ? (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-success/10 text-brand-success">Active</span>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-app-elevated text-text-muted border border-ios-sep">Off</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[13px] font-semibold text-brand-primary flex items-center gap-1">
                            {promo.type === 'percentage' ? <Percent size={13} /> : '₹'}
                            {promo.discount} {promo.type === 'percentage' ? 'off' : 'flat'}
                          </span>
                          <span className="text-[12px] text-text-muted flex items-center gap-1">
                            <Clock size={11} /> {new Date(promo.expiry).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {/* iOS Toggle */}
                      <button
                        onClick={() => !expired && handleToggle(promo.id)}
                        disabled={expired}
                        className={cn(
                          'w-[51px] h-[31px] rounded-full relative transition-colors duration-200 flex-shrink-0',
                          promo.isActive && !expired ? 'bg-brand-success' : 'bg-app-elevated border border-ios-sep'
                        )}
                      >
                        <motion.div
                          animate={{ x: promo.isActive && !expired ? 22 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-[3px] w-[25px] h-[25px] bg-white rounded-full shadow-md"
                        />
                      </button>
                    </div>

                    {/* Usage bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-text-muted">Usage</span>
                        <span className="text-[12px] font-medium text-text-primary">{promo.usedCount ?? 0} / {promo.maxUses}</span>
                      </div>
                      <div className="h-1.5 bg-app-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>

                    {/* Actions */}
                    {confirmDeleteId === promo.id ? (
                      <div className="flex items-center gap-2 p-3 bg-brand-live/5 rounded-[12px] border border-brand-live/20">
                        <p className="flex-1 text-[13px] text-brand-live">Delete "{promo.code}"?</p>
                        <button onClick={() => handleDelete(promo.id)} className="px-3 py-1.5 bg-brand-live text-white text-[12px] font-medium rounded-[10px] active:opacity-70">Delete</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-app-elevated text-text-secondary text-[12px] font-medium rounded-[10px] active:opacity-70 border border-ios-sep">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(promo)}
                          className="flex-1 py-2.5 bg-brand-primary/10 text-brand-primary rounded-[12px] text-[13px] font-medium flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(promo.id)}
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

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease: [0.32, 0, 0.67, 0] }}
              className="w-full sm:max-w-lg bg-app-card rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-[5px] bg-app-elevated rounded-full" />
              </div>
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-ios-sep">
                <h2 className="text-[18px] font-semibold text-text-primary">{modal.mode === 'add' ? 'New Promo Code' : 'Edit Promo Code'}</h2>
                <button onClick={() => setModal(null)} className="w-8 h-8 bg-app-elevated rounded-full flex items-center justify-center text-text-secondary active:opacity-60"><X size={15} /></button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Code</label>
                  <input
                    value={modal.promo.code || ''}
                    onChange={e => setField('code', e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER50"
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] font-mono font-bold text-text-primary placeholder:text-text-muted placeholder:font-normal outline-none focus:border-brand-primary transition-all uppercase tracking-wider"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Discount Type</label>
                  <div className="flex gap-2">
                    {(['percentage', 'flat'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setField('type', t)}
                        className={cn(
                          'flex-1 py-3 rounded-[14px] text-[14px] font-medium capitalize flex items-center justify-center gap-2 border transition-all',
                          modal.promo.type === t
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                            : 'bg-app-elevated border-ios-sep text-text-secondary'
                        )}
                      >
                        {t === 'percentage' ? <Percent size={15} /> : <span>₹</span>} {t === 'percentage' ? 'Percentage' : 'Flat Rate'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">
                      {modal.promo.type === 'percentage' ? 'Discount %' : 'Discount ₹'}
                    </label>
                    <input
                      type="number"
                      value={modal.promo.discount || ''}
                      onChange={e => setField('discount', Number(e.target.value))}
                      placeholder="10"
                      className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Max Uses</label>
                    <input
                      type="number"
                      value={modal.promo.maxUses || ''}
                      onChange={e => setField('maxUses', Number(e.target.value))}
                      placeholder="100"
                      className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-brand-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] text-text-secondary uppercase tracking-[0.06em] font-normal px-1">Expiry Date</label>
                  <input
                    type="date"
                    value={modal.promo.expiry || ''}
                    onChange={e => setField('expiry', e.target.value)}
                    className="w-full bg-app-elevated border border-ios-sep rounded-[14px] py-3 px-4 text-[15px] text-text-primary outline-none focus:border-brand-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex-shrink-0 p-5 pt-4 flex gap-3 border-t border-ios-sep">
                <button onClick={() => setModal(null)} className="flex-1 py-3.5 bg-app-elevated rounded-[14px] text-[15px] font-medium text-text-secondary active:opacity-70 border border-ios-sep">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-3.5 bg-brand-primary rounded-[14px] text-[15px] font-medium text-white active:opacity-80 flex items-center gap-2 justify-center">
                  <Check size={16} /> {modal.mode === 'add' ? 'Create' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
