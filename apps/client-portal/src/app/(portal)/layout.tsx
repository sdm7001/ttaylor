'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

/**
 * Portal layout for authenticated client pages.
 *
 * Simple top navigation bar with firm logo on the left and user
 * button on the right. Full-width content area below with a clean
 * slate-50 background. No sidebar -- clients need simplicity.
 */

const navLinks = [
  { label: 'My Matters', href: '/' },
  { label: 'Messages', href: '/messages' },
] as const;

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Top navigation bar */}
      <header
        style={{
          height: '56px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: firm name + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link
            href="/"
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Ttaylor Family Law
          </Link>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: isActive(link.href) ? 600 : 500,
                  color: isActive(link.href) ? '#1565C0' : '#64748b',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  backgroundColor: isActive(link.href) ? '#E3F2FD' : 'transparent',
                  transition: 'background-color 100ms ease',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: user button */}
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: { width: '32px', height: '32px' },
            },
          }}
        />
      </header>

      {/* Content area */}
      <main
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
