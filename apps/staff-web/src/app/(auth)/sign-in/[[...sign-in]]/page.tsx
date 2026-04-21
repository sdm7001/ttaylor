import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
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
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: '32px',
          }}
        >
          Ttaylor Family Law
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: '#64748b',
            lineHeight: '20px',
          }}
        >
          Legal Operations Platform
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: { width: '100%', maxWidth: '400px' },
            card: {
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            },
          },
        }}
      />
    </div>
  );
}
