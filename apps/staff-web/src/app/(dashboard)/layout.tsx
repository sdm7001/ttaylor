'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Send,
  CalendarDays,
  Search,
  DollarSign,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Matters', href: '/matters', icon: Briefcase },
  { label: 'Contacts', href: '/contacts', icon: Users },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Filing', href: '/filing', icon: Send },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Discovery', href: '/discovery', icon: Search },
  { label: 'Financial', href: '/financial', icon: DollarSign },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
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
        {/* Firm name */}
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
      </aside>

      {/* Main content */}
      <main
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
  );
}
