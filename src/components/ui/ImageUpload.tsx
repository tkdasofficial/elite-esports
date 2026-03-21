import React, { useRef, useState, useCallback } from 'react';
import { Upload, Link2, ImageOff, X, Image } from 'lucide-react';
import { cn } from '@/src/utils/helpers';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  aspect?: 'square' | 'wide';
  hint?: string;
  required?: boolean;
}

type Tab = 'url' | 'upload';

export function ImageUpload({
  label,
  value,
  onChange,
  aspect = 'wide',
  hint,
  required,
}: ImageUploadProps) {
  const [tab, setTab] = useState<Tab>(() => (value?.startsWith('data:') ? 'upload' : 'url'));
  const [urlInput, setUrlInput] = useState(() => (value?.startsWith('data:') ? '' : value || ''));
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewSrc = tab === 'url' ? urlInput : value?.startsWith('data:') ? value : '';

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    setImgErr(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleUrlChange = (v: string) => {
    setUrlInput(v);
    setImgErr(false);
    onChange(v);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setImgErr(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const hasImage = !!previewSrc && !imgErr;
  const previewH = aspect === 'square' ? 'h-32' : 'h-40';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}{required && <span className="text-brand-red ml-0.5">*</span>}
        </label>
        {hasImage && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-red transition-colors px-2 py-0.5 rounded-md hover:bg-brand-red/10"
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      <div className="flex bg-white/5 rounded-xl p-0.5 gap-0.5">
        {([
          { id: 'url' as Tab, icon: Link2, label: 'URL' },
          { id: 'upload' as Tab, icon: Upload, label: 'Upload' },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setImgErr(false);
              if (t.id === 'url' && value?.startsWith('data:')) {
                setUrlInput('');
              }
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
              tab === t.id
                ? 'bg-brand-blue text-white shadow'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'url' && (
        <input
          type="url"
          value={urlInput}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="https://..."
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-brand-blue transition-all placeholder:text-slate-600"
        />
      )}

      {tab === 'upload' && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl transition-all cursor-pointer',
            dragging ? 'border-brand-blue bg-brand-blue/5' : 'border-white/10 hover:border-white/20'
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-brand-blue rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Processing…</p>
            </div>
          ) : value?.startsWith('data:') ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                <img src={value} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-green truncate">Image uploaded</p>
                <p className="text-[10px] text-slate-500">Click to replace</p>
              </div>
              <Upload size={14} className="text-slate-500 flex-shrink-0" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                dragging ? 'bg-brand-blue/20 text-brand-blue' : 'bg-white/5 text-slate-500'
              )}>
                <Upload size={18} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400">
                  {dragging ? 'Drop to upload' : 'Click or drag & drop'}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">PNG, JPG, WebP — stored locally</p>
              </div>
            </div>
          )}
        </div>
      )}

      {previewSrc && (
        <div className={cn('w-full rounded-xl overflow-hidden border border-white/10', previewH)}>
          {imgErr ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600 bg-white/3">
              <ImageOff size={20} />
              <span className="text-[11px] font-bold">Invalid image URL</span>
            </div>
          ) : (
            <img
              src={previewSrc}
              alt="Preview"
              className={cn('w-full h-full', aspect === 'square' ? 'object-contain bg-white/5' : 'object-cover')}
              referrerPolicy="no-referrer"
              onError={() => setImgErr(true)}
              onLoad={() => setImgErr(false)}
            />
          )}
        </div>
      )}

      {!previewSrc && (
        <div className={cn(
          'w-full rounded-xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-1.5 text-slate-700',
          previewH
        )}>
          <Image size={20} />
          <span className="text-[11px] font-bold">Preview</span>
        </div>
      )}

      {hint && <p className="text-[10px] text-slate-600 px-1">{hint}</p>}
    </div>
  );
}
