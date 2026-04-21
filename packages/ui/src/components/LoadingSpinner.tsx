import React from 'react';
import { colors } from '../tokens';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizePx: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

export function LoadingSpinner({ size = 'md', color }: LoadingSpinnerProps) {
  const dim = sizePx[size];
  const strokeColor = color ?? colors.accent;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
      style={{ animation: 'ttaylor-spinner-rotate 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.2}
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <style>{`
        @keyframes ttaylor-spinner-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
