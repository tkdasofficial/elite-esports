import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface SelectOption {
  value: string;
  label: string;
  emoji?: string;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  variant?: 'consumer' | 'admin';
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select…',
  variant = 'consumer',
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAdmin = variant === 'admin';

  const triggerCls = isAdmin
    ? 'w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none transition-all flex items-center justify-between gap-2 hover:bg-white/8 active:scale-[0.98]'
    : 'w-full bg-app-fill rounded-[12px] py-3 px-4 text-[16px] text-text-primary outline-none transition-colors flex items-center justify-between gap-2 active:scale-[0.98]';

  const panelCls = isAdmin
    ? 'absolute z-[200] mt-2 w-full bg-[#1a1d27] border border-white/10 rounded-2xl shadow-2xl overflow-hidden'
    : 'absolute z-[200] mt-2 w-full bg-[#16181f] border border-white/8 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden';

  const optionBase = isAdmin
    ? 'flex items-center gap-3 px-4 py-3 text-sm font-bold cursor-pointer transition-colors select-none'
    : 'flex items-center gap-3 px-4 py-[13px] text-[15px] cursor-pointer transition-colors select-none';

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className={isAdmin
          ? 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 pl-1'
          : 'block text-[13px] text-text-secondary font-normal mb-1.5 pl-1'}
        >
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={triggerCls}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {selected?.emoji && (
            <span className="text-[18px] leading-none flex-shrink-0">{selected.emoji}</span>
          )}
          <span className={`truncate ${!selected ? (isAdmin ? 'text-slate-500' : 'text-text-muted') : ''}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <ChevronDown size={isAdmin ? 15 : 16} className={isAdmin ? 'text-slate-400' : 'text-text-muted'} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={panelCls}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
          >
            <div className="max-h-[260px] overflow-y-auto overscroll-contain py-1.5">
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.12 }}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={`
                      ${optionBase}
                      ${isSelected
                        ? isAdmin
                          ? 'bg-brand-primary/15 text-brand-primary'
                          : 'bg-brand-primary/12 text-brand-primary'
                        : isAdmin
                          ? 'text-slate-300 hover:bg-white/5'
                          : 'text-text-primary hover:bg-white/5'
                      }
                      w-full text-left
                    `}
                  >
                    {opt.emoji && (
                      <span className="text-[18px] leading-none w-7 flex-shrink-0 flex items-center justify-center">
                        {opt.emoji}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-semibold">{opt.label}</span>
                      {opt.description && (
                        <span className={`block text-[11px] mt-0.5 ${isSelected ? 'text-brand-primary/70' : 'text-text-muted'}`}>
                          {opt.description}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check size={14} className="flex-shrink-0 text-brand-primary" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
