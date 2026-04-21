'use client';

import React, { useState } from 'react';
import { PageHeader, Button, Card, EmptyState } from '@ttaylor/ui';
import { Plus, Clock, Gavel } from 'lucide-react';
import { trpc } from '@/lib/trpc';

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
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.calendar.getUpcoming.useQuery(
    { days: 14, assignedToMe: false },
    { staleTime: 60_000 },
  );

  // Matter list for the add-event dialog
  const { data: mattersData } = trpc.matters.list.useQuery({ limit: 100 });
  const matters = mattersData?.items ?? [];

  // Add event dialog state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventMatterId, setEventMatterId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('HEARING');
  const [scheduledAt, setScheduledAt] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventError, setEventError] = useState<string | null>(null);

  const createEvent = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      utils.calendar.getUpcoming.invalidate();
      setShowAddEvent(false);
      setEventMatterId('');
      setEventTitle('');
      setEventType('HEARING');
      setScheduledAt('');
      setEventDescription('');
      setEventError(null);
    },
    onError: (err) => {
      setEventError(err.message || 'Failed to create event');
    },
  });

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    outline: 'none',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  };

  function handleCreateEvent() {
    setEventError(null);
    if (!eventMatterId) {
      setEventError('Please select a matter');
      return;
    }
    if (!eventTitle.trim()) {
      setEventError('Title is required');
      return;
    }
    if (!scheduledAt) {
      setEventError('Date/time is required');
      return;
    }
    createEvent.mutate({
      matterId: eventMatterId,
      title: eventTitle.trim(),
      eventType: eventType as any,
      startAt: new Date(scheduledAt),
      notes: eventDescription.trim() || undefined,
      isCourtDate: eventType === 'HEARING',
    });
  }

  const deadlines = data?.deadlines ?? [];
  const courtEvents = data?.courtEvents ?? [];

  return (
    <>
      <PageHeader
        title="Calendar"
        actions={
          <Button variant="primary" onClick={() => setShowAddEvent(true)}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            Add Event
          </Button>
        }
      />

      {/* Add Event dialog */}
      {showAddEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddEvent(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              width: '480px',
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Add Event / Deadline
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Matter <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={{ ...fieldStyle, appearance: 'auto' as const }}
                value={eventMatterId}
                onChange={(e) => setEventMatterId(e.target.value)}
              >
                <option value="">Select matter...</option>
                {matters.map((m: { id: string; title: string | null }) => (
                  <option key={m.id} value={m.id}>
                    {m.title ?? m.id}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Title <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input style={fieldStyle} value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g., Final Hearing" />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Event Type
              </label>
              <select style={{ ...fieldStyle, appearance: 'auto' as const }} value={eventType} onChange={(e) => setEventType(e.target.value)}>
                <option value="HEARING">Hearing</option>
                <option value="DEADLINE">Deadline</option>
                <option value="MEDIATION">Mediation</option>
                <option value="DEPOSITION">Deposition</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Date / Time <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input type="datetime-local" style={fieldStyle} value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                style={{ ...fieldStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
            {eventError && (
              <div style={{ marginBottom: '12px', fontSize: '13px', color: '#dc2626' }}>{eventError}</div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowAddEvent(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreateEvent} disabled={createEvent.isPending}>
                {createEvent.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </div>
        </div>
      )}

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

        {isLoading ? (
          <Card>
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Loading deadlines...
            </div>
          </Card>
        ) : deadlines.length === 0 ? (
          <EmptyState
            heading="No upcoming deadlines"
            body="All deadlines are either completed or further than 14 days out."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deadlines.map((deadline: { id: string; title: string; dueAt: string; matter: { id: string; title: string; causeNumber: string | null } | null; notes: string | null }) => {
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

        {isLoading ? (
          <Card>
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Loading court events...
            </div>
          </Card>
        ) : courtEvents.length === 0 ? (
          <EmptyState
            heading="No upcoming court dates"
            body="Court dates will appear here when scheduled for matters."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {courtEvents.map((event: { id: string; title: string; startAt: string; location: string | null; matter: { id: string; title: string; causeNumber: string | null } | null }) => (
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
