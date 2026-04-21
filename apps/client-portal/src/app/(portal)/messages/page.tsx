'use client';

import React from 'react';
import { Card } from '@ttaylor/ui';
import { MessageSquare, Phone } from 'lucide-react';

/**
 * Messages page for the client portal.
 *
 * Portal messaging requires a dedicated backend endpoint that does not exist yet.
 * Rather than showing a misleading empty DataTable, we display an honest
 * informational message explaining the feature status and directing clients
 * to contact their attorney directly.
 */

export default function MessagesPage() {
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
        Messages
      </h1>

      <Card>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#EDE7F6',
            }}
          >
            <MessageSquare size={28} style={{ color: '#7c3aed' }} />
          </div>

          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '0 0 8px 0',
              }}
            >
              Secure Messaging Coming Soon
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '0 0 20px 0',
                maxWidth: '420px',
                lineHeight: '1.6',
              }}
            >
              We are working on a secure messaging feature so you can communicate
              directly with your legal team through this portal. In the meantime,
              please reach out using the contact information below.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <Phone size={16} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '14px', color: '#334155' }}>
              For urgent matters, please contact your attorney directly by phone.
            </span>
          </div>
        </div>
      </Card>
    </>
  );
}
