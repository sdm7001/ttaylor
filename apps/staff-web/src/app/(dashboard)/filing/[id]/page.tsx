'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, Button, StatusPill, Card, EmptyState, Badge, LoadingSpinner } from '@ttaylor/ui';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  ArrowRight,
  FileText,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Filing packet detail page.
 *
 * Two-panel layout:
 * - Left: packet items (lead document badge + attachment list)
 * - Right: packet info (court, cause number, filing type)
 *
 * Includes validation status section, attorney approval section,
 * and contextual action buttons wired to real tRPC mutations.
 */

function ValidationSection({ validation }: { validation: { valid: boolean; issues: string[] } }) {
  return (
    <Card>
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#0f172a',
          margin: '0 0 12px 0',
        }}
      >
        Filing Validation
      </h3>

      {validation.valid ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: '#E8F5E9',
            borderRadius: '6px',
          }}
        >
          <CheckCircle size={16} style={{ color: '#2E7D32' }} />
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#2E7D32' }}>
            All validation checks passed
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Standard checks -- shown as green when not in issues list */}
          {[
            'Filing packet must contain at least one document',
            'Filing packet must have exactly one lead document',
            'Filing packet must have a cause number',
            'Filing packet must have a court name',
          ].map((check) => {
            const failing = validation.issues.some((issue) =>
              issue.toLowerCase().includes(check.toLowerCase().slice(0, 20)),
            );
            return (
              <div
                key={check}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  backgroundColor: failing ? '#FFF3E0' : '#E8F5E9',
                }}
              >
                {failing ? (
                  <AlertTriangle size={14} style={{ color: '#E65100' }} />
                ) : (
                  <CheckCircle size={14} style={{ color: '#2E7D32' }} />
                )}
                <span
                  style={{
                    fontSize: '12px',
                    color: failing ? '#BF360C' : '#2E7D32',
                    fontWeight: 500,
                  }}
                >
                  {check}
                </span>
              </div>
            );
          })}

          {/* Any additional issues not covered by standard checks */}
          {validation.issues
            .filter(
              (issue) =>
                !issue.startsWith('Filing packet must have') &&
                !issue.startsWith('Filing packet must contain'),
            )
            .map((issue) => (
              <div
                key={issue}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  backgroundColor: '#FFEBEE',
                }}
              >
                <XCircle size={14} style={{ color: '#C62828' }} />
                <span style={{ fontSize: '12px', color: '#B71C1C', fontWeight: 500 }}>
                  {issue}
                </span>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

export default function FilingPacketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const packetId = params.id;

  const utils = trpc.useUtils();

  // Queries
  const {
    data: packet,
    isLoading: packetLoading,
    error: packetError,
  } = trpc.filing.getPacket.useQuery({ id: packetId });

  const { data: validation } = trpc.filing.validatePacket.useQuery(
    { id: packetId },
    { enabled: !!packet }, // only validate once packet is loaded
  );

  // Mutations
  const submitForReview = trpc.filing.submitForAttorneyReview.useMutation({
    onSuccess: () => {
      utils.filing.getPacket.invalidate({ id: packetId });
      utils.filing.validatePacket.invalidate({ id: packetId });
    },
  });

  const attorneyApprove = trpc.filing.attorneyApprove.useMutation({
    onSuccess: () => {
      utils.filing.getPacket.invalidate({ id: packetId });
      utils.filing.validatePacket.invalidate({ id: packetId });
    },
  });

  const attorneyReject = trpc.filing.attorneyReject.useMutation({
    onSuccess: () => {
      utils.filing.getPacket.invalidate({ id: packetId });
      utils.filing.validatePacket.invalidate({ id: packetId });
    },
  });

  const submitToCourt = trpc.filing.submitToCourt.useMutation({
    onSuccess: () => {
      utils.filing.getPacket.invalidate({ id: packetId });
      utils.filing.validatePacket.invalidate({ id: packetId });
    },
  });

  // Loading state
  if (packetLoading) {
    return (
      <>
        <PageHeader title="Filing Packet" />
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
      </>
    );
  }

  // Not found / error state
  if (packetError || !packet) {
    return (
      <>
        <PageHeader title="Filing Packet" />
        <EmptyState
          icon={<Send size={40} />}
          heading="Packet not found"
          body={packetError?.message ?? `Filing packet ${packetId} could not be loaded.`}
          actionLabel="Back to Filing Queue"
          onAction={() => router.push('/filing')}
        />
      </>
    );
  }

  // TODO: Detect user role from Clerk (useUser -> publicMetadata.role).
  // For now, render all buttons -- the server enforces role requirements.
  const canSubmitForReview =
    packet.status === 'ASSEMBLING' || packet.status === 'ATTORNEY_REJECTED';
  const canApprove = packet.status === 'READY_FOR_ATTORNEY_REVIEW';
  const canReject = packet.status === 'READY_FOR_ATTORNEY_REVIEW';
  const canSubmitToCourt = packet.status === 'ATTORNEY_APPROVED';

  return (
    <>
      <PageHeader
        title={packet.title}
        subtitle={`Packet for matter`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusPill status={packet.status} />
            <Button variant="ghost" size="sm" onClick={() => router.push('/filing')}>
              <ArrowLeft size={16} style={{ marginRight: '4px' }} />
              Back to Filing
            </Button>
          </div>
        }
      />

      {/* Two-panel layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Left panel: packet items */}
        <div>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              margin: '0 0 12px 0',
            }}
          >
            Documents in Packet
          </h3>

          {packet.items.length === 0 ? (
            <EmptyState
              icon={<FileText size={32} />}
              heading="No documents"
              body="Add attorney-approved documents to this filing packet."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...packet.items]
                .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((item: any) => (
                  <Card key={item.id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <FileText size={16} style={{ color: '#64748b' }} />
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#1e293b',
                          }}
                        >
                          {item.document?.title ?? 'Untitled Document'}
                        </span>
                        {item.isLeadDocument && (
                          <Badge>
                            <Star size={10} style={{ marginRight: '3px' }} />
                            Lead Document
                          </Badge>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.filingCode && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#94a3b8',
                              fontFamily:
                                "'JetBrains Mono', 'Fira Code', monospace",
                            }}
                          >
                            {item.filingCode}
                          </span>
                        )}
                        <StatusPill status={item.document?.lifecycleStatus ?? 'UNKNOWN'} />
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Right panel: packet info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '0 0 12px 0',
              }}
            >
              Packet Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <InfoRow label="Filing Type" value={packet.filingType} />
              <InfoRow label="Court" value={packet.courtName} />
              <InfoRow label="Cause Number" value={packet.causeNumber ?? '--'} mono />
              <InfoRow
                label="Prepared By"
                value={
                  packet.preparedBy
                    ? `${packet.preparedBy.firstName} ${packet.preparedBy.lastName}`
                    : '--'
                }
              />
              <InfoRow
                label="Created"
                value={new Date(packet.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              />
            </div>
          </Card>

          {/* Attorney approval section */}
          <Card>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '0 0 12px 0',
              }}
            >
              Attorney Approval
            </h3>

            {packet.status === 'ATTORNEY_APPROVED' && packet.approvedBy ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: '#E8F5E9',
                  borderRadius: '6px',
                }}
              >
                <CheckCircle size={16} style={{ color: '#2E7D32' }} />
                <div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#2E7D32',
                      display: 'block',
                    }}
                  >
                    Approved by {packet.approvedBy.firstName}{' '}
                    {packet.approvedBy.lastName}
                  </span>
                  {packet.approvedAt && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#4CAF50',
                      }}
                    >
                      {new Date(packet.approvedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ) : packet.status === 'ATTORNEY_REJECTED' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: '#FFEBEE',
                  borderRadius: '6px',
                }}
              >
                <XCircle size={16} style={{ color: '#C62828' }} />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#B71C1C',
                  }}
                >
                  Rejected -- revisions needed
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Pending attorney review
              </span>
            )}
          </Card>
        </div>
      </div>

      {/* Validation section */}
      {validation && (
        <div style={{ marginBottom: '20px' }}>
          <ValidationSection validation={validation} />
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          padding: '16px 0',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        {canSubmitForReview && (
          <Button
            variant="primary"
            onClick={() => {
              submitForReview.mutate({ id: packetId });
            }}
          >
            <ArrowRight size={16} style={{ marginRight: '6px' }} />
            Submit for Attorney Review
          </Button>
        )}

        {canApprove && (
          <Button
            variant="primary"
            onClick={() => {
              attorneyApprove.mutate({ id: packetId });
            }}
          >
            <CheckCircle size={16} style={{ marginRight: '6px' }} />
            Approve Filing
          </Button>
        )}

        {canReject && (
          <Button
            variant="destructive"
            onClick={() => {
              const reason = window.prompt('Reason for rejection:');
              if (reason) {
                attorneyReject.mutate({ id: packetId, reason });
              }
            }}
          >
            <XCircle size={16} style={{ marginRight: '6px' }} />
            Reject Filing
          </Button>
        )}

        {canSubmitToCourt && (
          <Button
            variant="primary"
            onClick={() => {
              submitToCourt.mutate({ id: packetId });
            }}
          >
            <Send size={16} style={{ marginRight: '6px' }} />
            Submit to Court
          </Button>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helper component for info rows
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <p
        style={{
          margin: '2px 0 0 0',
          fontSize: '14px',
          color: '#1e293b',
          fontWeight: 500,
          ...(mono
            ? {
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              }
            : {}),
        }}
      >
        {value}
      </p>
    </div>
  );
}
