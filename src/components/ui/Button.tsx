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
        'bg-brand-primary text-white active:opacity-75 shadow-md shadow-brand-primary/20',
      secondary:
        'bg-app-elevated text-text-primary active:opacity-75',
      outline:
        'border border-brand-primary/50 text-brand-primary active:opacity-75',
      ghost:
        'bg-transparent text-brand-primary-light active:opacity-75',
      danger:
        'bg-brand-live text-white active:opacity-75',
      success:
        'bg-brand-success text-white active:opacity-75',
    };

    const sizes = {
      sm: 'px-4 py-2 text-[14px] font-semibold rounded-[12px]',
      md: 'px-5 py-[11px] text-[15px] font-semibold rounded-[14px]',
      lg: 'px-6 py-[14px] text-[16px] font-semibold rounded-[16px]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-opacity duration-150 focus:outline-none disabled:opacity-30 disabled:pointer-events-none select-none',
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
Button.displayName = 'Button';
