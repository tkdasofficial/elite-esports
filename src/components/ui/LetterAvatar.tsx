import React from 'react';
import { cn } from '@/src/utils/helpers';

interface LetterAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'blue' | 'red' | 'green' | 'yellow' | 'slate';
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({
  name, size = 'md', className, variant = 'blue'
}) => {
  const first = name.charAt(0).toUpperCase();

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const variants = {
    blue:   'bg-brand-primary/15 text-brand-primary-light border border-brand-primary/25',
    red:    'bg-brand-live/15 text-brand-live border border-brand-live/25',
    green:  'bg-brand-success/15 text-brand-success border border-brand-success/25',
    yellow: 'bg-brand-gold/15 text-brand-gold border border-brand-gold/25',
    slate:  'bg-app-elevated text-text-secondary border border-app-border',
  };

  return (
    <div className={cn(
      'rounded-2xl flex items-center justify-center font-bold select-none shrink-0',
      sizes[size],
      variants[variant],
      className
    )}>
      {first}
    </div>
  );
};
