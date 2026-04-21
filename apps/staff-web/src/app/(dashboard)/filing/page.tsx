'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusPill, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { Send, Briefcase } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Filing queue page.
 *
 * Since filing.listPackets requires a matterId (no aggregate endpoint yet),
 * this page shows the user's matters and lets them navigate to the matter
 * detail page to manage filing packets.
 *
 * TODO: Add a filing.listQueue aggregate endpoint so we can show all packets
 * across matters in a single view without N+1 queries.
 */

export default function FilingQueuePage() {
  const router = useRouter();
  const { data: mattersData, isLoading } = trpc.matters.list.useQuery({ limit: 50 });
  const matters = mattersData?.items ?? [];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Filing Queue" />
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
        title="Filing Queue"
        subtitle="Select a matter to manage its filing packets"
      />

      {/* TODO: Status filter tabs will be useful once filing.listQueue endpoint exists */}

      {matters.length === 0 ? (
        <EmptyState
          icon={<Send size={40} />}
          heading="No matters found"
          body="Create a matter first, then you can manage its filing packets."
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
      )}
    </>
  );
}
