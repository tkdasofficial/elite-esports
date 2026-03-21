import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import {
  Users, Gift, TrendingUp, Search, Trash2, CheckCircle2, X,
  Copy, Check, Edit2, Plus, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/utils/helpers';

type Status   = 'active' | 'inactive';
type Campaign = { id: string; user: string; email: string; code: string; totalReferrals: number; earned: number; status: Status; joined: string };
type Modal    = { mode: 'add' | 'edit'; data: Partial<Campaign> } | null;
type Toast    = { msg: string; ok: boolean } | null;


const randomCode = (prefix = '') =>
  (prefix.slice(0, 4).toUpperCase() || 'REF') + Math.floor(Math.random() * 900 + 100);

export default function AdminReferrals() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [settings, setSettings]     = useState({ referrerReward: '50', refereeBonus: '20', maxReferrals: '100', enabled: true });
  const [modal, setModal]           = useState<Modal>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast]           = useState<Toast>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Code "${code}" copied`);
  };

  const toggleStatus = (id: string) => {
    let nextStatus: Status = 'active';
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      nextStatus = c.status === 'active' ? 'inactive' : 'active';
      return { ...c, status: nextStatus };
    }));
    const c = campaigns.find(c => c.id === id);
    showToast(`${c?.user} campaign ${c?.status === 'active' ? 'deactivated' : 'activated'}`);
  };

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setConfirmDeleteId(null);
    setExpandedId(null);
    showToast('Campaign deleted');
  };

  const openAdd = () => setModal({ mode: 'add', data: { user: '', email: '', code: '', status: 'active' } });
  const openEdit = (c: Campaign) => setModal({ mode: 'edit', data: { ...c } });

  const updateModal = (patch: Partial<Campaign>) =>
    setModal(m => m ? { ...m, data: { ...m.data, ...patch } } : m);

  const handleSave = () => {
    if (!modal) return;
    const { mode, data } = modal;
    if (!data.user?.trim())  { showToast('Username is required', false); return; }
    if (!data.code?.trim())  { showToast('Referral code is required', false); return; }

    // Check duplicate code
    const duplicate = campaigns.find(c => c.code.toUpperCase() === data.code?.toUpperCase() && c.id !== data.id);
    if (duplicate) { showToast('This code is already in use', false); return; }

    const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (mode === 'add') {
      const newCamp: Campaign = {
        id: Math.random().toString(36).slice(2),
        user: data.user!,
        email: data.email || '',
        code: data.code!.toUpperCase(),
        totalReferrals: 0,
        earned: 0,
        status: data.status as Status || 'active',
        joined: now,
      };
      setCampaigns(prev => [newCamp, ...prev]);
      showToast(`Campaign for ${newCamp.user} created`);
    } else {
      setCampaigns(prev => prev.map(c =>
        c.id === data.id ? { ...c, user: data.user!, email: data.email || c.email, code: data.code!.toUpperCase(), status: data.status as Status } : c
      ));
      showToast('Campaign updated');
    }
    setModal(null);
  };

  const handleSaveSettings = () => {
    if (!settings.referrerReward || isNaN(Number(settings.referrerReward))) { showToast('Invalid referrer reward', false); return; }
    if (!settings.refereeBonus   || isNaN(Number(settings.refereeBonus)))   { showToast('Invalid referee bonus', false); return; }
    showToast('Referral settings saved');
  };

  const filtered = campaigns.filter(c =>
    !searchQuery ||
    c.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRefs     = campaigns.reduce((a, c) => a + c.totalReferrals, 0);
  const totalEarned   = campaigns.reduce((a, c) => a + c.earned, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const convRate      = totalRefs > 0 ? ((totalRefs / (campaigns.length * 50)) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24 pt-6 text-white relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 pointer-events-none ${toast.ok ? 'bg-brand-green text-white' : 'bg-brand-red text-white'}`}>
            {toast.ok ? <CheckCircle2 size={16} /> : <X size={16} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Referral & Rewards</h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">{activeCampaigns} active campaign{activeCampaigns !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} size="sm" className="rounded-xl px-4 flex items-center gap-2">
          <Plus size={16} /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Referrals', value: totalRefs,            color: 'brand-blue',   icon: Users },
          { label: 'Rewards Paid',    value: `₹${totalEarned}`,    color: 'brand-green',  icon: Gift },
          { label: 'Conversion',      value: `${convRate}%`,       color: 'brand-yellow', icon: TrendingUp },
          { label: 'Active Campaigns',value: activeCampaigns,      color: 'brand-red',    icon: Gift },
        ].map(s => (
          <Card key={s.label} className={`p-4 bg-${s.color}/5 border-${s.color}/10`}>
            <div className="flex items-start justify-between">
              <p className={`text-[10px] font-black text-${s.color} uppercase tracking-widest opacity-70`}>{s.label}</p>
              <s.icon size={16} className={`text-${s.color} opacity-30`} />
            </div>
            <p className={`text-2xl font-black text-${s.color} mt-2 leading-none`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Settings Card */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Referral Settings</h2>
        <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'referrerReward', label: 'Referrer Reward (₹)', placeholder: '50' },
              { key: 'refereeBonus',   label: 'Referee Bonus (₹)',   placeholder: '20' },
              { key: 'maxReferrals',   label: 'Max per User',        placeholder: '100' },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{f.label}</label>
                <input
                  type="number" min="0"
                  value={(settings as any)[f.key]}
                  onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:border-brand-blue transition-all"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">Enable Referral System</p>
              <p className="text-xs text-slate-500">Allow users to invite friends and earn rewards</p>
            </div>
            <button onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
              className={cn('w-12 h-6 rounded-full relative transition-colors flex-shrink-0', settings.enabled ? 'bg-brand-blue' : 'bg-white/10')}>
              <motion.div animate={{ x: settings.enabled ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
          <Button onClick={handleSaveSettings} size="sm" className="rounded-xl flex items-center gap-2">
            <Check size={14} /> Save Settings
          </Button>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" placeholder="Search by user, code or email..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-brand-card/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600" />
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Campaigns ({filtered.length})</h2>
        {filtered.length === 0 && (
          <div className="py-14 text-center text-slate-500 text-sm font-bold">No campaigns found.</div>
        )}
        <AnimatePresence>
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
              <Card className="bg-brand-card/40 border-white/5 overflow-hidden">
                {/* Campaign row */}
                <div className="flex items-center gap-3 p-4">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm',
                    c.status === 'active' ? 'bg-brand-green/10 text-brand-green' : 'bg-white/5 text-slate-500')}>
                    {c.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm">{c.user}</h3>
                      <span className={cn('text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0',
                        c.status === 'active' ? 'bg-brand-green/15 text-brand-green' : 'bg-white/5 text-slate-500')}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{c.email || 'No email'}</p>
                    {/* Code pill + copy */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 rounded-lg px-2 py-0.5">
                        <span className="text-[11px] font-black text-brand-blue">{c.code}</span>
                        <button onClick={() => handleCopy(c.id, c.code)}
                          className="text-slate-500 hover:text-white transition-colors">
                          {copiedId === c.id ? <Check size={10} className="text-brand-green" /> : <Copy size={10} />}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-600">{c.totalReferrals} referrals · ₹{c.earned} earned</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="p-2 bg-white/5 rounded-xl text-slate-400 hover:bg-white/10 transition-colors flex-shrink-0">
                    {expandedId === c.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Expanded actions */}
                <AnimatePresence>
                  {expandedId === c.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5">
                      <div className="p-4 space-y-3">
                        {/* Info row */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-black/20 rounded-xl p-2.5">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Joined</p>
                            <p className="text-xs font-bold mt-0.5">{c.joined}</p>
                          </div>
                          <div className="bg-black/20 rounded-xl p-2.5">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Referrals</p>
                            <p className="text-xs font-black text-brand-blue mt-0.5">{c.totalReferrals}</p>
                          </div>
                          <div className="bg-black/20 rounded-xl p-2.5">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Earned</p>
                            <p className="text-xs font-black text-brand-green mt-0.5">₹{c.earned}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => openEdit(c)}
                            className="py-2 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => toggleStatus(c.id)}
                            className={cn('py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5',
                              c.status === 'active'
                                ? 'bg-white/5 text-slate-400 hover:bg-brand-yellow/10 hover:text-brand-yellow'
                                : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20')}>
                            <RotateCcw size={12} /> {c.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => setConfirmDeleteId(c.id)}
                            className="py-2 bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>

                        {/* Inline delete confirm */}
                        {confirmDeleteId === c.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center gap-2 p-3 bg-brand-red/10 rounded-xl border border-brand-red/20">
                            <p className="flex-1 text-xs font-bold text-brand-red">Delete {c.user}'s campaign?</p>
                            <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-lg">Delete</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs font-bold rounded-lg">Cancel</button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full sm:max-w-md bg-[#1a1a2e] border border-white/10 rounded-t-[28px] sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <h2 className="text-lg font-black">{modal.mode === 'add' ? 'New Campaign' : 'Edit Campaign'}</h2>
                <button onClick={() => setModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-5 space-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Username *</label>
                  <input value={modal.data.user || ''} onChange={e => updateModal({ user: e.target.value })}
                    placeholder="Enter username"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all placeholder:text-slate-600" />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                  <input value={modal.data.email || ''} onChange={e => updateModal({ email: e.target.value })}
                    placeholder="user@example.com" type="email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-brand-blue transition-all placeholder:text-slate-600" />
                </div>

                {/* Referral Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Referral Code *</label>
                  <div className="flex gap-2">
                    <input value={modal.data.code || ''} onChange={e => updateModal({ code: e.target.value.toUpperCase() })}
                      placeholder="e.g. PRO50"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-black uppercase outline-none focus:border-brand-blue transition-all placeholder:text-slate-600 tracking-widest" />
                    <button
                      onClick={() => updateModal({ code: randomCode(modal.data.user) })}
                      className="px-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:bg-white/10 transition-colors flex-shrink-0"
                      title="Generate random code"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['active', 'inactive'] as Status[]).map(s => (
                      <button key={s} onClick={() => updateModal({ status: s })}
                        className={cn('py-2.5 rounded-xl text-xs font-bold capitalize transition-all',
                          modal.data.status === s
                            ? s === 'active' ? 'bg-brand-green text-white' : 'bg-white/20 text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 p-5 border-t border-white/5">
                <Button variant="secondary" onClick={() => setModal(null)} className="flex-1 rounded-xl border-white/10">Cancel</Button>
                <Button onClick={handleSave} className="flex-1 rounded-xl flex items-center gap-2 justify-center">
                  <Check size={15} /> {modal.mode === 'add' ? 'Create' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
