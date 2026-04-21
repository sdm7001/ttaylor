'use client';

import React from 'react';
import Link from 'next/link';
import { Card, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { MessageSquare } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

/**
 * Messages page for the client portal.
 *
 * Lists all matters the client has access to, with a preview of the
 * most recent portal message for each matter. Clicking a matter
 * navigates to the full message thread.
 */

export default function MessagesPage() {
  const { data: mattersData, isLoading: mattersLoading } = trpc.matters.list.useQuery({
    limit: 20,
  });

  if (mattersLoading) {
    return (
      <>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 20px 0',
            letterSpacing: '-0.01em',
          }}
        >
          Messages
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  const matters = mattersData?.items ?? [];

  if (matters.length === 0) {
    return (
      <>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 20px 0',
            letterSpacing: '-0.01em',
          }}
        >
          Messages
        </h1>
        <EmptyState
          icon={<MessageSquare size={40} />}
          heading="No messages yet"
          body="Your legal team will reach out through this portal when there are updates about your case."
        />
      </>
    );
  }

  return (
    <>
      <h1
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 20px 0',
          letterSpacing: '-0.01em',
        }}
      >
        Messages
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {matters.map((matter) => (
          <MatterMessagePreview key={matter.id} matter={matter} />
        ))}
      </div>
    </>
  );
}

/**
 * Shows a single matter with its latest portal message preview.
 */
function MatterMessagePreview({
  matter,
}: {
  matter: {
    id: string;
    matterType?: { name?: string } | null;
    matterTypeId?: string;
    status: string;
  };
}) {
  const { data: messageData, isLoading } = trpc.portal.getMessages.useQuery({
    matterId: matter.id,
  });

  const matterTypeName =
    matter.matterType?.name ?? matter.matterTypeId?.slice(0, 8) ?? 'Matter';
  const messages = messageData?.messages ?? [];
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const hasMessages = messages.length > 0;

  return (
    <Link
      href={`/messages/${matter.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ color: '#64748b', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {matterTypeName}
              </span>
              {hasMessages && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#1565C0',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>

            {isLoading ? (
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Loading...</span>
            ) : lastMessage ? (
              <span
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '500px',
                }}
              >
                {lastMessage.body.length > 80
                  ? lastMessage.body.slice(0, 80) + '...'
                  : lastMessage.body}
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                No messages yet
              </span>
            )}
          </div>

          {lastMessage && (
            <span
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                flexShrink: 0,
                marginLeft: '12px',
              }}
            >
              {new Date(lastMessage.sentAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
