'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, StatusPill, Badge, LoadingSpinner, EmptyState } from '@ttaylor/ui';
import { Search as SearchIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  // Global keyboard shortcut: Cmd+K / Ctrl+K focuses the search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: results, isLoading, error } = trpc.search.global.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 },
  );

  return (
    <>
      <PageHeader title="Search" />

      {/* Search input */}
      <div style={{ position: 'relative', maxWidth: '640px', marginBottom: '24px' }}>
        <SearchIcon
          size={18}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none',
          }}
        />
        <input
          id="global-search-input"
          type="text"
          placeholder="Search matters, contacts, documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            fontSize: '15px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            outline: 'none',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#1565C0';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21, 101, 192, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#94a3b8',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            padding: '2px 6px',
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '\u2318K' : 'Ctrl+K'}
        </span>
      </div>

      {/* States */}
      {debouncedQuery.length < 2 && (
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Type at least 2 characters to search
        </p>
      )}

      {isLoading && debouncedQuery.length >= 2 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <LoadingSpinner size="md" />
        </div>
      )}

      {error && (
        <p style={{ fontSize: '14px', color: '#dc2626' }}>
          Search failed: {error.message}
        </p>
      )}

      {results && results.total === 0 && (
        <EmptyState
          heading={`No results for '${debouncedQuery}'`}
          body="Try a different search term or check your spelling."
        />
      )}

      {results && results.total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Matters */}
          {results.matters.length > 0 && (
            <section>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1565C0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Matters ({results.matters.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.matters.map((matter) => (
                  <Card key={matter.id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/matters/${matter.id}`)}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                          {matter.causeNumber || 'No cause number'}
                        </div>
                        {matter.title && (
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                            {matter.title}
                          </div>
                        )}
                      </div>
                      <StatusPill status={matter.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Contacts */}
          {results.contacts.length > 0 && (
            <section>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1565C0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Contacts ({results.contacts.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.contacts.map((contact) => (
                  <Card key={contact.id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                          {contact.firstName} {contact.lastName}
                        </div>
                        {contact.email && (
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Documents */}
          {results.documents.length > 0 && (
            <section>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1565C0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Documents ({results.documents.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.documents.map((doc) => (
                  <Card key={doc.id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/matters/${doc.matterId}`)}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                          {doc.title}
                        </div>
                        {doc.matter && (
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                            in matter: {doc.matter.title}
                          </div>
                        )}
                      </div>
                      <StatusPill status={doc.lifecycleStatus} />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
