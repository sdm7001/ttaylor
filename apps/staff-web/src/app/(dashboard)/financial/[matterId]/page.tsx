'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader, Card, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { DollarSign, Landmark, CreditCard, ArrowDownCircle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number | string | { toNumber?: () => number } | null | undefined): string {
  if (amount == null) return '--';
  const num = typeof amount === 'object' && amount !== null && 'toNumber' in amount
    ? (amount as { toNumber: () => number }).toNumber()
    : Number(amount);
  if (isNaN(num)) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: `${color}10`,
            color,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#0f172a',
              marginTop: '2px',
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FinancialDetailPage() {
  const params = useParams();
  const matterId = params.matterId as string;
  const [showTrustLedger, setShowTrustLedger] = useState(false);

  const { data: summary, isLoading: summaryLoading } = trpc.financial.getMatterSummary.useQuery(
    { matterId },
    { enabled: !!matterId }
  );

  const { data: trustLedger, isLoading: trustLoading } = trpc.financial.getTrustLedger.useQuery(
    { matterId },
    { enabled: !!matterId && showTrustLedger }
  );

  if (summaryLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!summary) {
    return (
      <>
        <Link
          href="/financial"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            color: '#1565C0',
            textDecoration: 'none',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={14} /> Back to Financial Overview
        </Link>
        <EmptyState
          heading="Financial data not found"
          body="No financial records were found for this matter. It may not exist or you may not have access."
        />
      </>
    );
  }

  return (
    <>
      <Link
        href="/financial"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          color: '#1565C0',
          textDecoration: 'none',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={14} /> Back to Financial Overview
      </Link>

      <PageHeader
        title={`Financial -- Matter ${matterId.slice(0, 8)}...`}
        subtitle={`${summary.entryCount} financial entries`}
      />

      {/* Summary stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={<DollarSign size={20} />}
          label="Total Billed"
          value={formatCurrency(summary.totalBilled)}
          color="#0f172a"
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Total Paid"
          value={formatCurrency(summary.totalPaid)}
          color="#16a34a"
        />
        <StatCard
          icon={<ArrowDownCircle size={20} />}
          label="Outstanding Balance"
          value={formatCurrency(summary.outstandingBalance)}
          color="#dc2626"
        />
        <StatCard
          icon={<Landmark size={20} />}
          label="Trust Balance"
          value={formatCurrency(summary.trustBalance)}
          color="#7c3aed"
        />
      </div>

      {/* Recent payments */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#0f172a',
            margin: '0 0 12px 0',
          }}
        >
          Recent Payments
        </h2>

        {summary.recentPayments.length === 0 ? (
          <Card>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, padding: '12px 0' }}>
              No payments recorded for this matter yet.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {summary.recentPayments.map((payment) => (
              <Card key={payment.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                      {payment.entryType === 'TRUST_DISBURSEMENT'
                        ? 'Trust Disbursement'
                        : 'Payment'}
                    </span>
                    {payment.note && (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {payment.note}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>
                      {formatCurrency(payment.amount)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {formatDate(payment.occurredAt)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Trust ledger */}
      <div>
        <button
          onClick={() => setShowTrustLedger(!showTrustLedger)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1565C0',
            backgroundColor: '#E3F2FD',
            border: '1px solid #BBDEFB',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          {showTrustLedger ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showTrustLedger ? 'Hide Trust Ledger' : 'View Trust Ledger'}
        </button>

        {showTrustLedger && (
          <div>
            {trustLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <LoadingSpinner size="md" />
              </div>
            ) : !trustLedger || trustLedger.entries.length === 0 ? (
              <Card>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0, padding: '12px 0' }}>
                  No trust account activity for this matter.
                </p>
              </Card>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Type</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Amount</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Balance</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trustLedger.entries.map((entry) => {
                      const isDeposit = entry.entryType === 'TRUST_DEPOSIT';
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>
                            {formatDate(entry.occurredAt)}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#334155' }}>
                            {isDeposit ? 'Deposit' : 'Disbursement'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              textAlign: 'right',
                              fontWeight: 500,
                              color: isDeposit ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {isDeposit ? '+' : '-'}{formatCurrency(entry.amount)}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: '#0f172a',
                            }}
                          >
                            {formatCurrency(entry.runningBalance)}
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>
                            {entry.note ?? '--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
