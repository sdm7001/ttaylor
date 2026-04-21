'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader, Card, DataTable, EmptyState, LoadingSpinner, StatusPill } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { DollarSign, Landmark, CreditCard } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatterRow {
  id: string;
  title: string | null;
  causeNumber: string | null;
  status: string;
  matterType: { name: string } | null;
  assignments: Array<{
    role?: string;
    user: { id: string; firstName: string; lastName: string };
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Summary card component
// ---------------------------------------------------------------------------

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: `${color}10`,
            color,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#0f172a',
              marginTop: '2px',
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Table columns
// ---------------------------------------------------------------------------

const columns: DataTableColumn<MatterRow>[] = [
  {
    key: 'title',
    header: 'Matter',
    render: (row) => {
      const typeName = row.matterType?.name ?? '--';
      return (
        <div>
          <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px' }}>
            {row.title ?? typeName}
          </div>
          {row.causeNumber && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: '11px',
                color: '#94a3b8',
                marginTop: '2px',
              }}
            >
              {row.causeNumber}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusPill status={row.status} />,
    width: '130px',
  },
  {
    key: 'attorney',
    header: 'Attorney',
    render: (row) => {
      const attorney = row.assignments?.find(
        (a: { role?: string }) => a.role === 'ATTORNEY'
      );
      return (
        <span style={{ fontSize: '13px', color: '#334155' }}>
          {attorney?.user
            ? `${attorney.user.firstName} ${attorney.user.lastName}`
            : '--'}
        </span>
      );
    },
    width: '160px',
  },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <Link
        href={`/financial/${row.id}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          fontSize: '12px',
          color: '#1565C0',
          textDecoration: 'none',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        View Financials
      </Link>
    ),
    width: '120px',
  },
];

// ---------------------------------------------------------------------------
// Page (ATTORNEY/ADMIN restricted -- enforced at layout/middleware level)
// ---------------------------------------------------------------------------

export default function FinancialPage() {
  const { data: mattersData, isLoading } = trpc.matters.list.useQuery({ limit: 100 });

  const matterRows: MatterRow[] = (mattersData?.items ?? []) as unknown as MatterRow[];

  return (
    <>
      <PageHeader title="Financial" />

      {/* Summary cards */}
      {/*
       * TODO: These summary values require a `financial.getPortfolioSummary` aggregate
       * endpoint that sums across all matters. That endpoint does not exist yet.
       * Showing "--" to be honest rather than displaying fake zeros.
       */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <SummaryCard
          icon={<DollarSign size={20} />}
          label="Total Outstanding"
          value="--"
          color="#dc2626"
        />
        <SummaryCard
          icon={<Landmark size={20} />}
          label="Total in Trust"
          value="--"
          color="#7c3aed"
        />
        <SummaryCard
          icon={<CreditCard size={20} />}
          label="Payments This Month"
          value="--"
          color="#16a34a"
        />
      </div>

      {/* Matters list -- each row links to per-matter financial detail */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : matterRows.length === 0 ? (
        <EmptyState
          heading="No matters found"
          body="Financial data will appear here when matters are created and invoices or payments are recorded."
        />
      ) : (
        <DataTable<MatterRow>
          columns={columns}
          data={matterRows}
          loading={false}
          emptyMessage="No matters with financial activity"
          onRowClick={(row) => {
            window.location.href = `/financial/${row.id}`;
          }}
          rowKey={(row) => row.id}
        />
      )}
    </>
  );
}
