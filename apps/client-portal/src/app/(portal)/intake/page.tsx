'use client';

import React from 'react';
import Link from 'next/link';
import { Card, EmptyState, LoadingSpinner, StatusPill } from '@ttaylor/ui';
import { ClipboardList } from 'lucide-react';
import { trpc } from '../../../lib/trpc';

/**
 * Portal-side intake page.
 *
 * Checks if the client has any matters that may need an intake
 * questionnaire completed. Matters in early statuses (RETAINED,
 * LEAD_PENDING, etc.) are shown with a prompt to complete the
 * questionnaire.
 */

const INTAKE_STATUSES = [
  'LEAD_PENDING',
  'CONFLICT_REVIEW',
  'CONSULTATION_COMPLETED',
  'RETAINED',
];

export default function IntakePage() {
  const { data, isLoading, error } = trpc.matters.list.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 20px 0',
            letterSpacing: '-0.01em',
          }}
        >
          Intake Questionnaires
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  const matters = data?.items ?? [];
  const intakeMatters = matters.filter((m) =>
    INTAKE_STATUSES.includes(m.status),
  );

  return (
    <>
      <h1
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 8px 0',
          letterSpacing: '-0.01em',
        }}
      >
        Intake Questionnaires
      </h1>
      <p
        style={{
          fontSize: '14px',
          color: '#64748b',
          margin: '0 0 20px 0',
          lineHeight: '1.5',
        }}
      >
        Please complete the questionnaire for each of your active matters. This helps
        your legal team prepare your case efficiently.
      </p>

      {error ? (
        <EmptyState
          icon={<ClipboardList size={40} />}
          heading="Unable to load"
          body="There was an error loading your matters. Please try refreshing the page."
        />
      ) : intakeMatters.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} />}
          heading="No questionnaires to complete"
          body="When your legal team needs information from you, a questionnaire will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {intakeMatters.map((matter) => {
            const matterTypeName =
              matter.matterType?.name ?? matter.matterTypeId?.slice(0, 8) ?? 'Matter';

            return (
              <Link
                key={matter.id}
                href={`/intake/${matter.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Card>
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
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        {matterTypeName}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Please complete your intake questionnaire
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusPill status={matter.status} />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#1565C0',
                          backgroundColor: '#E3F2FD',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        Complete Questionnaire
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
