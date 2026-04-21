'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';

/**
 * Message thread page for a specific matter.
 *
 * Displays a chat-style layout with staff messages on the left (slate)
 * and client messages on the right (blue). Includes a message input
 * at the bottom for sending new messages.
 */

export default function MessageThreadPage() {
  const params = useParams();
  const matterId = params.matterId as string;

  const [messageBody, setMessageBody] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: matter, isLoading: matterLoading } = trpc.matters.getById.useQuery(
    { id: matterId },
    { enabled: !!matterId },
  );

  const {
    data: messageData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = trpc.portal.getMessages.useQuery(
    { matterId },
    { enabled: !!matterId },
  );

  const sendMessage = trpc.portal.sendMessage.useMutation({
    onSuccess: () => {
      setMessageBody('');
      refetchMessages();
    },
  });

  const messages = messageData?.messages ?? [];
  const matterTypeName =
    matter?.matterType?.name ?? matter?.matterTypeId ?? 'Matter';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend() {
    const trimmed = messageBody.trim();
    if (!trimmed) return;
    sendMessage.mutate({ matterId, body: trimmed });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (matterLoading || messagesLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          href="/messages"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            color: '#64748b',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Back to Messages
        </Link>
      </div>

      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {matterTypeName} -- Messages
      </h1>

      {/* Message thread */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minHeight: '300px',
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
        }}
      >
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={32} />}
            heading="No messages yet"
            body="Send a message to your legal team below."
          />
        ) : (
          messages.map((msg) => {
            const isClient = msg.senderType === 'CLIENT';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isClient ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isClient ? '#1565C0' : '#f1f5f9',
                    color: isClient ? '#ffffff' : '#1e293b',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      marginBottom: '4px',
                      color: isClient ? 'rgba(255,255,255,0.8)' : '#64748b',
                    }}
                  >
                    {isClient ? 'You' : 'Your Attorney'}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.body}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '4px',
                      color: isClient ? 'rgba(255,255,255,0.6)' : '#94a3b8',
                      textAlign: 'right',
                    }}
                  >
                    {new Date(msg.sentAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <Card>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message to your legal team..."
            rows={2}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              resize: 'vertical',
              outline: 'none',
              color: '#0f172a',
              fontFamily: 'inherit',
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!messageBody.trim() || sendMessage.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor:
                !messageBody.trim() || sendMessage.isPending ? '#e2e8f0' : '#1565C0',
              color:
                !messageBody.trim() || sendMessage.isPending ? '#94a3b8' : '#ffffff',
              cursor:
                !messageBody.trim() || sendMessage.isPending
                  ? 'not-allowed'
                  : 'pointer',
              flexShrink: 0,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </Card>
    </div>
  );
}
