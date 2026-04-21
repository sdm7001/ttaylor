'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Card,
  StatusPill,
  Button,
  LoadingSpinner,
  EmptyState,
} from '@ttaylor/ui';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Helper: days overdue calculation
// ---------------------------------------------------------------------------

function daysOverdue(dueAt: Date | string): number {
  const due = new Date(dueAt);
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Section: Overdue Deadlines
// ---------------------------------------------------------------------------

function OverdueDeadlinesSection() {
  const router = useRouter();
  const now = new Date();
  const pastDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Query deadlines from the past year up to now to find overdue items
  const { data, isLoading } = trpc.calendar.listEvents.useQuery({
    startDate: pastDate,
    endDate: now,
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  const overdueDeadlines = (data?.deadlines ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => new Date(d.dueAt) < now,
  );

  if (overdueDeadlines.length === 0) {
    return (
      <EmptyState
        heading="No overdue deadlines"
        body="All deadlines are current. Keep up the good work."
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '2px solid #e2e8f0',
              textAlign: 'left',
            }}
          >
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Matter</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Deadline</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Due Date</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {overdueDeadlines.map((deadline: any) => {
            const overdueDays = daysOverdue(deadline.dueAt);
            return (
              <tr
                key={deadline.id}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/matters/${deadline.matter?.id}`)}
              >
                <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 500 }}>
                  {deadline.matter?.title ?? deadline.matter?.causeNumber ?? '--'}
                </td>
                <td style={{ padding: '10px 12px', color: '#0f172a' }}>
                  {deadline.title}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    color: '#dc2626',
                    fontWeight: 700,
                  }}
                >
                  {new Date(deadline.dueAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    color: '#dc2626',
                    fontWeight: 700,
                  }}
                >
                  {overdueDays} day{overdueDays !== 1 ? 's' : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Matters On Hold
// ---------------------------------------------------------------------------

function MattersOnHoldSection() {
  const router = useRouter();
  const { data, isLoading } = trpc.matters.list.useQuery({
    status: 'ON_HOLD' as never,
    limit: 50,
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  const matters = data?.items ?? [];

  if (matters.length === 0) {
    return (
      <EmptyState
        heading="No matters on hold"
        body="All active matters are progressing normally."
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Matter</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Cause Number</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Attorney</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {matters.map((matter: any) => {
            const attorney = matter.assignments?.find(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (a: any) => a.assignmentRole === 'ATTORNEY' || a.assignmentRole === 'LEAD_ATTORNEY',
            );
            return (
              <tr
                key={matter.id}
                style={{ borderBottom: '1px solid #f1f5f9' }}
              >
                <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 500 }}>
                  {matter.title}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: '13px',
                    color: '#475569',
                  }}
                >
                  {matter.causeNumber ?? '--'}
                </td>
                <td style={{ padding: '10px 12px', color: '#475569' }}>
                  {attorney
                    ? `${attorney.user.firstName} ${attorney.user.lastName}`
                    : '--'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/matters/${matter.id}`)}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Compliance Violations
// ---------------------------------------------------------------------------

function ComplianceViolationsSection() {
  const router = useRouter();
  const { data, isLoading } = trpc.orders.listComplianceItems.useQuery({
    status: 'VIOLATED',
    upcomingDays: 365,
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  const items = data ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        heading="No compliance violations"
        body="All compliance items are in good standing."
      />
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Matter</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Order</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Item</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Due Date</th>
            <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Responsible</th>
          </tr>
        </thead>
        <tbody>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {items.map((item: any) => (
            <tr
              key={item.id}
              style={{
                borderBottom: '1px solid #f1f5f9',
                backgroundColor: '#fef2f2',
                cursor: 'pointer',
              }}
              onClick={() => router.push(`/matters/${item.order?.matter?.id}`)}
            >
              <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 500 }}>
                {item.order?.matter?.title ?? item.order?.matter?.causeNumber ?? '--'}
              </td>
              <td style={{ padding: '10px 12px', color: '#475569' }}>
                {item.order?.orderType ?? '--'}
              </td>
              <td style={{ padding: '10px 12px', color: '#0f172a' }}>
                {item.title}
              </td>
              <td
                style={{
                  padding: '10px 12px',
                  color: '#dc2626',
                  fontWeight: 600,
                }}
              >
                {item.dueAt
                  ? new Date(item.dueAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '--'}
              </td>
              <td style={{ padding: '10px 12px', color: '#475569' }}>
                {item.completionNote?.match(/Responsible:\s*([^|]+)/)?.[1]?.trim() ?? '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RiskPage() {
  return (
    <>
      <PageHeader title="Risk View" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Overdue Deadlines */}
        <section>
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#dc2626',
            }}
          >
            Overdue Deadlines
          </h2>
          <Card>
            <OverdueDeadlinesSection />
          </Card>
        </section>

        {/* Matters On Hold */}
        <section>
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#f59e0b',
            }}
          >
            Matters On Hold
          </h2>
          <Card>
            <MattersOnHoldSection />
          </Card>
        </section>

        {/* Compliance Violations */}
        <section>
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#dc2626',
            }}
          >
            Compliance Violations
          </h2>
          <Card>
            <ComplianceViolationsSection />
          </Card>
        </section>
      </div>
    </>
  );
}
