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
        'bg-app-card border border-app-border rounded-2xl overflow-hidden',
        onClick && 'cursor-pointer active:scale-[0.985] transition-transform duration-150',
        className
      )}
    >
      {children}
    </div>
  );
};
