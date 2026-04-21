'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Button,
  EmptyState,
  LoadingSpinner,
} from '@ttaylor/ui';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Audit event type labels
// ---------------------------------------------------------------------------

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Event Types' },
  { value: 'CREATED', label: 'Created' },
  { value: 'UPDATED', label: 'Updated' },
  { value: 'DELETED', label: 'Deleted' },
  { value: 'STAGE_CHANGED', label: 'Stage Changed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FILED', label: 'Filed' },
  { value: 'ACCESSED', label: 'Accessed' },
  { value: 'EXPORTED', label: 'Exported' },
  { value: 'PERMISSION_CHANGED', label: 'Permission Changed' },
  { value: 'CONFLICT_CLEARED', label: 'Conflict Cleared' },
  { value: 'PORTAL_INVITED', label: 'Portal Invited' },
] as const;

function humanReadableEventType(eventType: string): string {
  const found = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType);
  return found ? found.label : eventType.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Event type pill
// ---------------------------------------------------------------------------

function EventTypePill({ eventType }: { eventType: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    CREATED: { bg: '#f0fdf4', color: '#16a34a' },
    UPDATED: { bg: '#eff6ff', color: '#2563eb' },
    DELETED: { bg: '#fef2f2', color: '#dc2626' },
    STAGE_CHANGED: { bg: '#fefce8', color: '#ca8a04' },
    APPROVED: { bg: '#f0fdf4', color: '#16a34a' },
    REJECTED: { bg: '#fef2f2', color: '#dc2626' },
    FILED: { bg: '#ecfdf5', color: '#059669' },
    ACCESSED: { bg: '#f8fafc', color: '#64748b' },
    EXPORTED: { bg: '#fdf4ff', color: '#a855f7' },
    PERMISSION_CHANGED: { bg: '#fffbeb', color: '#d97706' },
    CONFLICT_CLEARED: { bg: '#f0f9ff', color: '#0284c7' },
    PORTAL_INVITED: { bg: '#eff6ff', color: '#2563eb' },
  };

  const style = colors[eventType] ?? { bg: '#f8fafc', color: '#64748b' };

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {humanReadableEventType(eventType)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AuditPage() {
  const router = useRouter();
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [matterIdFilter, setMatterIdFilter] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);

  // Build query input
  const queryInput: {
    limit: number;
    cursor?: string | null;
    eventType?: string;
    matterId?: string;
  } = { limit: 50 };

  if (cursor) queryInput.cursor = cursor;
  if (eventTypeFilter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryInput.eventType = eventTypeFilter as any;
  }

  const { data, isLoading, isFetching } = trpc.audit.list.useQuery(queryInput);

  const items = data?.items ?? [];
  const nextCursor = data?.nextCursor ?? null;

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Review system activity and compliance events"
      />

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Event type dropdown */}
        <select
          value={eventTypeFilter}
          onChange={(e) => {
            setEventTypeFilter(e.target.value);
            setCursor(null);
          }}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
          }}
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Matter ID search */}
        <input
          type="text"
          placeholder="Search by Matter ID..."
          value={matterIdFilter}
          onChange={(e) => {
            setMatterIdFilter(e.target.value);
          }}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            width: '260px',
          }}
        />

        {(eventTypeFilter || matterIdFilter) && (
          <button
            onClick={() => {
              setEventTypeFilter('');
              setMatterIdFilter('');
              setCursor(null);
            }}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
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
          icon={<ShieldCheck size={40} />}
          heading="No audit events found"
          body="No events match your current filters. Try adjusting the filters above."
        />
      ) : (
        <>
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 120px 100px 100px 120px 100px',
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
              <span>Timestamp</span>
              <span>Event Type</span>
              <span>Actor</span>
              <span>Entity Type</span>
              <span>Entity ID</span>
              <span>Details</span>
            </div>

            {/* Rows */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {items.map((event: any) => {
              // Extract matterId from payload if present
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payload = (event.payloadJson ?? {}) as Record<string, any>;
              const payloadMatterId = payload.matterId as string | undefined;

              // Client-side matter ID filter
              if (matterIdFilter) {
                const matchesMatter =
                  event.entityId === matterIdFilter ||
                  payloadMatterId === matterIdFilter;
                if (!matchesMatter) return null;
              }

              return (
                <div
                  key={event.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 120px 100px 100px 120px 100px',
                    gap: '0',
                    padding: '10px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '12px',
                    color: '#1e293b',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#64748b', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>
                    {event.createdAt
                      ? new Date(event.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : '--'}
                  </span>
                  <span>
                    <EventTypePill eventType={event.eventType} />
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontFamily: "'JetBrains Mono', monospace",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={event.actorUserId}
                  >
                    {event.actorUserId?.slice(0, 8) ?? '--'}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>
                    {event.entityType ?? '--'}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontFamily: "'JetBrains Mono', monospace",
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={event.entityId}
                  >
                    {event.entityId?.slice(0, 12) ?? '--'}
                  </span>
                  <span>
                    {payloadMatterId && (
                      <button
                        onClick={() => router.push(`/matters/${payloadMatterId}`)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          color: '#1565C0',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        title="Go to matter"
                      >
                        <ExternalLink size={10} />
                        Matter
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {nextCursor && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button
                variant="secondary"
                onClick={() => setCursor(nextCursor)}
                disabled={isFetching}
              >
                {isFetching ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
