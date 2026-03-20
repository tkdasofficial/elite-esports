import React from 'react';
import { cn } from '@/src/utils/helpers';

interface TagProps {
  children: React.ReactNode;
  variant?: 'live' | 'upcoming' | 'completed' | 'rank' | 'default' | 'cyan';
  className?: string;
}

export const Tag: React.FC<TagProps> = ({ children, variant = 'default', className }) => {
  const variants = {
    live: 'bg-brand-live/15 text-brand-live border border-brand-live/25',
    upcoming: 'bg-brand-warning/15 text-brand-warning border border-brand-warning/25',
    completed: 'bg-text-muted/15 text-text-secondary border border-text-muted/20',
    rank: 'bg-brand-primary/15 text-brand-primary-light border border-brand-primary/25',
    cyan: 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/25',
    default: 'bg-app-elevated text-text-secondary border border-app-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
