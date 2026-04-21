'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusPill, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { Search, Briefcase } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Discovery page.
 *
 * Since discovery.listRequests requires a matterId (no aggregate endpoint),
 * this page shows active matters and lets the user navigate into a matter
 * to manage its discovery requests from the matter detail page.
 *
 * TODO: Add a discovery.listQueue aggregate endpoint to show all discovery
 * requests across matters without N+1 queries. When that exists, restore
 * the DataTable with type/status filters.
 */

export default function DiscoveryPage() {
  const router = useRouter();
  const { data: mattersData, isLoading } = trpc.matters.list.useQuery({
    limit: 100,
    status: 'ACTIVE',
  });
  const matters = mattersData?.items ?? [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Discovery" />
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

  return (
    <>
      <PageHeader
        title="Discovery"
        subtitle="Open a matter to manage its discovery requests"
      />

      {matters.length === 0 ? (
        <EmptyState
          icon={<Search size={40} />}
          heading="No active matters"
          body="Discovery requests are managed within individual matters. Create and activate a matter to begin tracking discovery."
          actionLabel="Go to Matters"
          onAction={() => router.push('/matters')}
        />
      ) : (
        <>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              margin: '0 0 12px 0',
            }}
          >
            Active Matters
          </h3>
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
                gridTemplateColumns: '1.5fr 1fr 1fr 140px',
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
              <span>Cause Number</span>
              <span>Type</span>
              <span>Status</span>
            </div>

            {/* Table rows */}
            {matters.map((matter: {
              id: string;
              title: string;
              causeNumber?: string | null;
              status: string;
              matterType?: { name: string } | null;
            }) => (
              <div
                key={matter.id}
                onClick={() => router.push(`/matters/${matter.id}`)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 140px',
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
                  <Briefcase size={14} style={{ color: '#64748b' }} />
                  {matter.title}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  {matter.causeNumber ?? '--'}
                </span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  {matter.matterType?.name ?? '--'}
                </span>
                <span>
                  <StatusPill status={matter.status} />
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
