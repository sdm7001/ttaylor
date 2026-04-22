'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, DataTable, StatusPill } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { MatterStatus } from '@ttaylor/domain';
import type { Matter } from '@ttaylor/domain';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/* Columns marked desktop-only are hidden on mobile via the global CSS class */

type StatusFilter = 'ALL' | 'OPEN' | 'ACTIVE' | 'CLOSED';

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Closed', value: 'CLOSED' },
];

function statusFilterToQuery(filter: StatusFilter): string | undefined {
  if (filter === 'ALL') return undefined;
  if (filter === 'OPEN') return MatterStatus.OPEN;
  if (filter === 'ACTIVE') return MatterStatus.ACTIVE;
  if (filter === 'CLOSED') return MatterStatus.CLOSED;
  return undefined;
}

// The API returns Prisma-shaped rows with matterType relation.
// We use `any` for the row type since the actual Prisma return type
// differs slightly from the domain Matter interface (e.g. matterType is an object).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MatterRow = any;

const columns: DataTableColumn<MatterRow>[] = [
  {
    key: 'causeNumber',
    header: 'Cause Number',
    render: (row: MatterRow) => (
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontSize: '13px',
        }}
      >
        {row.causeNumber ?? '--'}
      </span>
    ),
    width: '140px',
  },
  {
    key: 'title',
    header: 'Client Name',
    render: (row: MatterRow) => (
      <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.title}</span>
    ),
  },
  {
    key: 'matterType',
    header: 'Matter Type',
    render: (row: MatterRow) => row.matterType?.name ?? row.matterTypeId?.slice(0, 8) ?? '--',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row: MatterRow) => <StatusPill status={row.status} />,
    width: '140px',
  },
  {
    key: 'attorney',
    header: 'Attorney',
    render: (row: MatterRow) => {
      const attorney = row.assignments?.find(
        (a: { assignmentRole: string; user?: { firstName: string; lastName: string } }) =>
          a.assignmentRole === 'ATTORNEY',
      );
      return attorney?.user
        ? `${attorney.user.firstName} ${attorney.user.lastName}`
        : '--';
    },
  },
  {
    key: 'paralegal',
    header: 'Paralegal',
    render: (row: MatterRow) => {
      const paralegal = row.assignments?.find(
        (a: { assignmentRole: string; user?: { firstName: string; lastName: string } }) =>
          a.assignmentRole === 'PARALEGAL',
      );
      return paralegal?.user
        ? `${paralegal.user.firstName} ${paralegal.user.lastName}`
        : '--';
    },
  },
  {
    key: 'updatedAt',
    header: 'Last Activity',
    render: (row: MatterRow) =>
      row.updatedAt
        ? new Date(row.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '--',
    width: '120px',
  },
];

export default function MattersPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');

  const { data, isLoading } = trpc.matters.list.useQuery({
    status: statusFilterToQuery(activeFilter),
    limit: 50,
  });

  const matters = data?.items ?? [];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .matters-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .matters-table-wrap table { min-width: 500px; }
        }
      `}</style>
      <PageHeader
        title="Matters"
        actions={
          <Button variant="primary" onClick={() => router.push('/matters/new')}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            New Matter
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div
        className="tab-bar"
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '16px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0',
        }}
      >
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeFilter === f.value ? 600 : 500,
              color: activeFilter === f.value ? '#1565C0' : '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeFilter === f.value
                  ? '3px solid #1565C0'
                  : '3px solid transparent',
              cursor: 'pointer',
              transition: 'color 100ms ease, border-color 100ms ease',
              marginBottom: '-1px',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="matters-table-wrap">
        <DataTable<MatterRow>
          columns={columns}
          data={matters}
          loading={isLoading}
          emptyMessage="No matters found"
          onRowClick={(matter: MatterRow) => {
            router.push(`/matters/${matter.id}`);
          }}
          rowKey={(row: MatterRow) => row.id}
        />
      </div>
    </>
  );
}
