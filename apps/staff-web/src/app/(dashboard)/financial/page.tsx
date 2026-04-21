'use client';

import React from 'react';
import { PageHeader, Card, DataTable, EmptyState } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { DollarSign, Landmark, CreditCard } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MatterFinancialRow {
  id: string;
  matterTitle: string;
  clientName: string;
  causeNumber: string | null;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
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

const columns: DataTableColumn<MatterFinancialRow>[] = [
  {
    key: 'matterTitle',
    header: 'Matter',
    render: (row) => (
      <div>
        <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px' }}>
          {row.matterTitle}
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
    ),
  },
  {
    key: 'clientName',
    header: 'Client',
    render: (row) => (
      <span style={{ fontSize: '13px', color: '#334155' }}>{row.clientName}</span>
    ),
    width: '160px',
  },
  {
    key: 'totalBilled',
    header: 'Billed',
    render: (row) => (
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>
        {formatCurrency(row.totalBilled)}
      </span>
    ),
    width: '120px',
  },
  {
    key: 'totalPaid',
    header: 'Paid',
    render: (row) => (
      <span style={{ fontSize: '13px', color: '#16a34a' }}>
        {formatCurrency(row.totalPaid)}
      </span>
    ),
    width: '120px',
  },
  {
    key: 'outstandingBalance',
    header: 'Outstanding',
    render: (row) => {
      const hasBalance = row.outstandingBalance > 0;
      return (
        <span
          style={{
            fontSize: '13px',
            fontWeight: hasBalance ? 700 : 400,
            color: hasBalance ? '#dc2626' : '#16a34a',
          }}
        >
          {formatCurrency(row.outstandingBalance)}
        </span>
      );
    },
    width: '130px',
  },
  {
    key: 'actions',
    header: '',
    render: (row) => (
      <a
        href={`/financial/${row.id}`}
        onClick={(e) => {
          e.stopPropagation();
          // TODO: navigate to /financial/[matterId] ledger view
          console.log('View ledger for matter:', row.id);
        }}
        style={{
          fontSize: '12px',
          color: '#1565C0',
          textDecoration: 'none',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        View Ledger
      </a>
    ),
    width: '100px',
  },
];

// ---------------------------------------------------------------------------
// Page (ATTORNEY/ADMIN restricted -- enforced at layout/middleware level)
// ---------------------------------------------------------------------------

export default function FinancialPage() {
  // TODO: Replace with tRPC queries:
  //   trpc.financial.getMatterSummary.useQuery(...)
  //   or a dedicated aggregate endpoint
  const matterRows: MatterFinancialRow[] = [];
  const loading = false;

  // TODO: Replace with actual aggregated data from API
  const totalOutstanding = 0;
  const totalInTrust = 0;
  const paymentsThisMonth = 0;

  return (
    <>
      <PageHeader title="Financial" />

      {/* Summary cards */}
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
          value={formatCurrency(totalOutstanding)}
          color="#dc2626"
        />
        <SummaryCard
          icon={<Landmark size={20} />}
          label="Total in Trust"
          value={formatCurrency(totalInTrust)}
          color="#7c3aed"
        />
        <SummaryCard
          icon={<CreditCard size={20} />}
          label="Payments This Month"
          value={formatCurrency(paymentsThisMonth)}
          color="#16a34a"
        />
      </div>

      {/* Matters with financial activity */}
      {matterRows.length === 0 && !loading ? (
        <EmptyState
          heading="No financial activity"
          body="Financial data will appear here when invoices and payments are recorded for matters."
        />
      ) : (
        <DataTable<MatterFinancialRow>
          columns={columns}
          data={matterRows}
          loading={loading}
          emptyMessage="No matters with financial activity"
          onRowClick={(row) => {
            // TODO: navigate to /financial/[matterId] ledger
            console.log('Navigate to financial detail:', row.id);
          }}
          rowKey={(row) => row.id}
        />
      )}
    </>
  );
}
