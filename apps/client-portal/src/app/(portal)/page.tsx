'use client';

import React from 'react';
import Link from 'next/link';
import { Card, StatusPill, EmptyState } from '@ttaylor/ui';
import { Briefcase } from 'lucide-react';

/**
 * Client portal home page -- "Your Matters".
 *
 * Displays a list of matter cards showing matter type, status,
 * cause number (if available), and assigned attorney name.
 * Each card links to /matters/[id] for detail.
 */

// TODO: Replace with tRPC API call to fetch client's matters
interface ClientMatter {
  id: string;
  title: string;
  matterType: string;
  status: string;
  causeNumber?: string;
  attorney?: { firstName: string; lastName: string };
}

const matters: ClientMatter[] = [];

export default function PortalHomePage() {
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

      {matters.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={40} />}
          title="No matters yet"
          description="When your legal team opens a matter for your case, it will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {matters.map((matter) => (
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
                      {matter.matterType}
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
                    {matter.attorney && (
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Attorney: {matter.attorney.firstName} {matter.attorney.lastName}
                      </span>
                    )}
                  </div>

                  <StatusPill status={matter.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
