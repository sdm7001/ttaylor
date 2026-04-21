import React from 'react';
import { PageHeader, Card, EmptyState } from '@ttaylor/ui';
import { Briefcase, FileText, Send, CalendarDays, Activity } from 'lucide-react';

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
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
              color: '#0f172a',
              lineHeight: '32px',
            }}
          >
            {value}
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
          value={0} // TODO: fetch from API
        />
        <StatCard
          icon={<FileText size={20} />}
          label="Pending Documents"
          value={0} // TODO: fetch from API
        />
        <StatCard
          icon={<Send size={20} />}
          label="Filing Queue"
          value={0} // TODO: fetch from API
        />
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Upcoming Deadlines"
          value={0} // TODO: fetch from API
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
