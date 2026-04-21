import React from 'react';
import clsx from 'clsx';
import { colors, typography, spacing } from '../tokens';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PageHeader({ title, subtitle, actions, className, style }: PageHeaderProps) {
  return (
    <div
      className={clsx(className)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: `${spacing[6]} 0`,
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: spacing[6],
        backgroundColor: colors.surface,
        ...style,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: typography.weight.bold,
            fontFamily: typography.fontFamily,
            color: colors.primary,
            lineHeight: '28px',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: `${spacing[1]} 0 0`,
              fontSize: typography.size.sm,
              fontFamily: typography.fontFamily,
              color: colors.textMuted,
              lineHeight: typography.lineHeight.sm,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          {actions}
        </div>
      )}
    </div>
  );
}
