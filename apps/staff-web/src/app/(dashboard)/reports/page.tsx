'use client';

import React, { useState } from 'react';
import { PageHeader, Card, Button, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import {
  BarChart3,
  Users,
  DollarSign,
  Clock,
  FileText,
  Search,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Report definitions
// ---------------------------------------------------------------------------

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
}

const reports: ReportDefinition[] = [
  {
    id: 'matter-pipeline',
    title: 'Matter Pipeline',
    description: 'Count of matters by status across the pipeline stages. Shows bottlenecks and workload distribution.',
    icon: <BarChart3 size={24} />,
    color: '#1565C0',
    available: true,
  },
  {
    id: 'upcoming-deadlines',
    title: 'Upcoming Deadlines',
    description: 'All deadlines due within the next 30 days. Sorted by urgency with matter and assignment context.',
    icon: <Clock size={24} />,
    color: '#d97706',
    available: true,
  },
  {
    id: 'staff-productivity',
    title: 'Staff Productivity',
    description: 'Matters per paralegal and attorney. Tracks assignment load and completion rates.',
    icon: <Users size={24} />,
    color: '#7c3aed',
    available: false,
  },
  {
    id: 'financial-summary',
    title: 'Financial Summary',
    description: 'Billed vs. collected amounts across all matters. Highlights outstanding balances and trust account status.',
    icon: <DollarSign size={24} />,
    color: '#16a34a',
    available: false,
  },
  {
    id: 'filing-activity',
    title: 'Filing Activity',
    description: 'Court filings by month, type, and outcome. Tracks acceptance rate and common deficiencies.',
    icon: <FileText size={24} />,
    color: '#0891b2',
    available: false,
  },
  {
    id: 'discovery-tracker',
    title: 'Discovery Tracker',
    description: 'Overdue discovery responses and pending requests. Highlights items needing immediate attention.',
    icon: <Search size={24} />,
    color: '#dc2626',
    available: false,
  },
];

// ---------------------------------------------------------------------------
// Matter Pipeline Report
// ---------------------------------------------------------------------------

function MatterPipelineReport() {
  const { data, isLoading } = trpc.matters.list.useQuery({ limit: 100 });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const matters = data?.items ?? [];

  // Compute counts by status
  const statusCounts: Record<string, number> = {};
  for (const matter of matters) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (matter as any).status ?? 'UNKNOWN';
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  if (sortedStatuses.length === 0) {
    return (
      <div style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>
        No matters found in the system.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 1fr',
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
        <span>Status</span>
        <span style={{ textAlign: 'right' }}>Count</span>
        <span></span>
      </div>
      {sortedStatuses.map(([status, count]) => {
        const pct = matters.length > 0 ? Math.round((count / matters.length) * 100) : 0;
        return (
          <div
            key={status}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 1fr',
              gap: '0',
              padding: '10px 16px',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '13px',
              color: '#1e293b',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 500 }}>{status.replace(/_/g, ' ')}</span>
            <span style={{ textAlign: 'right', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>
              {count}
            </span>
            <div style={{ paddingLeft: '16px' }}>
              <div
                style={{
                  height: '8px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  maxWidth: '200px',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: '#1565C0',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
      <div
        style={{
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#0f172a',
          backgroundColor: '#f8fafc',
          display: 'grid',
          gridTemplateColumns: '1fr 100px 1fr',
        }}
      >
        <span>Total</span>
        <span style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>
          {matters.length}
        </span>
        <span></span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upcoming Deadlines Report
// ---------------------------------------------------------------------------

function UpcomingDeadlinesReport() {
  const { data, isLoading } = trpc.calendar.getUpcoming.useQuery({ days: 30 });

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deadlines = (data as any)?.deadlines ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courtEvents = (data as any)?.courtEvents ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allItems = [...deadlines, ...courtEvents].sort((a: any, b: any) => {
    const dateA = new Date(a.dueAt ?? a.startAt ?? 0).getTime();
    const dateB = new Date(b.dueAt ?? b.startAt ?? 0).getTime();
    return dateA - dateB;
  });

  if (allItems.length === 0) {
    return (
      <div style={{ padding: '16px', fontSize: '13px', color: '#64748b' }}>
        No deadlines or court events in the next 30 days.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 120px 1fr',
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
        <span>Item</span>
        <span>Date</span>
        <span>Matter</span>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {allItems.map((item: any, idx: number) => {
        const date = item.dueAt ?? item.startAt;
        const isOverdue = date && new Date(date) < new Date();
        return (
          <div
            key={item.id ?? idx}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 120px 1fr',
              gap: '0',
              padding: '10px 16px',
              borderBottom: '1px solid #f1f5f9',
              fontSize: '13px',
              color: '#1e293b',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 500 }}>{item.title ?? '--'}</span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: isOverdue ? 700 : 400,
                color: isOverdue ? '#dc2626' : '#64748b',
              }}
            >
              {date
                ? new Date(date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '--'}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {item.matter?.title ?? item.matterId ?? '--'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report card component
// ---------------------------------------------------------------------------

function ReportCard({
  report,
  isActive,
  onRun,
}: {
  report: ReportDefinition;
  isActive: boolean;
  onRun: () => void;
}) {
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: `${report.color}10`,
              color: report.color,
              flexShrink: 0,
            }}
          >
            {report.icon}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            {report.title}
          </h3>
        </div>

        {/* Description */}
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#64748b',
            flex: 1,
          }}
        >
          {report.description}
        </p>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {report.available ? 'Ready' : 'Requires additional API endpoints'}
          </span>
          <Button
            variant="ghost"
            onClick={onRun}
            disabled={!report.available}
            style={{
              fontSize: '12px',
              padding: '4px 12px',
              color: report.available ? report.color : '#94a3b8',
              fontWeight: 600,
            }}
          >
            {isActive ? 'Hide' : 'Run Report'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  function handleRunReport(reportId: string) {
    setActiveReport((prev) => (prev === reportId ? null : reportId));
  }

  return (
    <>
      <PageHeader title="Reports" />

      {/* Reports grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            isActive={activeReport === report.id}
            onRun={() => handleRunReport(report.id)}
          />
        ))}
      </div>

      {/* Report results */}
      <div style={{ marginTop: '32px' }}>
        {activeReport === 'matter-pipeline' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Matter Pipeline Report
            </h3>
            <MatterPipelineReport />
          </div>
        )}

        {activeReport === 'upcoming-deadlines' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Upcoming Deadlines Report
            </h3>
            <UpcomingDeadlinesReport />
          </div>
        )}

        {activeReport === 'staff-productivity' && (
          <div
            style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Staff Productivity Report
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
              Requires additional API endpoints for staff assignment aggregation. This will be
              available in a future release.
            </p>
          </div>
        )}

        {activeReport === 'financial-summary' && (
          <div
            style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Financial Summary Report
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
              Requires additional API endpoints for billing and trust account aggregation. This will
              be available once the financial module is complete.
            </p>
          </div>
        )}

        {activeReport === 'filing-activity' && (
          <div
            style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Filing Activity Report
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
              Requires a filing.listQueue aggregate endpoint to report across all matters. This
              will be available in a future release.
            </p>
          </div>
        )}

        {activeReport === 'discovery-tracker' && (
          <div
            style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Discovery Tracker Report
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
              Requires additional API endpoints for discovery request aggregation across matters.
              This will be available in a future release.
            </p>
          </div>
        )}

        {!activeReport && (
          <EmptyState
            heading="No report selected"
            body="Click 'Run Report' on any card above to generate a report. Results will appear here."
          />
        )}
      </div>
    </>
  );
}
