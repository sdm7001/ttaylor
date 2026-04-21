import React from 'react';
import clsx from 'clsx';
import { colors, typography, radius } from '../tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<
  ButtonVariant,
  { background: string; color: string; border: string; hoverBg: string }
> = {
  primary: {
    background: colors.accent,
    color: '#FFFFFF',
    border: 'none',
    hoverBg: colors.accentHover,
  },
  secondary: {
    background: colors.surface,
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    hoverBg: colors.muted,
  },
  ghost: {
    background: 'transparent',
    color: colors.accent,
    border: 'none',
    hoverBg: colors.accentLight,
  },
  destructive: {
    background: colors.destructive,
    color: '#FFFFFF',
    border: 'none',
    hoverBg: colors.destructiveHover,
  },
};

const sizeStyles: Record<
  ButtonSize,
  { height: string; paddingInline: string; fontSize: string }
> = {
  sm: { height: '32px', paddingInline: '12px', fontSize: typography.size.sm },
  md: { height: '36px', paddingInline: '16px', fontSize: typography.size.base },
  lg: { height: '40px', paddingInline: '20px', fontSize: typography.size.base },
};

function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 14 : size === 'md' ? 16 : 18;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'ttaylor-spin 1s linear infinite', marginRight: '6px' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        opacity={0.25}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="62.8"
        opacity={0.75}
      />
      <style>{`
        @keyframes ttaylor-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      style,
      className,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref
  ) => {
    const [hovered, setHovered] = React.useState(false);
    const vs = variantStyles[variant];
    const ss = sizeStyles[size];
    const isDisabled = disabled || loading;

    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: ss.height,
      paddingInline: ss.paddingInline,
      fontSize: ss.fontSize,
      fontFamily: typography.fontFamily,
      fontWeight: typography.weight.medium,
      lineHeight: '1',
      borderRadius: radius.md,
      border: vs.border,
      background: hovered && !isDisabled ? vs.hoverBg : vs.background,
      color: vs.color,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'background 150ms ease, opacity 150ms ease',
      outline: 'none',
      whiteSpace: 'nowrap',
      ...style,
    };

    return (
      <button
        ref={ref}
        className={clsx(className)}
        style={baseStyle}
        disabled={isDisabled}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
        {...rest}
      >
        {loading && <Spinner size={size} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
