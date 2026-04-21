import React from 'react';
import clsx from 'clsx';
import { colors, typography, spacing, radius, shadow } from '../tokens';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  description?: string;
}

export function Card({ children, className, style, title, description }: CardProps) {
  return (
    <div
      className={clsx(className)}
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        boxShadow: shadow.sm,
        ...style,
      }}
    >
      {(title || description) && (
        <div
          style={{
            padding: `${spacing[4]} ${spacing[6]}`,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {title && (
            <h3
              style={{
                margin: 0,
                fontSize: typography.size.md,
                fontWeight: typography.weight.semibold,
                fontFamily: typography.fontFamily,
                color: colors.textPrimary,
                lineHeight: typography.lineHeight.md,
              }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              style={{
                margin: title ? `${spacing[1]} 0 0` : 0,
                fontSize: typography.size.sm,
                fontFamily: typography.fontFamily,
                color: colors.textSecondary,
                lineHeight: typography.lineHeight.sm,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <div style={{ padding: spacing[6] }}>{children}</div>
    </div>
  );
}
