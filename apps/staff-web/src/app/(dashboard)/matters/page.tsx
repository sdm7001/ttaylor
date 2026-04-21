'use client';

import React, { useState } from 'react';
import { PageHeader, Button, DataTable, StatusPill, EmptyState } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { MatterStatus } from '@ttaylor/domain';
import type { Matter } from '@ttaylor/domain';
import { Plus } from 'lucide-react';

type StatusFilter = 'ALL' | 'OPEN' | 'ACTIVE' | 'CLOSED';

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Closed', value: 'CLOSED' },
];

const columns: DataTableColumn<Matter>[] = [
  {
    key: 'causeNumber',
    header: 'Cause Number',
    render: (row) => (
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
    render: (row) => (
      <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.title}</span>
    ),
  },
  {
    key: 'matterType',
    header: 'Matter Type',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusPill status={row.status} />,
    width: '140px',
  },
  {
    key: 'attorney',
    header: 'Attorney',
    render: (row) => {
      const attorney = row.assignments?.find((a) => a.role === 'LEAD_ATTORNEY');
      return attorney?.user
        ? `${attorney.user.firstName} ${attorney.user.lastName}`
        : '--';
    },
  },
  {
    key: 'paralegal',
    header: 'Paralegal',
    render: (row) => {
      const paralegal = row.assignments?.find((a) => a.role === 'PARALEGAL');
      return paralegal?.user
        ? `${paralegal.user.firstName} ${paralegal.user.lastName}`
        : '--';
    },
  },
  {
    key: 'updatedAt',
    header: 'Last Activity',
    render: (row) =>
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
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');

  // TODO: fetch matters from tRPC API
  const matters: Matter[] = [];
  const loading = false;

  const filtered = matters.filter((m) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'OPEN') return m.status === MatterStatus.OPEN;
    if (activeFilter === 'ACTIVE') return m.status === MatterStatus.ACTIVE;
    if (activeFilter === 'CLOSED') return m.status === MatterStatus.CLOSED;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Matters"
        actions={
          <Button variant="primary" onClick={() => {/* TODO: open new matter dialog */}}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            New Matter
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div
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

      <DataTable<Matter>
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No matters found"
        onRowClick={(matter) => {
          // TODO: navigate to /matters/[id]
          console.log('Navigate to matter:', matter.id);
        }}
        rowKey={(row) => row.id}
      />
    </>
  );
}
