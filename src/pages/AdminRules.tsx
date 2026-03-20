import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { FileText, Plus, Edit2, Trash2, Save, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminRules() {
  const [rules, setRules] = useState([
    { id: '1', title: 'Tournament Rules', lastUpdated: '20 Mar, 10:30 AM', status: 'published', content: '# Tournament Rules\n\n1. No cheating.\n2. Respect others.\n3. Fair play.' },
    { id: '2', title: 'Privacy Policy', lastUpdated: '15 Mar, 09:15 AM', status: 'published', content: '# Privacy Policy\n\nWe value your privacy...' },
    { id: '3', title: 'Terms of Service', lastUpdated: '10 Mar, 08:00 PM', status: 'published', content: '# Terms of Service\n\nBy using our service...' },
    { id: '4', title: 'Refund Policy', lastUpdated: '05 Mar, 04:30 PM', status: 'draft', content: '# Refund Policy\n\nRefunds are processed within 7 days.' },
  ]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEdit = (rule: any) => {
    setSelectedRuleId(rule.id);
    setEditContent(rule.content);
  };

  const handleSave = () => {
    if (!selectedRuleId) return;
    setRules(prev => prev.map(r => 
      r.id === selectedRuleId 
        ? { ...r, content: editContent, lastUpdated: new Date().toLocaleString(), status: 'draft' } 
        : r
    ));
    alert('Draft saved!');
  };

  const handlePublish = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'published', lastUpdated: new Date().toLocaleString() } : r
    ));
    alert('Rule published!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this policy?')) {
      setRules(prev => prev.filter(r => r.id !== id));
      if (selectedRuleId === id) {
        setSelectedRuleId(null);
        setEditContent('');
      }
    }
  };

  const handleNew = () => {
    const newRule = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Policy',
      lastUpdated: 'Just now',
      status: 'draft',
      content: '# New Policy\n\nWrite here...'
    };
    setRules(prev => [...prev, newRule]);
    handleEdit(newRule);
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Rules & Policies</h1>
        <Button onClick={handleNew} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} />
          New Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rules.map((policy, i) => (
          <motion.div
            key={policy.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`p-5 bg-brand-card/40 border-white/5 space-y-4 group transition-all duration-300 ${selectedRuleId === policy.id ? 'border-brand-blue/50 ring-1 ring-brand-blue/20 bg-brand-card/60' : 'hover:bg-brand-card/50'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedRuleId === policy.id ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue'
                  }`}>
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">{policy.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Updated: {policy.lastUpdated}</span>
                      <span className={`text-[10px] font-black uppercase flex-shrink-0 px-2 py-0.5 rounded-full ${
                        policy.status === 'published' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'
                      }`}>{policy.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(policy)}
                    className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all"
                    title="Edit Policy"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(policy.id)}
                    className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-red hover:bg-brand-red/10 transition-all"
                    title="Delete Policy"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="rounded-xl border-white/5 text-[11px] h-10 font-bold uppercase tracking-wider"
                  onClick={() => handleEdit(policy)}
                >
                  <Eye size={14} className="mr-2" />
                  Preview
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="rounded-xl border-white/5 text-[11px] h-10 font-bold uppercase tracking-wider"
                  onClick={() => handlePublish(policy.id)}
                  disabled={policy.status === 'published'}
                >
                  <Save size={14} className="mr-2" />
                  {policy.status === 'published' ? 'Live' : 'Publish'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1 truncate">
          {selectedRuleId ? `Editing: ${rules.find(r => r.id === selectedRuleId)?.title}` : 'Quick Editor'}
        </h2>
        <Card className="p-4 sm:p-6 bg-brand-card/40 border-white/5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Policy Content (Markdown Supported)</label>
            <textarea 
              placeholder="Enter policy content here..." 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-brand-card/40 border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-brand-blue outline-none transition-all placeholder:text-slate-600 min-h-[300px] font-mono scrollable-content"
            />
          </div>
          <Button 
            onClick={handleSave} 
            fullWidth 
            className="rounded-xl h-11 sm:h-10"
            disabled={!selectedRuleId}
          >
            Save Draft
          </Button>
        </Card>
      </div>
    </div>
  );
}
