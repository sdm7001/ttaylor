import React from 'react';
import { SignIn } from '@clerk/nextjs';

/**
 * Client portal sign-in page.
 *
 * Clean, professional, and welcoming design -- differentiated from
 * the staff-web sign-in by using a lighter color palette and
 * client-facing language.
 */
export default function ClientSignInPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        padding: '24px',
      }}
    >
      {/* Firm branding */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Ttaylor Family Law
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: '#64748b',
            margin: '8px 0 0 0',
            fontWeight: 500,
          }}
        >
          Secure Client Portal
        </p>
      </div>

      {/* Clerk sign-in widget */}
      <SignIn
        appearance={{
          elements: {
            rootBox: {
              width: '100%',
              maxWidth: '400px',
            },
            card: {
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            },
          },
        }}
      />

      {/* Footer */}
      <p
        style={{
          fontSize: '12px',
          color: '#94a3b8',
          marginTop: '24px',
          textAlign: 'center',
        }}
      >
        Protected by 256-bit encryption. Your information is secure.
      </p>
    </div>
  );
}
