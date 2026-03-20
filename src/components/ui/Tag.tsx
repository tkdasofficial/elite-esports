import React from 'react';
import { cn } from '@/src/utils/helpers';

interface TagProps {
  children: React.ReactNode;
  variant?: 'live' | 'upcoming' | 'completed' | 'rank' | 'default';
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ children, variant = 'default', className }) => {
  const variants = {
    live: 'bg-brand-red text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    upcoming: 'bg-brand-yellow text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]',
    completed: 'bg-slate-600 text-white',
    rank: 'bg-brand-blue text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    default: 'bg-slate-700 text-slate-100',
  };

  return (
    <span className={cn('px-3 h-[17px] flex items-center justify-center rounded text-[10px] font-black uppercase tracking-tighter transition-all leading-none', variants[variant], className)}>
      {children}
    </span>
  );
};
