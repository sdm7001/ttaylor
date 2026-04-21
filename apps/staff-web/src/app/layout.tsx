import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { TrpcProvider } from '../lib/trpc-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Ttaylor Family Law - Legal Operations Platform',
  description: 'Internal staff platform for Ttaylor Family Law',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body
          style={{
            margin: 0,
            padding: 0,
            fontFamily:
              "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: '14px',
            lineHeight: '20px',
            color: '#0f172a',
            backgroundColor: '#f8fafc',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          <TrpcProvider>
            {children}
          </TrpcProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
