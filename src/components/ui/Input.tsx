import React from 'react';
import { cn } from '@/src/utils/helpers';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-xs font-semibold text-text-secondary ml-1 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-app-elevated border border-app-border rounded-2xl py-3.5 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:bg-app-card-hover transition-all duration-200',
              icon ? 'pl-11 pr-4' : 'px-4',
              error && 'border-brand-live focus:border-brand-live',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-brand-live ml-1 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
