'use client';

import React from 'react';
import Link from 'next/link';
import { Card, StatusPill, EmptyState, LoadingSpinner } from '@ttaylor/ui';
import { Briefcase } from 'lucide-react';
import { trpc } from '../../lib/trpc';

/**
 * Client portal home page -- "Your Matters".
 *
 * Fetches the authenticated client's matters via tRPC and displays them
 * as clickable cards. Each card links to /matters/[id] for detail.
 *
 * TODO: In production, the tRPC context should scope this query to only
 * the matters belonging to the authenticated client via their portal_access
 * record. Currently queries the matters endpoint directly (which relies on
 * server-side permission checks to limit visibility).
 */

export default function PortalHomePage() {
  const { data, isLoading, error } = trpc.matters.list.useQuery({ limit: 20 });

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
        Your Matters
      </h1>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<Briefcase size={40} />}
          heading="Unable to load matters"
          body="There was an error loading your matters. Please try refreshing the page."
        />
      ) : !data?.items || data.items.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={40} />}
          heading="No matters yet"
          body="When your legal team opens a matter for your case, it will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.items.map((matter) => {
            const attorney = matter.assignments?.find(
              (a: { role?: string }) => a.role === 'ATTORNEY'
            );
            const matterTypeName = matter.matterType?.name ?? matter.matterTypeId?.slice(0, 8) ?? 'Matter';

            return (
              <Link
                key={matter.id}
                href={`/matters/${matter.id}`}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        {matterTypeName}
                      </span>
                      {matter.causeNumber && (
                        <span
                          style={{
                            fontSize: '13px',
                            color: '#64748b',
                            fontFamily:
                              "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                          }}
                        >
                          {matter.causeNumber}
                        </span>
                      )}
                      {attorney?.user && (
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          Attorney: {attorney.user.firstName} {attorney.user.lastName}
                        </span>
                      )}
                    </div>

                    <StatusPill status={matter.status} />
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
