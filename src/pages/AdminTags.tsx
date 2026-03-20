import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Code, Plus, Trash2, Edit2, ExternalLink, Copy, Check, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminTags() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tags, setTags] = useState([
    { id: '1', name: 'Google Ads Sidebar', type: 'HTML/JS', content: '<script src="https://ads.google.com/..." async></script>', status: 'active' },
    { id: '2', name: 'Facebook Pixel', type: 'JS', content: 'fbq("init", "123456789"); fbq("track", "PageView");', status: 'active' },
    { id: '3', name: 'Affiliate Banner', type: 'HTML', content: '<a href="https://affiliate.com"><img src="..." /></a>', status: 'inactive' },
  ]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      setTags(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setTags(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t
    ));
  };

  const addTag = () => {
    const newTag = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Ad Tag',
      type: 'HTML',
      content: '<!-- Paste code here -->',
      status: 'inactive'
    };
    setTags(prev => [...prev, newTag]);
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 pb-24 pt-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight">Ad Tags & Links</h1>
        <Button onClick={addTag} size="sm" className="rounded-xl px-4 flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} />
          New Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tags.map((tag, i) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5 bg-brand-card/40 border-white/5 space-y-4 group hover:bg-brand-card/50 transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Code size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">{tag.name}</h3>
                    <div className="flex items-center gap-2.5 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{tag.type}</span>
                      <button 
                        onClick={() => toggleStatus(tag.id)}
                        className={`text-[10px] font-black uppercase flex-shrink-0 px-2 py-0.5 rounded-full ${
                          tag.status === 'active' ? 'bg-brand-green/10 text-brand-green' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tag.status}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(tag.id)}
                    className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-red hover:bg-brand-red/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="relative group/code">
                <pre className="bg-black/40 p-4 rounded-2xl text-[11px] font-mono text-slate-400 overflow-x-auto border border-white/5 scrollable-content max-h-[120px]">
                  {tag.content}
                </pre>
                <button 
                  onClick={() => handleCopy(tag.id, tag.content)}
                  className="absolute top-3 right-3 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md border border-white/10"
                  title="Copy Code"
                >
                  {copiedId === tag.id ? <Check size={14} className="text-brand-green" /> : <Copy size={14} />}
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 px-1">Global Ad Settings</h2>
        <Card className="p-4 sm:p-6 bg-brand-card/40 border-white/5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-bold truncate">Enable Ad-Block Detection</p>
              <p className="text-xs text-slate-500 line-clamp-2">Show a message to users with ad-blockers</p>
            </div>
            <div className="w-12 h-6 bg-white/10 rounded-full relative flex-shrink-0">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-bold truncate">Ad Frequency Cap</p>
              <p className="text-xs text-slate-500 line-clamp-2">Limit how many ads a user sees per session</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold text-slate-400">3 ads</span>
              <ChevronRight size={16} className="text-slate-600" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
