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
import { MatterStatus, ChecklistItemStatus, DocumentLifecycle, PartyRole } from '@ttaylor/domain';
import type {
  MatterParty,
  Document as TtaylorDocument,
  ChecklistItemInstance,
} from '@ttaylor/domain';
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
// Placeholder data (will be replaced by API calls)
// ---------------------------------------------------------------------------

// TODO: Replace with tRPC query: trpc.matters.getById.useQuery({ id })
const useMatterData = (_id: string) => {
  // Placeholder -- returns empty/default data
  return {
    loading: false,
    matter: {
      id: _id,
      title: '',
      status: MatterStatus.OPEN,
      causeNumber: null as string | null,
      court: null as string | null,
      judge: null as string | null,
      matterType: '',
      assignments: [] as Array<{
        id: string;
        role: string;
        user: { firstName: string; lastName: string };
      }>,
    },
    parties: [] as MatterParty[],
    documents: [] as TtaylorDocument[],
    checklistItems: [] as ChecklistItemInstance[],
  };
};

// ---------------------------------------------------------------------------
// Sub-components for each tab
// ---------------------------------------------------------------------------

function OverviewTab({
  matter,
}: {
  matter: ReturnType<typeof useMatterData>['matter'];
}) {
  const attorney = matter.assignments.find((a) => a.role === 'ATTORNEY' || a.role === 'LEAD_ATTORNEY');
  const paralegal = matter.assignments.find((a) => a.role === 'PARALEGAL');

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
          <InfoRow label="Matter Type">{matter.matterType || '--'}</InfoRow>
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
          <InfoRow label="Paralegal">
            {paralegal
              ? `${paralegal.user.firstName} ${paralegal.user.lastName}`
              : '--'}
          </InfoRow>
          {matter.assignments
            .filter((a) => a !== attorney && a !== paralegal)
            .map((a) => (
              <InfoRow key={a.id} label={a.role.replace(/_/g, ' ')}>
                {a.user.firstName} {a.user.lastName}
              </InfoRow>
            ))}
        </div>
      </Card>
    </div>
  );
}

function PartiesTab({ parties }: { parties: MatterParty[] }) {
  if (parties.length === 0) {
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
      {parties.map((party) => (
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
            <Badge status={party.role} label={party.role.replace(/_/g, ' ')} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function DocumentsTab({ documents }: { documents: TtaylorDocument[] }) {
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
      {documents.map((doc) => (
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
              <StatusPill status={doc.status} />
              {doc.status === DocumentLifecycle.DRAFT && (
                <Button size="sm" variant="secondary" onClick={() => { /* TODO: generate */ }}>
                  Generate
                </Button>
              )}
              {doc.status === DocumentLifecycle.GENERATED && (
                <Button size="sm" variant="secondary" onClick={() => { /* TODO: submit for review */ }}>
                  Submit for Review
                </Button>
              )}
              {doc.status === DocumentLifecycle.ATTORNEY_REVIEW && (
                <Button size="sm" variant="primary" onClick={() => { /* TODO: approve */ }}>
                  Approve
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChecklistTab({ items }: { items: ChecklistItemInstance[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        heading="No checklist items"
        body="A checklist will be generated when a template is applied to this matter."
      />
    );
  }

  // Group by status
  const completed = items.filter(
    (i) =>
      i.status === ChecklistItemStatus.COMPLETED ||
      i.status === ChecklistItemStatus.WAIVED ||
      i.status === ChecklistItemStatus.SKIPPED,
  );
  const inProgress = items.filter(
    (i) =>
      i.status === ChecklistItemStatus.IN_PROGRESS ||
      i.status === ChecklistItemStatus.NEEDS_REVIEW ||
      i.status === ChecklistItemStatus.ATTORNEY_REVIEW,
  );
  const notStarted = items.filter(
    (i) => i.status === ChecklistItemStatus.NOT_STARTED,
  );
  const blocked = items.filter(
    (i) => i.status === ChecklistItemStatus.BLOCKED,
  );

  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((completed.length / total) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                width: `${pct}%`,
                height: '100%',
                backgroundColor: pct === 100 ? '#16a34a' : '#1565C0',
                borderRadius: '4px',
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', minWidth: '48px' }}>
            {pct}%
          </span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {completed.length}/{total} complete
          </span>
        </div>
      </Card>

      {/* Item groups */}
      {blocked.length > 0 && (
        <ChecklistGroup title="Blocked" items={blocked} color="#dc2626" />
      )}
      {inProgress.length > 0 && (
        <ChecklistGroup title="In Progress" items={inProgress} color="#1565C0" />
      )}
      {notStarted.length > 0 && (
        <ChecklistGroup title="Not Started" items={notStarted} color="#64748b" />
      )}
      {completed.length > 0 && (
        <ChecklistGroup title="Completed" items={completed} color="#16a34a" />
      )}
    </div>
  );
}

function ChecklistGroup({
  title,
  items,
  color,
}: {
  title: string;
  items: ChecklistItemInstance[];
  color: string;
}) {
  return (
    <div>
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
        {items.map((item) => (
          <Card key={item.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                  {item.title}
                </span>
                {item.dueDate && (
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                    Due:{' '}
                    {new Date(item.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusPill status={item.status} />
                {(item.status === ChecklistItemStatus.NOT_STARTED ||
                  item.status === ChecklistItemStatus.IN_PROGRESS) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      // TODO: trpc.checklists.completeItem.mutate({ itemId: item.id })
                    }}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CalendarTab() {
  // TODO: integrate trpc.calendar.listEvents
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

function FinancialTab() {
  // TODO: integrate financial records
  return (
    <EmptyState
      heading="No financial records"
      body="Financial tracking will appear here once invoices or payments are recorded."
    />
  );
}

function NotesTab() {
  // TODO: integrate notes/activity feed
  return (
    <EmptyState
      heading="No notes yet"
      body="Add notes to keep a running record of case activity."
      actionLabel="Add Note"
      onAction={() => {
        /* TODO: open add note dialog */
      }}
    />
  );
}

function FilingTab() {
  // TODO: integrate filing packets
  return (
    <EmptyState
      heading="No filing packets"
      body="Create a filing packet to assemble documents for court submission."
      actionLabel="New Filing Packet"
      onAction={() => {
        /* TODO: open new filing packet dialog */
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
  const { loading, matter, parties, documents, checklistItems } = useMatterData(matterId);

  if (loading) {
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

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab matter={matter} />;
      case 'parties':
        return <PartiesTab parties={parties} />;
      case 'documents':
        return <DocumentsTab documents={documents} />;
      case 'filing':
        return <FilingTab />;
      case 'checklist':
        return <ChecklistTab items={checklistItems} />;
      case 'calendar':
        return <CalendarTab />;
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
