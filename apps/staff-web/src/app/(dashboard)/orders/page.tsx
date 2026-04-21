'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Card,
  EmptyState,
  LoadingSpinner,
} from '@ttaylor/ui';
import { Scale, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Status pill colors for compliance statuses
// ---------------------------------------------------------------------------

function ComplianceStatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: '#fffbeb', color: '#d97706' },
    IN_PROGRESS: { bg: '#eff6ff', color: '#2563eb' },
    COMPLETED: { bg: '#f0fdf4', color: '#16a34a' },
    VIOLATED: { bg: '#fef2f2', color: '#dc2626' },
    EXCUSED: { bg: '#f8fafc', color: '#64748b' },
  };

  const style = styles[status] ?? styles.PENDING;

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: style.color,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const router = useRouter();
  const { data: complianceItems, isLoading } = trpc.orders.listComplianceItems.useQuery({
    upcomingDays: 30,
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Orders & Compliance" />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
          }}
        >
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  const items = complianceItems ?? [];

  return (
    <>
      <PageHeader
        title="Orders & Compliance"
        subtitle="Track court orders and upcoming compliance deadlines"
      />

      {/* Upcoming Compliance Deadlines */}
      <div style={{ marginBottom: '32px' }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Scale size={18} style={{ color: '#1565C0' }} />
          Upcoming Compliance Deadlines (Next 30 Days)
        </h3>

        {items.length === 0 ? (
          <EmptyState
            heading="No upcoming compliance items"
            body="No compliance deadlines are due within the next 30 days. View orders within each matter for full order history."
            actionLabel="Go to Matters"
            onAction={() => router.push('/matters')}
          />
        ) : (
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1.5fr 120px 1fr 100px',
                gap: '0',
                padding: '10px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Matter</span>
              <span>Order</span>
              <span>Compliance Item</span>
              <span>Due Date</span>
              <span>Responsible</span>
              <span>Status</span>
            </div>

            {/* Table rows */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {items.map((item: any) => {
              const isOverdue = item.dueAt && new Date(item.dueAt) < new Date();
              const matterTitle = item.order?.matter?.title ?? 'Unknown Matter';
              const matterId = item.order?.matter?.id;
              const orderType = item.order?.orderType ?? '--';
              const responsibleParty = item.completionNote
                ? (item.completionNote.match(/Responsible:\s*([^||\n]+)/)?.[1]?.trim() ?? '--')
                : '--';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (matterId) router.push(`/matters/${matterId}`);
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1.5fr 120px 1fr 100px',
                    gap: '0',
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '13px',
                    color: '#1e293b',
                    alignItems: 'center',
                    cursor: matterId ? 'pointer' : 'default',
                    transition: 'background-color 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{matterTitle}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{orderType}</span>
                  <span>{item.title ?? '--'}</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isOverdue ? 700 : 400,
                      color: isOverdue ? '#dc2626' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isOverdue && <AlertTriangle size={12} />}
                    {item.dueAt
                      ? new Date(item.dueAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '--'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{responsibleParty}</span>
                  <ComplianceStatusPill status={item.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Active Orders note */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
          <Scale size={18} style={{ color: '#64748b' }} />
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
              View All Orders
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Orders are organized within each matter. Navigate to a specific matter to view its
              full order history, create new orders, and manage compliance items.
            </p>
          </div>
          <button
            onClick={() => router.push('/matters')}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1565C0',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Go to Matters
          </button>
        </div>
      </Card>
    </>
  );
}
