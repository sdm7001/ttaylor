'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader, Button, StatusPill, EmptyState, Card } from '@ttaylor/ui';
import { FilingPacketStatus } from '@ttaylor/domain';
import { Send, Plus, Eye, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

/**
 * Filing queue page.
 *
 * Displays all filing packets across matters with status filter tabs,
 * a data table, and quick-action buttons per row based on packet status.
 */

type StatusFilter = 'ALL' | 'ASSEMBLING' | 'READY_FOR_ATTORNEY_REVIEW' | 'ATTORNEY_APPROVED' | 'SUBMITTED_TO_COURT' | 'ATTORNEY_REJECTED';

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Assembling', value: 'ASSEMBLING' },
  { label: 'Pending Attorney Review', value: 'READY_FOR_ATTORNEY_REVIEW' },
  { label: 'Attorney Approved', value: 'ATTORNEY_APPROVED' },
  { label: 'Submitted', value: 'SUBMITTED_TO_COURT' },
  { label: 'Rejected', value: 'ATTORNEY_REJECTED' },
];

// TODO: Replace with actual tRPC API data
interface FilingPacketRow {
  id: string;
  matterTitle: string;
  title: string;
  filingType: string;
  status: string;
  courtName: string;
  causeNumber: string;
  updatedAt: string;
}

const packets: FilingPacketRow[] = [];

function QuickActions({ packet }: { packet: FilingPacketRow }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <Link href={`/filing/${packet.id}`} style={{ textDecoration: 'none' }}>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#475569',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <Eye size={12} />
          View
        </button>
      </Link>

      {packet.status === 'ASSEMBLING' && (
        <button
          onClick={() => {
            // TODO: call filing.submitForAttorneyReview
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#1565C0',
            backgroundColor: '#E3F2FD',
            border: '1px solid #BBDEFB',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <ArrowRight size={12} />
          Submit for Review
        </button>
      )}

      {packet.status === 'READY_FOR_ATTORNEY_REVIEW' && (
        <>
          <button
            onClick={() => {
              // TODO: call filing.attorneyApprove
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#2E7D32',
              backgroundColor: '#E8F5E9',
              border: '1px solid #C8E6C9',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <CheckCircle size={12} />
            Approve
          </button>
          <button
            onClick={() => {
              // TODO: call filing.attorneyReject
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#C62828',
              backgroundColor: '#FFEBEE',
              border: '1px solid #FFCDD2',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <XCircle size={12} />
            Reject
          </button>
        </>
      )}

      {packet.status === 'ATTORNEY_APPROVED' && (
        <button
          onClick={() => {
            // TODO: call filing.submitToCourt
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#ffffff',
            backgroundColor: '#1565C0',
            border: '1px solid #0D47A1',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <Send size={12} />
          Submit to Court
        </button>
      )}
    </div>
  );
}

export default function FilingQueuePage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');

  const filtered = packets.filter((p) => {
    if (activeFilter === 'ALL') return true;
    return p.status === activeFilter;
  });

  return (
    <>
      <PageHeader
        title="Filing Queue"
        actions={
          <Button variant="primary" onClick={() => {/* TODO: open create filing packet dialog */}}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            New Filing Packet
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '16px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0',
          overflowX: 'auto',
        }}
      >
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: activeFilter === f.value ? 600 : 500,
              color: activeFilter === f.value ? '#1565C0' : '#64748b',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeFilter === f.value
                  ? '3px solid #1565C0'
                  : '3px solid transparent',
              cursor: 'pointer',
              transition: 'color 100ms ease, border-color 100ms ease',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Filing packets table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Send size={40} />}
          title="No filing packets"
          description={
            activeFilter === 'ALL'
              ? 'Create a filing packet to start assembling documents for court submission.'
              : `No packets in ${activeFilter.replace(/_/g, ' ').toLowerCase()} status.`
          }
        />
      ) : (
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 0.8fr 140px 1fr 120px 1fr',
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
            <span>Matter</span>
            <span>Packet Title</span>
            <span>Filing Type</span>
            <span>Status</span>
            <span>Court</span>
            <span>Last Updated</span>
            <span>Actions</span>
          </div>

          {/* Table rows */}
          {filtered.map((packet) => (
            <div
              key={packet.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr 0.8fr 140px 1fr 120px 1fr',
                gap: '0',
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '13px',
                color: '#1e293b',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 500 }}>{packet.matterTitle}</span>
              <span>{packet.title}</span>
              <span style={{ color: '#64748b' }}>{packet.filingType}</span>
              <span>
                <StatusPill status={packet.status} />
              </span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{packet.courtName}</span>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                {new Date(packet.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <QuickActions packet={packet} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
