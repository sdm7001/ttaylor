'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusPill, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { Send, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Status filter tabs
// ---------------------------------------------------------------------------

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'ASSEMBLING', label: 'Draft' },
  { key: 'READY_FOR_ATTORNEY_REVIEW', label: 'Ready for Review' },
  { key: 'ATTORNEY_APPROVED', label: 'Attorney Approved' },
  { key: 'SUBMITTED_TO_COURT', label: 'Submitted' },
  { key: 'ACCEPTED', label: 'Accepted' },
] as const;

type StatusFilter = typeof STATUS_TABS[number]['key'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FilingQueuePage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const { data, isLoading } = trpc.filing.listQueue.useQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter as any,
    limit: 50,
  });

  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Filing Queue"
        subtitle={`${data?.total ?? 0} filing packets`}
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
          icon={<Send size={40} />}
          heading="No filing packets"
          body={
            statusFilter === 'ALL'
              ? 'Create a filing packet from a matter detail page to get started.'
              : `No packets with status "${statusFilter.replace(/_/g, ' ')}".`
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
              gridTemplateColumns: '1.5fr 1fr 0.8fr 100px 140px 120px',
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
            <span>Packet</span>
            <span>Matter</span>
            <span>Filing Type</span>
            <span>Items</span>
            <span>Status</span>
            <span>Created</span>
          </div>

          {/* Table rows */}
          {items.map((packet) => (
            <div
              key={packet.id}
              onClick={() => router.push(`/filing/${packet.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 0.8fr 100px 140px 120px',
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
                {packet.title}
              </span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                {packet.matter?.title ?? '--'}
              </span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>
                {packet.filingType?.replace(/_/g, ' ') ?? '--'}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                {packet.itemCount}
              </span>
              <span>
                <StatusPill status={packet.status} />
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {new Date(packet.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
