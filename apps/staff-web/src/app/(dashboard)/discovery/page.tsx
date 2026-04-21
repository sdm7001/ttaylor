'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusPill, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { Search, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Status filter tabs
// ---------------------------------------------------------------------------

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'RESPONDED', label: 'Responded' },
  { key: 'OBJECTED', label: 'Objected' },
  { key: 'WITHDRAWN', label: 'Withdrawn' },
] as const;

type StatusFilter = typeof STATUS_TABS[number]['key'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(dueAt: string | Date | null): boolean {
  if (!dueAt) return false;
  return new Date(dueAt) < new Date();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DiscoveryPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { data, isLoading } = trpc.discovery.listQueue.useQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: 50,
  });

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Discovery"
        subtitle={`${data?.total ?? 0} discovery requests`}
      />

      {/* Status filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#1565C0' : '#64748b',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '3px solid #1565C0'
                  : '3px solid transparent',
                cursor: 'pointer',
                transition: 'color 100ms ease, border-color 100ms ease',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
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
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search size={40} />}
          heading="No discovery requests"
          body={
            statusFilter === 'ALL'
              ? 'Discovery requests are created from within matter detail pages.'
              : `No requests with status "${statusFilter}".`
          }
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
              gridTemplateColumns: '1fr 1.2fr 140px 120px 120px',
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
            <span>Type</span>
            <span>Matter</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Served</span>
          </div>

          {/* Table rows */}
          {items.map((req) => {
            const overdue = req.status === 'PENDING' && isOverdue(req.dueAt);
            return (
              <div
                key={req.id}
                onClick={() => {
                  if (req.matter) {
                    router.push(`/matters/${req.matter.id}`);
                  }
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 140px 120px 120px',
                  gap: '0',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '13px',
                  color: '#1e293b',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} style={{ color: '#64748b' }} />
                  {req.requestType?.replace(/_/g, ' ') ?? '--'}
                </span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  {req.matter?.title ?? '--'}
                </span>
                <span>
                  <StatusPill status={overdue ? 'OVERDUE' : req.status} />
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: overdue ? '#dc2626' : '#64748b',
                    fontWeight: overdue ? 700 : 400,
                  }}
                >
                  {formatDate(req.dueAt)}
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {formatDate(req.servedAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
