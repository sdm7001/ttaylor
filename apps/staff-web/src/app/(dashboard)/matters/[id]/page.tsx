'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PageHeader,
  Button,
  Card,
  StatusPill,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '@ttaylor/ui';
import {
  ArrowLeft,
  Users,
  FileText,
  CheckSquare,
  CalendarDays,
  DollarSign,
  StickyNote,
  Send,
  Briefcase,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type TabId =
  | 'overview'
  | 'parties'
  | 'documents'
  | 'filing'
  | 'checklist'
  | 'calendar'
  | 'financial'
  | 'notes';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: Briefcase },
  { id: 'parties', label: 'Parties', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'filing', label: 'Filing', icon: Send },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'notes', label: 'Notes', icon: StickyNote },
];

// ---------------------------------------------------------------------------
// Sub-components for each tab
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OverviewTab({ matter }: { matter: any }) {
  const attorney = matter.assignments?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => a.assignmentRole === 'ATTORNEY' || a.assignmentRole === 'LEAD_ATTORNEY',
  );
  const paralegals = matter.assignments?.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => a.assignmentRole === 'PARALEGAL',
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <Card title="Case Information">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoRow label="Status">
            <StatusPill status={matter.status} />
          </InfoRow>
          <InfoRow label="Cause Number">
            <span
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '13px',
              }}
            >
              {matter.causeNumber ?? '--'}
            </span>
          </InfoRow>
          <InfoRow label="Matter Type">
            {matter.matterType?.name ?? '--'}
          </InfoRow>
          <InfoRow label="Court">{matter.court ?? '--'}</InfoRow>
          <InfoRow label="Judge">{matter.judge ?? '--'}</InfoRow>
        </div>
      </Card>

      <Card title="Assigned Staff">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoRow label="Attorney">
            {attorney
              ? `${attorney.user.firstName} ${attorney.user.lastName}`
              : '--'}
          </InfoRow>
          {paralegals?.map((p: { id: string; user: { firstName: string; lastName: string } }) => (
            <InfoRow key={p.id} label="Paralegal">
              {p.user.firstName} {p.user.lastName}
            </InfoRow>
          ))}
          {matter.assignments
            ?.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (a: any) =>
                a.assignmentRole !== 'ATTORNEY' &&
                a.assignmentRole !== 'LEAD_ATTORNEY' &&
                a.assignmentRole !== 'PARALEGAL',
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((a: any) => (
              <InfoRow key={a.id} label={a.assignmentRole.replace(/_/g, ' ')}>
                {a.user.firstName} {a.user.lastName}
              </InfoRow>
            ))}
        </div>
      </Card>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PartiesTab({ parties }: { parties: any[] }) {
  if (!parties || parties.length === 0) {
    return (
      <EmptyState
        heading="No parties added"
        body="Add parties to this matter to track all involved contacts."
        actionLabel="Add Party"
        onAction={() => {
          /* TODO: open add party dialog */
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {parties.map((party: any) => (
        <Card key={party.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                {party.contact?.firstName} {party.contact?.lastName}
              </div>
              {party.contact?.email && (
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {party.contact.email}
                </div>
              )}
            </div>
            <Badge status={party.roleType ?? party.role} label={(party.roleType ?? party.role ?? '').replace(/_/g, ' ')} />
            {party.adverseFlag && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                ADVERSE
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function DocumentsTab({ matterId }: { matterId: string }) {
  const utils = trpc.useUtils();
  const { data: docData, isLoading } = trpc.documents.list.useQuery({ matterId });
  const documents = docData?.items ?? [];

  const submitForReview = trpc.documents.submitForReview.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate({ matterId });
    },
  });

  const approveDoc = trpc.documents.approve.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate({ matterId });
    },
  });

  const rejectDoc = trpc.documents.reject.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate({ matterId });
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        heading="No documents yet"
        body="Generate or upload documents for this matter."
        actionLabel="New Document"
        onAction={() => {
          /* TODO: open new document dialog */
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {documents.map((doc: any) => (
        <Card key={doc.id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                {doc.title}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {doc.createdAt
                  ? new Date(doc.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StatusPill status={doc.lifecycleStatus ?? doc.status} />

              {/* DRAFT or GENERATED: Submit for Review */}
              {(doc.lifecycleStatus === 'DRAFT' || doc.lifecycleStatus === 'GENERATED') && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    submitForReview.mutate({
                      id: doc.id,
                      reviewType: 'ATTORNEY',
                    });
                  }}
                >
                  Submit for Review
                </Button>
              )}

              {/* INTERNAL_REVIEW or ATTORNEY_REVIEW_REQUIRED: Approve / Reject */}
              {(doc.lifecycleStatus === 'INTERNAL_REVIEW' ||
                doc.lifecycleStatus === 'ATTORNEY_REVIEW_REQUIRED') && (
                <>
                  {/* TODO: Gate Approve/Reject to ATTORNEY role via Clerk user metadata */}
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      approveDoc.mutate({ id: doc.id });
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      const reason = window.prompt('Reason for rejection:');
                      if (reason) {
                        rejectDoc.mutate({ id: doc.id, reason });
                      }
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChecklistTab({ matterId }: { matterId: string }) {
  const utils = trpc.useUtils();
  const { data: checklistInstances, isLoading } = trpc.checklists.getForMatter.useQuery({ matterId });

  const completeItem = trpc.checklists.completeItem.useMutation({
    onSuccess: () => {
      utils.checklists.getForMatter.invalidate({ matterId });
    },
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  if (!checklistInstances || checklistInstances.length === 0) {
    return (
      <EmptyState
        heading="No checklist items"
        body="A checklist will be generated when a template is applied to this matter."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {checklistInstances.map((instance) => {
        const { progress } = instance;

        // Group items by status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = instance.items ?? [] as any[];
        const completed = items.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (i: any) =>
            i.status === 'COMPLETED' || i.status === 'WAIVED' || i.status === 'SKIPPED',
        );
        const inProgress = items.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (i: any) =>
            i.status === 'IN_PROGRESS' || i.status === 'NEEDS_REVIEW' || i.status === 'ATTORNEY_REVIEW',
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notStarted = items.filter((i: any) => i.status === 'NOT_STARTED' || i.status === 'NOT_GENERATED');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blocked = items.filter((i: any) => i.status === 'BLOCKED');

        return (
          <div key={instance.id}>
            {instance.template?.name && (
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px 0' }}>
                {instance.template.name}
              </h3>
            )}

            {/* Progress bar */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress.percent}%`,
                      height: '100%',
                      backgroundColor: progress.percent === 100 ? '#16a34a' : '#1565C0',
                      borderRadius: '4px',
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', minWidth: '48px' }}>
                  {progress.percent}%
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {progress.completed}/{progress.total} complete
                </span>
              </div>
            </Card>

            {/* Item groups */}
            {blocked.length > 0 && (
              <ChecklistGroup title="Blocked" items={blocked} color="#dc2626" onComplete={(itemId) => completeItem.mutate({ itemId })} />
            )}
            {inProgress.length > 0 && (
              <ChecklistGroup title="In Progress" items={inProgress} color="#1565C0" onComplete={(itemId) => completeItem.mutate({ itemId })} />
            )}
            {notStarted.length > 0 && (
              <ChecklistGroup title="Not Started" items={notStarted} color="#64748b" onComplete={(itemId) => completeItem.mutate({ itemId })} />
            )}
            {completed.length > 0 && (
              <ChecklistGroup title="Completed" items={completed} color="#16a34a" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChecklistGroup({
  title,
  items,
  color,
  onComplete,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  color: string;
  onComplete?: (itemId: string) => void;
}) {
  return (
    <div style={{ marginTop: '12px' }}>
      <h4
        style={{
          margin: '0 0 8px',
          fontSize: '13px',
          fontWeight: 600,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title} ({items.length})
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {items.map((item: any) => {
          const itemTitle = item.checklistTemplateItem?.title ?? item.title ?? 'Checklist Item';
          const dueDate = item.checklistTemplateItem?.defaultDueDays
            ? null // computed from matter creation; not shown inline yet
            : item.dueDate;

          return (
            <Card key={item.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                    {itemTitle}
                  </span>
                  {dueDate && (
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                      Due:{' '}
                      {new Date(dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusPill status={item.status} />
                  {onComplete &&
                    (item.status === 'NOT_STARTED' ||
                      item.status === 'NOT_GENERATED' ||
                      item.status === 'IN_PROGRESS') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onComplete(item.id)}
                      >
                        Complete
                      </Button>
                    )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CalendarTab({ matterId }: { matterId: string }) {
  const now = new Date();
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const { data, isLoading } = trpc.calendar.listEvents.useQuery({
    matterId,
    startDate: now,
    endDate,
  });

  if (isLoading) {
    return <LoadingSpinner size="md" />;
  }

  const events = data?.events ?? [];
  const deadlines = data?.deadlines ?? [];

  if (events.length === 0 && deadlines.length === 0) {
    return (
      <EmptyState
        heading="No events scheduled"
        body="Add court dates, deadlines, and meetings for this matter."
        actionLabel="Add Event"
        onAction={() => {
          /* TODO: open add event dialog */
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {events.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1565C0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Events ({events.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {events.map((event: any) => (
              <Card key={event.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                      {event.title}
                    </span>
                    {event.location && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                        {event.location}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge status={event.eventType} label={event.eventType} />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(event.startAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {deadlines.length > 0 && (
        <div>
          <h4
            style={{
              margin: '0 0 8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#dc2626',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Deadlines ({deadlines.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {deadlines.map((deadline: any) => {
              const isOverdue = new Date(deadline.dueAt) < new Date();
              return (
                <Card key={deadline.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                      {deadline.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isOverdue && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#dc2626',
                            backgroundColor: '#fef2f2',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          OVERDUE
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 700 : 400 }}>
                        {new Date(deadline.dueAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilingTab() {
  return (
    <EmptyState
      heading="Filing managed from queue"
      body="Filing packets are managed from the Filing Queue page."
      actionLabel="Go to Filing Queue"
      onAction={() => {
        window.location.href = '/filing';
      }}
    />
  );
}

function FinancialTab() {
  // TODO: integrate financial records
  return (
    <EmptyState
      heading="No financial records"
      body="Financial tracking will appear here once invoices or payments are recorded. (TODO)"
    />
  );
}

function NotesTab() {
  // TODO: integrate notes/activity feed
  return (
    <EmptyState
      heading="No notes yet"
      body="Add notes to keep a running record of case activity. (TODO)"
      actionLabel="Add Note"
      onAction={() => {
        /* TODO: open add note dialog */
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span
        style={{
          width: '120px',
          flexShrink: 0,
          fontSize: '13px',
          color: '#64748b',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '14px', color: '#0f172a' }}>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function MatterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const matterId = params.id;

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const {
    data: matter,
    isLoading: matterLoading,
    error: matterError,
  } = trpc.matters.getById.useQuery({ id: matterId });

  if (matterLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (matterError || !matter) {
    return (
      <>
        <PageHeader title="Matter Not Found" />
        <EmptyState
          heading="Matter not found"
          body={matterError?.message ?? 'The requested matter could not be loaded.'}
          actionLabel="Back to Matters"
          onAction={() => router.push('/matters')}
        />
      </>
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab matter={matter} />;
      case 'parties':
        return <PartiesTab parties={matter.parties ?? []} />;
      case 'documents':
        return <DocumentsTab matterId={matterId} />;
      case 'filing':
        return <FilingTab />;
      case 'checklist':
        return <ChecklistTab matterId={matterId} />;
      case 'calendar':
        return <CalendarTab matterId={matterId} />;
      case 'financial':
        return <FinancialTab />;
      case 'notes':
        return <NotesTab />;
      default:
        return null;
    }
  }

  return (
    <>
      <PageHeader
        title={matter.title || 'Matter Detail'}
        subtitle={
          matter.causeNumber
            ? `Cause No. ${matter.causeNumber}`
            : undefined
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/matters')}
            >
              <ArrowLeft size={16} style={{ marginRight: '4px' }} />
              Back to Matters
            </Button>
          </div>
        }
      />

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#1565C0' : '#64748b',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '3px solid #1565C0'
                  : '3px solid transparent',
                cursor: 'pointer',
                transition: 'color 100ms ease, border-color 100ms ease',
                marginBottom: '-1px',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </>
  );
}
