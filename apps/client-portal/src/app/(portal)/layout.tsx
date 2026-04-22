'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';

/**
 * Portal layout for authenticated client pages.
 *
 * Simple top navigation bar with firm logo on the left and user
 * button on the right. Full-width content area below with a clean
 * slate-50 background. On mobile, nav links collapse into a hamburger
 * menu that slides down as an overlay.
 */

const navLinks = [
  { label: 'My Matters', href: '/' },
  { label: 'Messages', href: '/messages' },
  { label: 'Intake', href: '/intake' },
] as const;

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showNav, setShowNav] = useState(false);

  // Close nav on route change
  useEffect(() => {
    setShowNav(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .portal-desktop-nav { display: none !important; }
          .portal-mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .portal-mobile-menu-btn { display: none !important; }
          .portal-mobile-nav { display: none !important; }
          .portal-nav-backdrop { display: none !important; }
        }
      `}</style>

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
            padding: '0 16px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          {/* Left: hamburger (mobile) + firm name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="portal-mobile-menu-btn"
              onClick={() => setShowNav(!showNav)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0f172a',
                cursor: 'pointer',
                padding: '4px',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showNav ? <X size={22} /> : <Menu size={22} />}
            </button>

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

            {/* Desktop nav */}
            <nav className="portal-desktop-nav" style={{ display: 'flex', gap: '4px', marginLeft: '20px' }}>
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

        {/* Mobile nav dropdown */}
        {showNav && (
          <>
            <div
              className="portal-nav-backdrop"
              onClick={() => setShowNav(false)}
              style={{
                position: 'fixed',
                top: '56px',
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: 38,
              }}
            />
            <nav
              className="portal-mobile-nav"
              style={{
                position: 'fixed',
                top: '56px',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '8px 0',
                zIndex: 39,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowNav(false)}
                  style={{
                    display: 'block',
                    padding: '12px 20px',
                    fontSize: '15px',
                    fontWeight: isActive(link.href) ? 600 : 500,
                    color: isActive(link.href) ? '#1565C0' : '#334155',
                    textDecoration: 'none',
                    backgroundColor: isActive(link.href) ? '#E3F2FD' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </>
        )}

        {/* Content area */}
        <main
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '24px 16px',
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
