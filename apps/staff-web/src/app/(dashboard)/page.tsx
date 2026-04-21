'use client';

import React from 'react';
import { PageHeader, Card, EmptyState } from '@ttaylor/ui';
import { Briefcase, FileText, Send, CalendarDays, Activity } from 'lucide-react';
import { trpc } from '@/lib/trpc';

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

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Active matters count -- query with ACTIVE status, limit 1 to minimise payload
  const activeMatters = trpc.matters.list.useQuery(
    { status: 'ACTIVE', limit: 1 },
    { staleTime: 60_000 },
  );

  // Upcoming deadlines within 7 days
  const upcomingDeadlines = trpc.calendar.getUpcoming.useQuery(
    { days: 7, assignedToMe: false },
    { staleTime: 60_000 },
  );

  const deadlineCount =
    (upcomingDeadlines.data?.deadlines?.length ?? 0) +
    (upcomingDeadlines.data?.courtEvents?.length ?? 0);

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
          value={activeMatters.data?.total ?? 0}
          loading={activeMatters.isLoading}
        />
        <StatCard
          icon={<FileText size={20} />}
          label="Pending Documents"
          value={0}
          // TODO: Needs a dashboard.getSummary aggregate endpoint to count
          // documents in INTERNAL_REVIEW or ATTORNEY_REVIEW across all matters.
        />
        <StatCard
          icon={<Send size={20} />}
          label="Filing Queue"
          value={0}
          // TODO: Needs a dashboard.getSummary aggregate endpoint to count
          // filing packets in ASSEMBLING or READY_FOR_ATTORNEY_REVIEW status.
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Upcoming Deadlines"
          value={deadlineCount}
          loading={upcomingDeadlines.isLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <EmptyState
          icon={<Activity size={48} />}
          heading="No recent activity"
          body="Activity from matters, documents, and filings will appear here."
        />
      </Card>
    </>
  );
}
