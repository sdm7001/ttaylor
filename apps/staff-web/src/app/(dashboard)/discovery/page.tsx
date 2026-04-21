'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader, Button, DataTable, StatusPill, EmptyState } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { Plus } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types (matches tRPC discovery.listRequests response shape)
// ---------------------------------------------------------------------------

interface DiscoveryRequestRow {
  id: string;
  matterId: string;
  matterTitle: string;
  requestType: string;
  title: string;
  servedOn: string;
  servedAt: string;
  responseDeadline: string;
  status: string;
  responseCount: number;
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type TypeFilter =
  | 'ALL'
  | 'INTERROGATORIES'
  | 'REQUEST_FOR_PRODUCTION'
  | 'REQUEST_FOR_ADMISSIONS'
  | 'SUBPOENA'
  | 'DEPOSITION_NOTICE';

type StatusFilter = 'ALL' | 'PENDING' | 'RESPONDED' | 'OVERDUE' | 'OBJECTED';

const typeFilters: { label: string; value: TypeFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Interrogatories', value: 'INTERROGATORIES' },
  { label: 'Requests for Production', value: 'REQUEST_FOR_PRODUCTION' },
  { label: 'Admissions', value: 'REQUEST_FOR_ADMISSIONS' },
  { label: 'Subpoenas', value: 'SUBPOENA' },
  { label: 'Deposition Notices', value: 'DEPOSITION_NOTICE' },
];

const statusFilterOptions: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Responded', value: 'RESPONDED' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Objected', value: 'OBJECTED' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isOverdue(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRequestType(type: string): string {
  const labels: Record<string, string> = {
    INTERROGATORIES: 'Interrogatories',
    REQUEST_FOR_PRODUCTION: 'Req. for Production',
    REQUEST_FOR_ADMISSIONS: 'Req. for Admissions',
    SUBPOENA: 'Subpoena',
    DEPOSITION_NOTICE: 'Deposition Notice',
  };
  return labels[type] ?? type;
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const columns: DataTableColumn<DiscoveryRequestRow>[] = [
  {
    key: 'matterTitle',
    header: 'Matter',
    render: (row) => (
      <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.matterTitle}</span>
    ),
  },
  {
    key: 'requestType',
    header: 'Request Type',
    render: (row) => (
      <span style={{ fontSize: '13px' }}>{formatRequestType(row.requestType)}</span>
    ),
    width: '160px',
  },
  {
    key: 'title',
    header: 'Title',
    render: (row) => (
      <span style={{ fontSize: '13px', color: '#334155' }}>{row.title}</span>
    ),
  },
  {
    key: 'servedOn',
    header: 'Served On',
    render: (row) => (
      <span style={{ fontSize: '13px', color: '#64748b' }}>{row.servedOn}</span>
    ),
    width: '140px',
  },
  {
    key: 'responseDeadline',
    header: 'Response Deadline',
    render: (row) => {
      const overdue =
        row.status !== 'RESPONDED' &&
        row.status !== 'WITHDRAWN' &&
        isOverdue(row.responseDeadline);
      return (
        <span
          style={{
            fontSize: '13px',
            fontWeight: overdue ? 700 : 400,
            color: overdue ? '#dc2626' : '#64748b',
          }}
        >
          {formatDate(row.responseDeadline)}
          {overdue && (
            <span
              style={{
                display: 'inline-block',
                marginLeft: '6px',
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                fontWeight: 700,
              }}
            >
              OVERDUE
            </span>
          )}
        </span>
      );
    },
    width: '180px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusPill status={row.status} />,
    width: '120px',
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <Button
        variant="ghost"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          // TODO: open detail panel or navigate to discovery detail
        }}
        style={{ fontSize: '12px', padding: '4px 8px' }}
      >
        View
      </Button>
    ),
    width: '70px',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DiscoveryPage() {
  const [activeTypeFilter, setActiveTypeFilter] = useState<TypeFilter>('ALL');
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('ALL');

  // TODO: Replace with tRPC query: trpc.discovery.listRequests.useQuery(...)
  const requests: DiscoveryRequestRow[] = [];
  const loading = false;

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (activeTypeFilter !== 'ALL' && r.requestType !== activeTypeFilter) return false;
      if (activeStatusFilter !== 'ALL' && r.status !== activeStatusFilter) return false;
      return true;
    });
  }, [requests, activeTypeFilter, activeStatusFilter]);

  return (
    <>
      <PageHeader
        title="Discovery"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              /* TODO: open new discovery request dialog */
            }}
          >
            <Plus size={16} style={{ marginRight: '6px' }} />
            New Request
          </Button>
        }
      />

      {/* Type filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '12px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0',
        }}
      >
        {typeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveTypeFilter(f.value)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeTypeFilter === f.value ? 600 : 500,
              color: activeTypeFilter === f.value ? '#1565C0' : '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeTypeFilter === f.value
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

      {/* Status filter */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        {statusFilterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveStatusFilter(f.value)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: activeStatusFilter === f.value ? 600 : 400,
              color: activeStatusFilter === f.value ? '#ffffff' : '#475569',
              backgroundColor:
                activeStatusFilter === f.value ? '#475569' : '#f1f5f9',
              border: '1px solid',
              borderColor:
                activeStatusFilter === f.value ? '#475569' : '#e2e8f0',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 100ms ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyState
          heading="No discovery requests"
          body="Discovery requests will appear here when created for matters."
        />
      ) : (
        <DataTable<DiscoveryRequestRow>
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No discovery requests match your filters"
          onRowClick={(row) => {
            // TODO: navigate to /discovery/[id] or open detail panel
            console.log('Navigate to discovery request:', row.id);
          }}
          rowKey={(row) => row.id}
        />
      )}
    </>
  );
}
