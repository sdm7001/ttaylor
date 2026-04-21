'use client';

import React from 'react';
import Link from 'next/link';
import { Card, EmptyState } from '@ttaylor/ui';
import { MessageSquare } from 'lucide-react';

/**
 * Messages page for the client portal.
 *
 * Lists message threads with attorney/paralegal staff,
 * sorted by most recent activity. Shows unread count per thread.
 */

// TODO: Replace with tRPC API call to fetch message threads for the authenticated client
interface MessageThread {
  id: string;
  withName: string;
  withRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

const threads: MessageThread[] = [];

export default function MessagesPage() {
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

      {threads.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={40} />}
          title="No messages"
          description="When your legal team sends you a message, it will appear here. You can also start a conversation from your matter page."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/messages/${thread.id}`}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        {thread.withName}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#94a3b8',
                          fontWeight: 500,
                        }}
                      >
                        {thread.withRole}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {thread.lastMessage}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      flexShrink: 0,
                      marginLeft: '16px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {thread.lastMessageAt}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '20px',
                          height: '20px',
                          padding: '0 6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#ffffff',
                          backgroundColor: '#1565C0',
                          borderRadius: '10px',
                        }}
                      >
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
