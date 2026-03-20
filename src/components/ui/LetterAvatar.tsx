import React from 'react';
import { cn } from '@/src/utils/helpers';

interface LetterAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'blue' | 'red' | 'green' | 'yellow' | 'slate';
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({ 
  name, 
  size = 'md', 
  className,
  variant = 'blue'
}) => {
  const firstLetter = name.charAt(0).toUpperCase();
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 text-3xl'
  };

  const variantClasses = {
    blue: 'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
    red: 'bg-brand-red/20 text-brand-red border-brand-red/30',
    green: 'bg-brand-green/20 text-brand-green border-brand-green/30',
    yellow: 'bg-brand-yellow/20 text-brand-yellow border-brand-yellow/30',
    slate: 'bg-slate-500/20 text-slate-400 border-white/10'
  };

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-black border shadow-inner select-none",
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {firstLetter}
    </div>
  );
};
