import React from 'react';
import { cn } from '@/src/utils/helpers';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && <label className="text-xs font-medium text-slate-400 ml-1">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-blue transition-colors placeholder:text-slate-600',
            error && 'border-brand-red focus:border-brand-red',
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] text-brand-red ml-1">{error}</p>}
      </div>
    );
  }
);
