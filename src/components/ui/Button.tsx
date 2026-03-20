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
      primary: 'bg-brand-blue text-white hover:bg-blue-600',
      secondary: 'bg-brand-card text-white hover:bg-slate-700',
      outline: 'border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white',
      ghost: 'bg-transparent text-white hover:bg-white/10',
      danger: 'bg-brand-red text-white hover:bg-red-600',
      success: 'bg-brand-green text-white hover:bg-green-600',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
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
