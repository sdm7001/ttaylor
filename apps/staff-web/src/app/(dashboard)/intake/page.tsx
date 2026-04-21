'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, DataTable, StatusPill } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// The Prisma LeadStatus enum values used by the API
// ---------------------------------------------------------------------------
type PrismaLeadStatus =
  | 'NEW'
  | 'INTAKE_PENDING'
  | 'CONFLICT_CHECK'
  | 'CONSULTATION_SCHEDULED'
  | 'CONSULTATION_COMPLETED'
  | 'RETAINED'
  | 'DECLINED'
  | 'CLOSED';

// UI-friendly filter labels mapped to Prisma enum values
type FilterKey = 'all' | 'new' | 'contacted' | 'qualified' | 'conflict_flagged' | 'converted' | 'rejected';

const statusFilters: { label: string; value: FilterKey }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Conflict Flagged', value: 'conflict_flagged' },
  { label: 'Converted', value: 'converted' },
  { label: 'Rejected', value: 'rejected' },
];

/**
 * Map the UI filter key to the Prisma LeadStatus enum value used by the API.
 */
function filterToApiStatus(filter: FilterKey): PrismaLeadStatus | undefined {
  switch (filter) {
    case 'all':
      return undefined;
    case 'new':
      return 'NEW';
    case 'contacted':
      return 'INTAKE_PENDING';
    case 'qualified':
      return 'CONSULTATION_COMPLETED';
    case 'conflict_flagged':
      return 'CONFLICT_CHECK';
    case 'converted':
      return 'RETAINED';
    case 'rejected':
      return 'DECLINED';
    default:
      return undefined;
  }
}

/**
 * Map Prisma status to a human-readable label for the StatusPill.
 */
function humanStatus(status: string): string {
  const map: Record<string, string> = {
    NEW: 'New',
    INTAKE_PENDING: 'Contacted',
    CONFLICT_CHECK: 'Conflict Check',
    CONSULTATION_SCHEDULED: 'Consultation Scheduled',
    CONSULTATION_COMPLETED: 'Qualified',
    RETAINED: 'Converted',
    DECLINED: 'Rejected',
    CLOSED: 'Closed',
  };
  return map[status] ?? status;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeadRow = any;

const columns: DataTableColumn<LeadRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row: LeadRow) => {
      const c = row.contact;
      return (
        <span style={{ fontWeight: 500, color: '#0f172a' }}>
          {c ? `${c.firstName} ${c.lastName}` : '--'}
        </span>
      );
    },
  },
  {
    key: 'phone',
    header: 'Phone',
    render: (row: LeadRow) => row.contact?.phoneMobile ?? '--',
    width: '140px',
  },
  {
    key: 'email',
    header: 'Email',
    render: (row: LeadRow) => row.contact?.email ?? '--',
    width: '200px',
  },
  {
    key: 'source',
    header: 'Practice Area',
    render: (row: LeadRow) => row.source ?? '--',
    width: '160px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row: LeadRow) => <StatusPill status={humanStatus(row.status)} />,
    width: '160px',
  },
  {
    key: 'createdAt',
    header: 'Created',
    render: (row: LeadRow) =>
      row.createdAt
        ? new Date(row.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '--',
    width: '120px',
  },
  {
    key: 'actions',
    header: '',
    render: (row: LeadRow) => <ActionButtons lead={row} />,
    width: '200px',
  },
];

// ---------------------------------------------------------------------------
// Per-row action buttons
// ---------------------------------------------------------------------------
function ActionButtons({ lead }: { lead: LeadRow }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const runConflict = trpc.intake.runConflictCheck.useMutation({
    onSuccess: () => utils.intake.getLeads.invalidate(),
  });

  const updateStatus = trpc.intake.updateLeadStatus.useMutation({
    onSuccess: () => utils.intake.getLeads.invalidate(),
  });

  const btnStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '4px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const status = lead.status as PrismaLeadStatus;

  // NEW / INTAKE_PENDING: Run Conflict Check
  if (status === 'NEW' || status === 'INTAKE_PENDING') {
    return (
      <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
        <button
          style={btnStyle}
          onClick={() => runConflict.mutate({ leadId: lead.id })}
          disabled={runConflict.isPending}
        >
          {runConflict.isPending ? 'Checking...' : 'Run Conflict Check'}
        </button>
      </div>
    );
  }

  // CONSULTATION_COMPLETED (Qualified): Convert to Matter + Run Conflict Check
  if (status === 'CONSULTATION_COMPLETED') {
    return (
      <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
        <button
          style={{ ...btnStyle, backgroundColor: '#1565C0', color: '#fff', border: 'none' }}
          onClick={() => router.push(`/intake/${lead.id}`)}
        >
          Convert to Matter
        </button>
        <button
          style={btnStyle}
          onClick={() => runConflict.mutate({ leadId: lead.id })}
          disabled={runConflict.isPending}
        >
          Conflict Check
        </button>
      </div>
    );
  }

  // CONFLICT_CHECK: View Conflict details
  if (status === 'CONFLICT_CHECK') {
    const latestCheck = lead.conflictChecks?.[0];
    const snapshot =
      latestCheck?.searchSnapshotJson && typeof latestCheck.searchSnapshotJson === 'object'
        ? (latestCheck.searchSnapshotJson as Record<string, unknown>)
        : null;
    const matchCount = (snapshot?.matchCount as number) ?? 0;

    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
        {matchCount > 0 ? (
          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
            {matchCount} conflict{matchCount > 1 ? 's' : ''}
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Clear</span>
        )}
        <button style={btnStyle} onClick={() => router.push(`/intake/${lead.id}`)}>
          View Details
        </button>
      </div>
    );
  }

  // RETAINED (Converted): Link to matter
  if (status === 'RETAINED') {
    return (
      <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Converted</span>
      </div>
    );
  }

  // DECLINED (Rejected)
  if (status === 'DECLINED' || status === 'CLOSED') {
    return (
      <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{humanStatus(status)}</span>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function IntakePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const { data, isLoading } = trpc.intake.getLeads.useQuery({
    status: filterToApiStatus(activeFilter),
    limit: 50,
  });

  const leads = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Intake"
        actions={
          <Button variant="primary" onClick={() => router.push('/intake/new')}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            New Lead
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

      {leads.length === 0 && !isLoading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 0',
            color: '#64748b',
          }}
        >
          <ClipboardListIcon />
          <p style={{ fontSize: '15px', fontWeight: 500, margin: '16px 0 4px' }}>
            No leads yet
          </p>
          <p style={{ fontSize: '13px', margin: 0 }}>
            Click &quot;New Lead&quot; to capture an intake.
          </p>
        </div>
      ) : (
        <DataTable<LeadRow>
          columns={columns}
          data={leads}
          loading={isLoading}
          emptyMessage="No leads match the selected filter"
          onRowClick={(lead: LeadRow) => router.push(`/intake/${lead.id}`)}
          rowKey={(row: LeadRow) => row.id}
        />
      )}
    </>
  );
}

// Simple clipboard icon for empty state (avoids importing lucide just for this)
function ClipboardListIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
