import React from 'react';
import clsx from 'clsx';
import {
  colors,
  typography,
  spacing,
  radius,
  matterStatusColors,
  documentStatusColors,
  filingStatusColors,
} from '../tokens';

export interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

function getStatusColors(status: string): { bg: string; text: string; border: string } {
  return (
    matterStatusColors[status] ??
    documentStatusColors[status] ??
    filingStatusColors[status] ?? {
      bg: colors.muted,
      text: colors.textSecondary,
      border: colors.border,
    }
  );
}

export function StatusPill({ status, label, className, style }: StatusPillProps) {
  const sc = getStatusColors(status);
  const displayLabel = label ?? status.replace(/_/g, ' ');

  return (
    <span
      className={clsx(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[1],
        padding: `2px ${spacing[2]}`,
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        fontFamily: typography.fontFamily,
        lineHeight: typography.lineHeight.xs,
        borderRadius: radius.sm,
        backgroundColor: sc.bg,
        color: sc.text,
        border: `1px solid ${sc.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: sc.text,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  );
}
