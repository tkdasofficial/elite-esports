import React from 'react';
import { cn } from '@/src/utils/helpers';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className, size = 32 }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
      >
        {/* Main Bolt Body */}
        <path
          d="M13 2L4 14H11L10 22L19 10H12L13 2Z"
          fill="url(#thunderGradient)"
          stroke="url(#thunderGradient)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        
        {/* Inner Highlight for Depth */}
        <path
          d="M13 3L6 13H12L11 20L17 11H11L12 3Z"
          fill="white"
          fillOpacity="0.2"
        />

        {/* Outer Glow Path */}
        <path
          d="M13 2L4 14H11L10 22L19 10H12L13 2Z"
          stroke="white"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />

        <defs>
          <linearGradient
            id="thunderGradient"
            x1="11.5"
            y1="2"
            x2="11.5"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
