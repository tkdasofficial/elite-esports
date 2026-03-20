import React from 'react';
import { cn } from '@/src/utils/helpers';

interface LetterAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'blue' | 'red' | 'green' | 'yellow' | 'slate';
}

const COLORS = [
  ['#5E5CE6', '#3A38B0'],
  ['#FF453A', '#C93530'],
  ['#30D158', '#229A40'],
  ['#FFD60A', '#BFA000'],
  ['#5AC8FA', '#3A9EC7'],
  ['#FF9F0A', '#C97A00'],
  ['#FF6482', '#C74060'],
  ['#63E6BE', '#35B08A'],
];

function pickColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({
  name, size = 'md', className,
}) => {
  const first = name.charAt(0).toUpperCase();
  const [from, to] = pickColor(name);

  const sizes: Record<string, string> = {
    xs: 'w-7 h-7 text-[11px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-[60px] h-[60px] text-xl',
    xl: 'w-[88px] h-[88px] text-3xl',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold select-none shrink-0',
        sizes[size],
        className
      )}
      style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
    >
      {first}
    </div>
  );
};
