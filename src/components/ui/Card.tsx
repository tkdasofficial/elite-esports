import React from 'react';
import { cn } from '@/src/utils/helpers';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-brand-card border border-white/5 rounded-xl overflow-hidden',
        onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
    >
      {children}
    </div>
  );
};
