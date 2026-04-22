'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Users,
  FileText,
  Send,
  CalendarDays,
  Search,
  Scale,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Intake', href: '/intake', icon: ClipboardList },
  { label: 'Matters', href: '/matters', icon: Briefcase },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Filing', href: '/filing', icon: Send },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Discovery', href: '/discovery', icon: Search },
  { label: 'Orders', href: '/orders', icon: Scale },
  { label: 'Financial', href: '/financial', icon: DollarSign },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Risk View', href: '/risk', icon: AlertTriangle },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Audit Log', href: '/audit', icon: ShieldCheck },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showSidebar, setShowSidebar] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setShowSidebar(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSidebar]);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <>
      {/* Firm name */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.01em',
          }}
        >
          Ttaylor Family Law
        </span>
        {/* Close button - mobile only */}
        <button
          className="mobile-only"
          onClick={() => setShowSidebar(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#CBD5E1',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowSidebar(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                height: '40px',
                padding: '0 12px',
                margin: '0 8px',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 500,
                color: active ? '#ffffff' : '#CBD5E1',
                backgroundColor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderLeft: active ? '3px solid #1565C0' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'background-color 100ms ease, color 100ms ease',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#CBD5E1';
                }
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User button at bottom */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: { width: '32px', height: '32px' },
            },
          }}
        />
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .staff-sidebar-desktop { display: none !important; }
          .staff-main { margin-left: 0 !important; padding: 16px !important; padding-top: 72px !important; }
        }
        @media (min-width: 769px) {
          .staff-mobile-topbar { display: none !important; }
          .staff-sidebar-mobile { display: none !important; }
          .staff-sidebar-backdrop { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Mobile top bar */}
        <div
          className="staff-mobile-topbar"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 50,
          }}
        >
          <button
            onClick={() => setShowSidebar(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={24} />
          </button>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}
          >
            Ttaylor Family Law
          </span>
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: { width: '28px', height: '28px' },
              },
            }}
          />
        </div>

        {/* Mobile sidebar backdrop */}
        {showSidebar && (
          <div
            className="staff-sidebar-backdrop"
            onClick={() => setShowSidebar(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 59,
            }}
          />
        )}

        {/* Mobile sidebar overlay */}
        <aside
          className="staff-sidebar-mobile"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 60,
            transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 200ms ease',
          }}
        >
          {sidebarContent}
        </aside>

        {/* Desktop sidebar */}
        <aside
          className="staff-sidebar-desktop"
          style={{
            width: '224px',
            flexShrink: 0,
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 40,
          }}
        >
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main
          className="staff-main"
          style={{
            flex: 1,
            marginLeft: '224px',
            padding: '24px 32px',
            maxWidth: '1440px',
            minHeight: '100vh',
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
