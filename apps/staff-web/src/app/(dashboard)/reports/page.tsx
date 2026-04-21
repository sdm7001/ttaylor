'use client';

import React from 'react';
import { PageHeader, Card, Button, EmptyState } from '@ttaylor/ui';
import {
  BarChart3,
  Users,
  DollarSign,
  Clock,
  FileText,
  Search,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Report definitions
// ---------------------------------------------------------------------------

interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  lastGenerated: string | null;
}

const reports: ReportDefinition[] = [
  {
    id: 'matter-pipeline',
    title: 'Matter Pipeline',
    description: 'Count of matters by status across the pipeline stages. Shows bottlenecks and workload distribution.',
    icon: <BarChart3 size={24} />,
    color: '#1565C0',
    lastGenerated: null,
  },
  {
    id: 'staff-productivity',
    title: 'Staff Productivity',
    description: 'Matters per paralegal and attorney. Tracks assignment load and completion rates.',
    icon: <Users size={24} />,
    color: '#7c3aed',
    lastGenerated: null,
  },
  {
    id: 'financial-summary',
    title: 'Financial Summary',
    description: 'Billed vs. collected amounts across all matters. Highlights outstanding balances and trust account status.',
    icon: <DollarSign size={24} />,
    color: '#16a34a',
    lastGenerated: null,
  },
  {
    id: 'upcoming-deadlines',
    title: 'Upcoming Deadlines',
    description: 'All deadlines due within the next 30 days. Sorted by urgency with matter and assignment context.',
    icon: <Clock size={24} />,
    color: '#d97706',
    lastGenerated: null,
  },
  {
    id: 'filing-activity',
    title: 'Filing Activity',
    description: 'Court filings by month, type, and outcome. Tracks acceptance rate and common deficiencies.',
    icon: <FileText size={24} />,
    color: '#0891b2',
    lastGenerated: null,
  },
  {
    id: 'discovery-tracker',
    title: 'Discovery Tracker',
    description: 'Overdue discovery responses and pending requests. Highlights items needing immediate attention.',
    icon: <Search size={24} />,
    color: '#dc2626',
    lastGenerated: null,
  },
];

// ---------------------------------------------------------------------------
// Report card component
// ---------------------------------------------------------------------------

function ReportCard({ report }: { report: ReportDefinition }) {
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

        {/* Footer with last generated and run button */}
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
            {report.lastGenerated
              ? `Last run: ${new Date(report.lastGenerated).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`
              : 'Never generated'}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              // TODO: Trigger report generation via tRPC API
              console.log('Run report:', report.id);
            }}
            style={{
              fontSize: '12px',
              padding: '4px 12px',
              color: report.color,
              fontWeight: 600,
            }}
          >
            Run Report
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
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      {/* Placeholder for generated report results */}
      <div style={{ marginTop: '32px' }}>
        <EmptyState
          heading="No reports generated yet"
          body="Click 'Run Report' on any card above to generate a report. Results will appear here."
        />
      </div>
    </>
  );
}
