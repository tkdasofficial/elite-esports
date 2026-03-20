import React from 'react';
import { cn } from '@/src/utils/helpers';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.55))' }}
      >
        <rect width="32" height="32" rx="10" fill="url(#logoGradBg)" />
        <path
          d="M18 4L8 18H15L13 28L23 14H16L18 4Z"
          fill="url(#logoGrad)"
        />
        <path
          d="M18 5L9 18H15.5L13.5 26.5L22 15H15.5L17.5 5Z"
          fill="white"
          fillOpacity="0.18"
        />
        <defs>
          <linearGradient id="logoGradBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#312E81" />
            <stop offset="1" stopColor="#1E1B4B" />
          </linearGradient>
          <linearGradient id="logoGrad" x1="15.5" y1="4" x2="15.5" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A5B4FC" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
