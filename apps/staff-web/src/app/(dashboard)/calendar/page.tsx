'use client';

import React from 'react';
import { PageHeader, Button, Card, EmptyState } from '@ttaylor/ui';
import { Plus, CalendarDays, Clock, Gavel } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types (matches tRPC calendar.getUpcoming response shape)
// ---------------------------------------------------------------------------

interface DeadlineRow {
  id: string;
  title: string;
  dueAt: string; // ISO string from API
  matter: { id: string; title: string; causeNumber: string | null } | null;
  notes: string | null;
}

interface CourtEventRow {
  id: string;
  title: string;
  startAt: string;
  location: string | null;
  matter: { id: string; title: string; causeNumber: string | null } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(daysRemaining: number): string {
  if (daysRemaining < 3) return '#dc2626'; // red
  if (daysRemaining < 7) return '#d97706'; // amber
  return '#16a34a'; // green
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  // TODO: Replace with tRPC query: trpc.calendar.getUpcoming.useQuery({ days: 14 })
  const deadlines: DeadlineRow[] = [];
  const courtEvents: CourtEventRow[] = [];
  const loading = false;

  return (
    <>
      <PageHeader
        title="Calendar"
        actions={
          <Button variant="primary" onClick={() => { /* TODO: open add event dialog */ }}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Add Event
          </Button>
        }
      />

      {/* Upcoming deadlines section */}
      <section style={{ marginBottom: '32px' }}>
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 12px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          <Clock size={18} />
          Upcoming Deadlines (Next 14 Days)
        </h2>

        {deadlines.length === 0 ? (
          <EmptyState
            heading="No upcoming deadlines"
            body="All deadlines are either completed or further than 14 days out."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deadlines.map((deadline) => {
              const days = daysUntil(deadline.dueAt);
              const color = urgencyColor(days);
              return (
                <Card key={deadline.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                        {deadline.title}
                      </div>
                      {deadline.matter && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {deadline.matter.title}
                          {deadline.matter.causeNumber
                            ? ` (${deadline.matter.causeNumber})`
                            : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        {formatDate(deadline.dueAt)}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color,
                          backgroundColor: `${color}10`,
                          border: `1px solid ${color}30`,
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {days <= 0
                          ? 'OVERDUE'
                          : days === 1
                            ? '1 day'
                            : `${days} days`}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming court dates section */}
      <section>
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 0 12px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#0f172a',
          }}
        >
          <Gavel size={18} />
          Upcoming Court Dates
        </h2>

        {courtEvents.length === 0 ? (
          <EmptyState
            heading="No upcoming court dates"
            body="Court dates will appear here when scheduled for matters."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {courtEvents.map((event) => (
              <Card key={event.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {event.matter?.title ?? ''}
                      {event.location ? ` -- ${event.location}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {formatDate(event.startAt)}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#7c3aed',
                        backgroundColor: '#f5f3ff',
                        border: '1px solid #ddd6fe',
                        borderRadius: '9999px',
                      }}
                    >
                      <Gavel size={12} />
                      Court
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
