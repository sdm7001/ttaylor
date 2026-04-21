'use client';

import React from 'react';
import { PageHeader, Card, LoadingSpinner } from '@ttaylor/ui';
import { Briefcase, FileText, Send, CalendarDays, Activity } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EVENT_TYPE_LABELS: Record<string, string> = {
  CREATED: 'Created',
  UPDATED: 'Updated',
  DELETED: 'Deleted',
  STAGE_CHANGED: 'Stage Changed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FILED: 'Filed',
  ACCESSED: 'Accessed',
  EXPORTED: 'Exported',
  PERMISSION_CHANGED: 'Permission Changed',
  CONFLICT_CLEARED: 'Conflict Cleared',
  PORTAL_INVITED: 'Portal Invited',
};

function humanEventType(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

function relativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#E3F2FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1565C0',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: loading ? '#94a3b8' : '#0f172a',
              lineHeight: '32px',
            }}
          >
            {loading ? '--' : value}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: '18px',
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data, isLoading } = trpc.dashboard.getSummary.useQuery(undefined, {
    staleTime: 60_000,
  });

  return (
    <>
      <PageHeader title="Dashboard" subtitle={today} />

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard
          icon={<Briefcase size={20} />}
          label="Active Matters"
          value={data?.activeMatters ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={<FileText size={20} />}
          label="Pending Documents"
          value={data?.pendingDocuments ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={<Send size={20} />}
          label="Filing Queue"
          value={data?.filingQueue ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Upcoming Deadlines"
          value={data?.upcomingDeadlines ?? 0}
          loading={isLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
            <LoadingSpinner size="md" />
          </div>
        ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#94a3b8',
            }}
          >
            <Activity size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748b' }}>
              No recent activity
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Activity from matters, documents, and filings will appear here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {data.recentActivity.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#1565C0',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a',
                      }}
                    >
                      {humanEventType(item.eventType)}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '6px' }}>
                      {item.resourceType}
                    </span>
                    <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '6px' }}>
                      by {item.actorName}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>
                  {relativeTime(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
