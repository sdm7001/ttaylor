'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, Button, StatusPill } from '@ttaylor/ui';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Status mapping helpers (Prisma -> human-readable)
// ---------------------------------------------------------------------------
type PrismaLeadStatus =
  | 'NEW'
  | 'INTAKE_PENDING'
  | 'CONFLICT_CHECK'
  | 'CONSULTATION_SCHEDULED'
  | 'CONSULTATION_COMPLETED'
  | 'RETAINED'
  | 'DECLINED'
  | 'CLOSED';

function humanStatus(status: string): string {
  const map: Record<string, string> = {
    NEW: 'New',
    INTAKE_PENDING: 'Contacted',
    CONFLICT_CHECK: 'Conflict Check',
    CONSULTATION_SCHEDULED: 'Consultation Scheduled',
    CONSULTATION_COMPLETED: 'Qualified',
    RETAINED: 'Converted',
    DECLINED: 'Rejected',
    CLOSED: 'Closed',
  };
  return map[status] ?? status;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const cardStyle: React.CSSProperties = {
  padding: '20px 24px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  marginBottom: '16px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#0f172a',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #f1f5f9',
};

const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
  fontSize: '14px',
};

const fieldLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontWeight: 500,
};

const fieldValueStyle: React.CSSProperties = {
  color: '#0f172a',
};

const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: '6px',
  border: '1px solid #CBD5E1',
  backgroundColor: '#ffffff',
  color: '#334155',
  cursor: 'pointer',
  width: '100%',
  marginBottom: '8px',
};

const btnPrimaryStyle: React.CSSProperties = {
  ...btnStyle,
  backgroundColor: '#1565C0',
  color: '#ffffff',
  border: 'none',
};

const btnDangerStyle: React.CSSProperties = {
  ...btnStyle,
  backgroundColor: '#dc2626',
  color: '#ffffff',
  border: 'none',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const utils = trpc.useUtils();

  const { data: lead, isLoading, error } = trpc.intake.getById.useQuery({ id: leadId });

  const runConflict = trpc.intake.runConflictCheck.useMutation({
    onSuccess: () => utils.intake.getById.invalidate({ id: leadId }),
  });

  const updateStatus = trpc.intake.updateLeadStatus.useMutation({
    onSuccess: () => utils.intake.getById.invalidate({ id: leadId }),
  });

  // Convert to Matter state
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertMatterType, setConvertMatterType] = useState('');
  const [convertAttorney, setConvertAttorney] = useState('');
  const convertMutation = trpc.intake.convertToMatter.useMutation({
    onSuccess: (result) => {
      router.push(`/matters/${result.matterId}`);
    },
  });

  // Escalation notes state
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateNote, setEscalateNote] = useState('');

  if (isLoading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#64748b' }}>
        Loading lead...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: '#dc2626' }}>
        {error?.message ?? 'Lead not found'}
      </div>
    );
  }

  const contact = lead.contact;
  const status = lead.status as PrismaLeadStatus;
  const latestConflict = lead.conflictChecks?.[0] ?? null;
  const conflictSnapshot =
    latestConflict?.searchSnapshotJson && typeof latestConflict.searchSnapshotJson === 'object'
      ? (latestConflict.searchSnapshotJson as Record<string, unknown>)
      : null;
  const conflictMatches = (conflictSnapshot?.matches as Array<Record<string, string>>) ?? [];
  const hasConflict = conflictMatches.length > 0;

  // Parse notes lines
  const noteLines = lead.notesSummary?.split('\n') ?? [];

  return (
    <>
      <PageHeader
        title={
          contact
            ? `${contact.firstName} ${contact.lastName} -- Intake`
            : `Lead -- Intake`
        }
        actions={<StatusPill status={humanStatus(status)} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* ================================================================= */}
        {/* LEFT PANEL */}
        {/* ================================================================= */}
        <div>
          {/* Contact Information */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Contact Information</h3>
            <div style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Name</span>
              <span style={fieldValueStyle}>
                {contact ? `${contact.firstName} ${contact.lastName}` : '--'}
              </span>
            </div>
            <div style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Email</span>
              <span style={fieldValueStyle}>{contact?.email ?? '--'}</span>
            </div>
            <div style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Phone</span>
              <span style={fieldValueStyle}>{contact?.phoneMobile ?? '--'}</span>
            </div>
          </div>

          {/* Matter Details */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Matter Details</h3>
            <div style={fieldRowStyle}>
              <span style={fieldLabelStyle}>Practice Area</span>
              <span style={fieldValueStyle}>{lead.source ?? '--'}</span>
            </div>
            {noteLines.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={fieldLabelStyle}>Notes</span>
                <div
                  style={{
                    marginTop: '6px',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#334155',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {lead.notesSummary}
                </div>
              </div>
            )}
          </div>

          {/* Conflict Check Section */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Conflict Check</h3>

            {!latestConflict && !runConflict.isPending && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                  No conflict check has been run for this lead.
                </p>
                <button
                  style={{
                    ...btnPrimaryStyle,
                    width: 'auto',
                    padding: '8px 24px',
                  }}
                  onClick={() => runConflict.mutate({ leadId })}
                >
                  Run Conflict Check
                </button>
              </div>
            )}

            {runConflict.isPending && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  color: '#64748b',
                  fontSize: '14px',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '2px solid #e2e8f0',
                    borderTopColor: '#1565C0',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginRight: '8px',
                    verticalAlign: 'middle',
                  }}
                />
                Searching for conflicts...
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {runConflict.isError && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '13px',
                }}
              >
                Error: {runConflict.error.message}
              </div>
            )}

            {latestConflict && !runConflict.isPending && (
              <>
                {!hasConflict ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '16px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="#16a34a">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '14px' }}>
                      No conflicts found. Safe to proceed.
                    </span>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        marginBottom: '12px',
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>&#9888;</span>
                      <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '14px' }}>
                        Potential Conflict Detected ({conflictMatches.length} match{conflictMatches.length > 1 ? 'es' : ''})
                      </span>
                    </div>

                    {conflictMatches.map((match, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: '#fff7ed',
                          border: '1px solid #fed7aa',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                          {match.contactName}
                        </div>
                        <div style={{ color: '#64748b' }}>
                          Matter: {match.matterTitle} ({match.matterStatus})
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '12px' }}>
                  <button
                    style={{ ...btnStyle, width: 'auto', padding: '6px 16px' }}
                    onClick={() => runConflict.mutate({ leadId })}
                    disabled={runConflict.isPending}
                  >
                    Re-run Conflict Check
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL */}
        {/* ================================================================= */}
        <div>
          {/* Lead Status Card */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Lead Status</h3>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <StatusPill status={humanStatus(status)} />
            </div>

            {/* Action buttons based on status */}
            {status === 'NEW' && (
              <button
                style={btnPrimaryStyle}
                onClick={() =>
                  updateStatus.mutate({ id: leadId, status: 'INTAKE_PENDING' })
                }
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Updating...' : 'Mark as Contacted'}
              </button>
            )}

            {status === 'INTAKE_PENDING' && (
              <>
                <button
                  style={btnPrimaryStyle}
                  onClick={() =>
                    updateStatus.mutate({ id: leadId, status: 'CONSULTATION_COMPLETED' })
                  }
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? 'Updating...' : 'Mark as Qualified'}
                </button>
                <button
                  style={btnStyle}
                  onClick={() => runConflict.mutate({ leadId })}
                  disabled={runConflict.isPending}
                >
                  Run Conflict Check
                </button>
              </>
            )}

            {status === 'CONSULTATION_COMPLETED' && (
              <>
                {!showConvertForm ? (
                  <button
                    style={btnPrimaryStyle}
                    onClick={() => setShowConvertForm(true)}
                  >
                    Convert to Matter
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#64748b',
                          marginBottom: '4px',
                        }}
                      >
                        Matter Type
                      </label>
                      {/* TODO: Fetch matter types from API when matterTypes.list endpoint is available */}
                      <select
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '13px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                        }}
                        value={convertMatterType}
                        onChange={(e) => setConvertMatterType(e.target.value)}
                      >
                        <option value="">Select type...</option>
                        <option value="divorce">Divorce</option>
                        <option value="sapcr">SAPCR / Custody</option>
                        <option value="child-support">Child Support</option>
                        <option value="modification">Modification</option>
                        <option value="adoption">Adoption</option>
                        <option value="grandparents-rights">Grandparents&apos; Rights</option>
                        <option value="mediation">Mediation</option>
                        <option value="enforcement">Post-Order Enforcement</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#64748b',
                          marginBottom: '4px',
                        }}
                      >
                        Assign Attorney
                      </label>
                      {/* TODO: Fetch users with ATTORNEY role when users.list endpoint is available */}
                      <input
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '13px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          boxSizing: 'border-box',
                        }}
                        value={convertAttorney}
                        onChange={(e) => setConvertAttorney(e.target.value)}
                        placeholder="Attorney name or ID"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          ...btnPrimaryStyle,
                          flex: 1,
                          opacity: !convertMatterType || !convertAttorney ? 0.5 : 1,
                        }}
                        disabled={
                          !convertMatterType ||
                          !convertAttorney ||
                          convertMutation.isPending
                        }
                        onClick={() => {
                          // TODO: Map convertMatterType to actual matterType UUID from database
                          // For now, use the string value as placeholder
                          convertMutation.mutate({
                            leadId,
                            matterTypeId: convertMatterType,
                            assignedAttorneyId: convertAttorney,
                          });
                        }}
                      >
                        {convertMutation.isPending ? 'Converting...' : 'Convert'}
                      </button>
                      <button
                        style={{ ...btnStyle, flex: 1 }}
                        onClick={() => setShowConvertForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                    {convertMutation.isError && (
                      <p
                        style={{
                          color: '#dc2626',
                          fontSize: '12px',
                          marginTop: '8px',
                        }}
                      >
                        {convertMutation.error.message}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {status === 'CONFLICT_CHECK' && (
              <>
                {!showEscalate ? (
                  <button
                    style={btnDangerStyle}
                    onClick={() => setShowEscalate(true)}
                  >
                    Escalate to Attorney
                  </button>
                ) : (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '6px',
                      marginBottom: '8px',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#64748b',
                        marginBottom: '4px',
                      }}
                    >
                      Escalation Notes
                    </label>
                    <textarea
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        minHeight: '60px',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                      value={escalateNote}
                      onChange={(e) => setEscalateNote(e.target.value)}
                      placeholder="Describe the conflict and recommended action..."
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        style={{ ...btnDangerStyle, flex: 1 }}
                        onClick={() => {
                          updateStatus.mutate({
                            id: leadId,
                            status: 'CONFLICT_CHECK',
                            note: `ESCALATED TO ATTORNEY: ${escalateNote}`,
                          });
                          setShowEscalate(false);
                          setEscalateNote('');
                        }}
                        disabled={updateStatus.isPending}
                      >
                        Escalate
                      </button>
                      <button
                        style={{ ...btnStyle, flex: 1 }}
                        onClick={() => {
                          setShowEscalate(false);
                          setEscalateNote('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {status === 'DECLINED' && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#64748b',
                  textAlign: 'center',
                }}
              >
                This lead was rejected.
              </div>
            )}

            {status === 'RETAINED' && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#16a34a',
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                Converted to matter
              </div>
            )}

            {/* Reject button for non-terminal statuses */}
            {status !== 'RETAINED' && status !== 'DECLINED' && status !== 'CLOSED' && (
              <button
                style={{
                  ...btnStyle,
                  color: '#dc2626',
                  borderColor: '#fecaca',
                  marginTop: '4px',
                }}
                onClick={() =>
                  updateStatus.mutate({ id: leadId, status: 'DECLINED' })
                }
                disabled={updateStatus.isPending}
              >
                Reject Lead
              </button>
            )}
          </div>

          {/* Timeline / Audit Trail */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Timeline</h3>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#1565C0',
                    marginTop: '5px',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#334155' }}>Lead Created</div>
                  <div>
                    {new Date(lead.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {latestConflict && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: hasConflict ? '#dc2626' : '#16a34a',
                      marginTop: '5px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: '#334155' }}>
                      Conflict Check: {hasConflict ? 'Conflicts Found' : 'Clear'}
                    </div>
                    {latestConflict.performedAt && (
                      <div>
                        {new Date(latestConflict.performedAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lead.updatedAt !== lead.createdAt && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#94a3b8',
                      marginTop: '5px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: '#334155' }}>Last Updated</div>
                    <div>
                      {new Date(lead.updatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
