'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, StatusPill, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { FileText, MessageSquare, Info } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';

/**
 * Matter detail page for client portal.
 *
 * Shows matter summary, shared documents, and messaging info.
 * Clients are READ-ONLY -- no editing capabilities.
 *
 * Documents are filtered to APPROVED and FILED statuses only,
 * which are the ones appropriate for client view.
 */

/** Status label helper for inline display */
const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const valueStyle: React.CSSProperties = {
  margin: '4px 0 0 0',
  fontSize: '14px',
  color: '#1e293b',
};

export default function MatterDetailPage() {
  const params = useParams();
  const matterId = params.id as string;

  const { data: matter, isLoading: matterLoading } = trpc.matters.getById.useQuery(
    { id: matterId },
    { enabled: !!matterId }
  );

  // Fetch documents for this matter -- we filter client-visible statuses below
  const { data: docsData, isLoading: docsLoading } = trpc.documents.list.useQuery(
    { matterId, limit: 50 },
    { enabled: !!matterId }
  );

  if (matterLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!matter) {
    return (
      <EmptyState
        icon={<Info size={40} />}
        heading="Matter not found"
        body="This matter could not be loaded. It may have been removed or you may not have access."
      />
    );
  }

  // Extract attorney from assignments
  const attorneyAssignment = matter.assignments?.find(
    (a: { role?: string }) => a.role === 'ATTORNEY'
  );
  const attorneyName = attorneyAssignment?.user
    ? `${attorneyAssignment.user.firstName} ${attorneyAssignment.user.lastName}`
    : 'Not yet assigned';

  const matterTypeName = matter.matterType?.name ?? matter.matterTypeId ?? '--';

  // Filter documents to client-visible statuses
  const clientVisibleStatuses = ['APPROVED', 'FILED'];
  const sharedDocuments = (docsData?.items ?? []).filter(
    (doc: { lifecycleStatus?: string }) =>
      doc.lifecycleStatus && clientVisibleStatuses.includes(doc.lifecycleStatus)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Matter summary */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
            }}
          >
            {matterTypeName}
          </h1>
          <StatusPill status={matter.status} />
        </div>

        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <span style={labelStyle}>Matter Type</span>
              <p style={valueStyle}>{matterTypeName}</p>
            </div>
            <div>
              <span style={labelStyle}>Status</span>
              <p style={valueStyle}>{matter.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <span style={labelStyle}>Cause Number</span>
              <p
                style={{
                  ...valueStyle,
                  fontFamily: matter.causeNumber
                    ? "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
                    : undefined,
                }}
              >
                {matter.causeNumber ?? 'Not yet assigned'}
              </p>
            </div>
            <div>
              <span style={labelStyle}>Court</span>
              <p style={valueStyle}>{matter.court ?? 'Not yet assigned'}</p>
            </div>
            <div>
              <span style={labelStyle}>Assigned Attorney</span>
              <p style={valueStyle}>{attorneyName}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Shared documents section */}
      <div>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0f172a',
            margin: '0 0 12px 0',
          }}
        >
          Shared Documents
        </h2>

        {docsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <LoadingSpinner size="md" />
          </div>
        ) : sharedDocuments.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            heading="No shared documents"
            body="Documents shared by your legal team will appear here once they have been approved or filed."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sharedDocuments.map((doc: { id: string; title?: string; lifecycleStatus?: string }) => (
              <Card key={doc.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} style={{ color: '#64748b' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                      {doc.title ?? 'Untitled Document'}
                    </span>
                  </div>
                  <StatusPill status={doc.lifecycleStatus ?? 'APPROVED'} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Messages section */}
      <div>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0f172a',
            margin: '0 0 12px 0',
          }}
        >
          Messages
        </h2>

        <EmptyState
          icon={<MessageSquare size={32} />}
          heading="No messages yet"
          body="Contact your legal team by phone or email. A secure messaging feature is planned for a future update."
        />
      </div>

      {/* Important notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '14px 16px',
          backgroundColor: '#FFF8E1',
          border: '1px solid #FFE082',
          borderRadius: '8px',
        }}
      >
        <Info size={18} style={{ color: '#F9A825', flexShrink: 0, marginTop: '1px' }} />
        <p style={{ margin: 0, fontSize: '13px', color: '#5D4037', lineHeight: '1.5' }}>
          This portal shows information shared by your legal team. For questions about
          your case, please call our office directly.
        </p>
      </div>
    </div>
  );
}
