import React from 'react';
import { Lock } from 'lucide-react';

interface LockBadgeProps {
  size?: number;
  className?: string;
}

export default function LockBadge({ size = 14, className = '' }: LockBadgeProps) {
  return (
    <span className={`inline-flex items-center text-gray-400 dark:text-slate-600 ${className}`} title="This day is locked">
      <Lock className={`w-[${size}px] h-[${size}px]`} style={{ width: size, height: size }} />
    </span>
  );
}
