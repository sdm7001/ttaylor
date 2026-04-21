import React from 'react';
import { Inbox } from 'lucide-react';
import clsx from 'clsx';
import { colors, typography, spacing } from '../tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function EmptyState({
  icon,
  heading,
  body,
  actionLabel,
  onAction,
  className,
  style,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(className)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing[9]} ${spacing[6]}`,
        textAlign: 'center',
        ...style,
      }}
    >
      <div style={{ color: colors.textMuted, marginBottom: spacing[3] }}>
        {icon ?? <Inbox size={48} />}
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
          fontFamily: typography.fontFamily,
          color: colors.textPrimary,
          lineHeight: typography.lineHeight.lg,
        }}
      >
        {heading}
      </h3>
      {body && (
        <p
          style={{
            margin: `${spacing[2]} 0 0`,
            fontSize: typography.size.sm,
            fontFamily: typography.fontFamily,
            color: colors.textSecondary,
            lineHeight: typography.lineHeight.sm,
            maxWidth: '360px',
          }}
        >
          {body}
        </p>
      )}
      {actionLabel && onAction && (
        <div style={{ marginTop: spacing[5] }}>
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
