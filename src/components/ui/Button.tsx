import React from 'react';
import { cn } from '@/src/utils/helpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, ...props }, ref) => {
    const variants = {
      primary:
        'bg-brand-primary text-white hover:bg-brand-primary-light active:scale-[0.97] shadow-lg shadow-brand-primary/25',
      secondary:
        'bg-app-elevated text-text-primary hover:bg-app-card-hover border border-app-border active:scale-[0.97]',
      outline:
        'border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white active:scale-[0.97]',
      ghost:
        'bg-transparent text-text-primary hover:bg-white/8 active:scale-[0.97]',
      danger:
        'bg-brand-live text-white hover:opacity-90 active:scale-[0.97] shadow-lg shadow-brand-live/25',
      success:
        'bg-brand-success text-white hover:opacity-90 active:scale-[0.97] shadow-lg shadow-brand-success/25',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-xs font-semibold rounded-xl',
      md: 'px-5 py-2.5 text-sm font-semibold rounded-2xl',
      lg: 'px-6 py-3.5 text-sm font-semibold rounded-2xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:pointer-events-none select-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
    );
  }
);
