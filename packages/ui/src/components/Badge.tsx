import React from 'react';
import clsx from 'clsx';
import { colors, typography, radius, spacing, matterStatusColors, documentStatusColors, filingStatusColors } from '../tokens';

export interface BadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
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

export function Badge({ status, label, size = 'sm', className, style }: BadgeProps) {
  const sc = getStatusColors(status);
  const displayLabel = label ?? status.replace(/_/g, ' ');

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: size === 'sm' ? `2px ${spacing[2]}` : `${spacing[1]} ${spacing[3]}`,
    fontSize: size === 'sm' ? typography.size.xs : typography.size.sm,
    fontWeight: typography.weight.semibold,
    fontFamily: typography.fontFamily,
    lineHeight: size === 'sm' ? typography.lineHeight.xs : typography.lineHeight.sm,
    borderRadius: radius.full,
    backgroundColor: sc.bg,
    color: sc.text,
    border: `1px solid ${sc.border}`,
    whiteSpace: 'nowrap',
    ...style,
  };

  return (
    <span className={clsx(className)} style={baseStyle}>
      {displayLabel}
    </span>
  );
}
