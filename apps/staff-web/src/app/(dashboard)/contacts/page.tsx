'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, DataTable } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { Plus, Search } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Types (matches the tRPC contacts.list response shape)
// ---------------------------------------------------------------------------

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  contactType: string;
  _count: { matterParties: number };
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: DataTableColumn<ContactRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (row) => (
      <span style={{ fontWeight: 500, color: '#0f172a' }}>
        {row.lastName}, {row.firstName}
      </span>
    ),
  },
  {
    key: 'contactType',
    header: 'Type',
    render: (row) => (
      <span style={{ fontSize: '13px', color: '#475569' }}>
        {row.contactType.replace(/_/g, ' ')}
      </span>
    ),
    width: '140px',
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => (
      <span style={{ fontSize: '13px', color: '#475569' }}>
        {row.email ?? '--'}
      </span>
    ),
  },
  {
    key: 'phone',
    header: 'Phone',
    render: (row) => (
      <span
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '13px',
        }}
      >
        {row.phone ?? '--'}
      </span>
    ),
    width: '140px',
  },
  {
    key: 'matterCount',
    header: 'Active Matters',
    render: (row) => (
      <span style={{ fontSize: '13px', color: '#475569' }}>
        {row._count.matterParties}
      </span>
    ),
    width: '120px',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = trpc.contacts.list.useQuery({
    search: searchTerm || undefined,
    limit: 50,
  });

  const contacts: ContactRow[] = (data?.items as ContactRow[]) ?? [];

  return (
    <>
      <PageHeader
        title="Contacts"
        actions={
          <Button variant="primary" onClick={() => router.push('/contacts/new')}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            New Contact
          </Button>
        }
      />

      {/* Search input */}
      <div
        style={{
          position: 'relative',
          marginBottom: '16px',
          maxWidth: '400px',
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search contacts by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            height: '36px',
            paddingLeft: '36px',
            paddingRight: '12px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            outline: 'none',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <DataTable<ContactRow>
        columns={columns}
        data={contacts}
        loading={isLoading}
        emptyMessage="No contacts found"
        onRowClick={(contact) => {
          router.push(`/contacts/${contact.id}`);
        }}
        rowKey={(row) => row.id}
      />
    </>
  );
}
