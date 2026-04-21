'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, StatusPill, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { FileText, MessageSquare, Info } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';

/**
 * Matter detail page for client portal.
 *
 * Shows matter summary, shared documents (via portal.getSharedDocuments),
 * and a messages preview (via portal.getMessages) with links to the
 * full messaging thread.
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

  // Portal messages for this matter
  const { data: messageData, isLoading: messagesLoading } =
    trpc.portal.getMessages.useQuery(
      { matterId },
      { enabled: !!matterId }
    );

  // Shared documents for this matter
  const { data: sharedDocs, isLoading: sharedDocsLoading } =
    trpc.portal.getSharedDocuments.useQuery(
      { matterId },
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
    (a: { role?: string; assignmentRole?: string }) =>
      a.role === 'ATTORNEY' || a.assignmentRole === 'ATTORNEY'
  );
  const attorneyName = attorneyAssignment?.user
    ? `${attorneyAssignment.user.firstName} ${attorneyAssignment.user.lastName}`
    : 'Not yet assigned';

  const matterTypeName = matter.matterType?.name ?? matter.matterTypeId ?? '--';

  // Messages preview -- show last 3
  const allMessages = messageData?.messages ?? [];
  const previewMessages = allMessages.slice(-3);

  // Shared documents
  const sharedDocuments = sharedDocs ?? [];

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

        {sharedDocsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <LoadingSpinner size="md" />
          </div>
        ) : sharedDocuments.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            heading="No documents have been shared with you yet"
            body="When your legal team shares documents with you, they will appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sharedDocuments.map(
              (doc: {
                id: string;
                title?: string;
                lifecycleStatus?: string;
                sharedAt?: string | null;
              }) => (
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
                      <div>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#1e293b',
                          }}
                        >
                          {doc.title ?? 'Untitled Document'}
                        </span>
                        {doc.sharedAt && (
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                            Shared{' '}
                            {new Date(doc.sharedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <StatusPill status={doc.lifecycleStatus ?? 'APPROVED'} />
                  </div>
                </Card>
              ),
            )}
          </div>
        )}
      </div>

      {/* Messages section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              margin: 0,
            }}
          >
            Messages
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href={`/messages/${matterId}`}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1565C0',
                textDecoration: 'none',
              }}
            >
              View All Messages
            </Link>
          </div>
        </div>

        {messagesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <LoadingSpinner size="md" />
          </div>
        ) : previewMessages.length === 0 ? (
          <Card>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <MessageSquare size={24} style={{ color: '#94a3b8' }} />
              <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                No messages yet. Your legal team will reach out through this portal.
              </p>
              <Link
                href={`/messages/${matterId}`}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1565C0',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#E3F2FD',
                }}
              >
                Send Message
              </Link>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {previewMessages.map(
              (msg: {
                id: string;
                senderType: string;
                body: string;
                sentAt: string;
              }) => {
                const isClient = msg.senderType === 'CLIENT';
                return (
                  <Card key={msg.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: isClient ? '#1565C0' : '#64748b',
                          }}
                        >
                          {isClient ? 'You' : 'Your Attorney'}
                        </span>
                        <p
                          style={{
                            margin: '2px 0 0 0',
                            fontSize: '14px',
                            color: '#1e293b',
                            lineHeight: '1.4',
                          }}
                        >
                          {msg.body.length > 120
                            ? msg.body.slice(0, 120) + '...'
                            : msg.body}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          flexShrink: 0,
                          marginLeft: '12px',
                        }}
                      >
                        {new Date(msg.sentAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </Card>
                );
              },
            )}

            <Link
              href={`/messages/${matterId}`}
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1565C0',
                textDecoration: 'none',
                padding: '8px',
              }}
            >
              View All Messages
            </Link>
          </div>
        )}
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
