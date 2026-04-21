'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, StatusPill, EmptyState } from '@ttaylor/ui';
import { FileText, MessageSquare, Info } from 'lucide-react';

/**
 * Matter detail page for client portal.
 *
 * Shows matter summary, shared documents, and messages.
 * Clients are READ-ONLY -- no editing capabilities.
 */

// TODO: Replace with tRPC API call to fetch matter details for the authenticated client
interface SharedDocument {
  id: string;
  title: string;
  status: string;
  sharedAt: string;
}

interface PortalMessage {
  id: string;
  from: string;
  content: string;
  sentAt: string;
}

export default function MatterDetailPage() {
  const params = useParams();
  const matterId = params.id as string;

  // TODO: Fetch from tRPC API using matterId
  const matter = {
    id: matterId,
    matterType: 'Divorce',
    status: 'ACTIVE',
    causeNumber: undefined as string | undefined,
    court: undefined as string | undefined,
    attorney: { firstName: 'Jane', lastName: 'Smith' },
  };

  const sharedDocuments: SharedDocument[] = [];
  const messages: PortalMessage[] = [];

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
            {matter.matterType}
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
              <span
                style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Matter Type
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1e293b' }}>
                {matter.matterType}
              </p>
            </div>
            <div>
              <span
                style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Status
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1e293b' }}>
                {matter.status.replace(/_/g, ' ')}
              </p>
            </div>
            {matter.causeNumber && (
              <div>
                <span
                  style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Cause Number
                </span>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#1e293b',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  }}
                >
                  {matter.causeNumber}
                </p>
              </div>
            )}
            {matter.court && (
              <div>
                <span
                  style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Court
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1e293b' }}>
                  {matter.court}
                </p>
              </div>
            )}
            <div>
              <span
                style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Assigned Attorney
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1e293b' }}>
                {matter.attorney.firstName} {matter.attorney.lastName}
              </p>
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

        {sharedDocuments.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            title="No shared documents"
            description="Documents shared by your legal team will appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sharedDocuments.map((doc) => (
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
                      {doc.title}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Shared {doc.sharedAt}
                  </span>
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

        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={32} />}
            title="No messages"
            description="Messages from your legal team will appear here. You can use this to communicate with your attorney."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((msg) => (
              <Card key={msg.id}>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                      {msg.from}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {msg.sentAt}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                    {msg.content}
                  </p>
                </div>
              </Card>
            ))}
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
          your case, please use the message feature above or call our office directly.
        </p>
      </div>
    </div>
  );
}
