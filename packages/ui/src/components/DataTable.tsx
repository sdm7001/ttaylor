import React from 'react';
import clsx from 'clsx';
import { colors, typography, spacing, shadow, radius } from '../tokens';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelect?: (ids: Set<string>) => void;
  rowKey?: (row: T) => string;
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td
          key={i}
          style={{
            padding: `${spacing[3]} ${spacing[4]}`,
          }}
        >
          <div
            style={{
              height: '14px',
              width: `${60 + Math.random() * 30}%`,
              backgroundColor: colors.muted,
              borderRadius: radius.sm,
              animation: 'ttaylor-skeleton 1.5s ease-in-out infinite',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  onRowClick,
  selectedIds,
  onSelect,
  rowKey,
  className,
  style,
}: DataTableProps<T>) {
  const hasSelection = selectedIds !== undefined && onSelect !== undefined;
  const getKey = rowKey ?? ((row: T) => (row as Record<string, unknown>)['id'] as string);

  const allSelected = data.length > 0 && data.every((row) => selectedIds?.has(getKey(row)));

  function toggleAll() {
    if (!onSelect) return;
    if (allSelected) {
      onSelect(new Set());
    } else {
      onSelect(new Set(data.map(getKey)));
    }
  }

  function toggleRow(id: string) {
    if (!onSelect || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelect(next);
  }

  return (
    <div
      className={clsx(className)}
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        boxShadow: shadow.sm,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        ...style,
      }}
    >
      <style>{`
        @keyframes ttaylor-skeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: typography.fontFamily,
          fontSize: typography.size.base,
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: colors.background,
            }}
          >
            {hasSelection && (
              <th
                style={{
                  width: '40px',
                  padding: `${spacing[3]} ${spacing[3]}`,
                  textAlign: 'center',
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: `${spacing[3]} ${spacing[4]}`,
                  textAlign: 'left',
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semibold,
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: typography.lineHeight.xs,
                  borderBottom: `1px solid ${colors.border}`,
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow
                key={i}
                colCount={columns.length + (hasSelection ? 1 : 0)}
              />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasSelection ? 1 : 0)}
                style={{ padding: 0 }}
              >
                <EmptyState heading={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const id = getKey(row);
              const isSelected = selectedIds?.has(id);
              return (
                <tr
                  key={id ?? rowIdx}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    backgroundColor: isSelected
                      ? colors.accentLight
                      : rowIdx % 2 === 0
                        ? colors.surface
                        : colors.background,
                    cursor: onRowClick ? 'pointer' : 'default',
                    borderLeft: isSelected
                      ? `3px solid ${colors.accent}`
                      : '3px solid transparent',
                    transition: 'background-color 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.accentLight;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        rowIdx % 2 === 0 ? colors.surface : colors.background;
                    }
                  }}
                >
                  {hasSelection && (
                    <td
                      style={{
                        width: '40px',
                        padding: `${spacing[3]} ${spacing[3]}`,
                        textAlign: 'center',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected ?? false}
                        onChange={() => toggleRow(id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select row ${rowIdx + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: `${spacing[3]} ${spacing[4]}`,
                        fontSize: typography.size.base,
                        color: colors.textPrimary,
                        lineHeight: typography.lineHeight.base,
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      {col.render
                        ? col.render(row)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? ''
                          )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
