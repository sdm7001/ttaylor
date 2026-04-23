'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { DataTable, StatusPill, LoadingSpinner } from '@ttaylor/ui';
import type { DataTableColumn } from '@ttaylor/ui';
import { Pencil, Eye, Trash2, Search } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { TemplateSummary } from './TemplateManager';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'DIVORCE', label: 'Divorce' },
  { value: 'CHILD_CUSTODY', label: 'Child Custody' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'GENERAL', label: 'General' },
] as const;

type CategoryValue = '' | 'DIVORCE' | 'CHILD_CUSTODY' | 'PROPERTY' | 'SUPPORT' | 'GENERAL';

interface TemplateListProps {
  onEdit: (template: TemplateSummary) => void;
  onPreview: (template: TemplateSummary) => void;
}

export function TemplateList({ onEdit, onPreview }: TemplateListProps) {
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? '';
  const canDelete = role === 'ATTORNEY' || role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryValue>('');

  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.templates.list.useQuery({
    search: search.trim() || undefined,
    category: category || undefined,
  });

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
    },
  });

  function handleDelete(template: TemplateSummary) {
    const confirmed = window.confirm(
      `Deactivate template "${template.name}"? It will be hidden from the document generator.`,
    );
    if (!confirmed) return;
    deleteMutation.mutate({ id: template.id });
  }

  const columns: DataTableColumn<TemplateSummary>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.name}</span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (row) => (
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '12px',
            color: '#475569',
          }}
        >
          {row.code}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#475569' }}>
          {row.category.replace(/_/g, ' ')}
        </span>
      ),
      width: '140px',
    },
    {
      key: 'templateEngine',
      header: 'Engine',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#475569' }}>{row.templateEngine}</span>
      ),
      width: '110px',
    },
    {
      key: 'version',
      header: 'Version',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#475569' }}>v{row.version}</span>
      ),
      width: '80px',
    },
    {
      key: 'activeFlag',
      header: 'Status',
      render: (row) => (
        <StatusPill
          status={row.activeFlag ? 'active' : 'inactive'}
          label={row.activeFlag ? 'Active' : 'Inactive'}
        />
      ),
      width: '110px',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => (
        <span style={{ fontSize: '13px', color: '#475569' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
      width: '120px',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(row);
            }}
            title="Preview"
            style={iconButtonStyle}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
            title="Edit"
            style={iconButtonStyle}
          >
            <Pencil size={15} />
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              title="Deactivate"
              disabled={deleteMutation.isPending}
              style={{
                ...iconButtonStyle,
                color: '#dc2626',
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
      width: '140px',
    },
  ];

  const templates = (data?.items ?? []) as TemplateSummary[];

  return (
    <>
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '420px' }}>
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
            placeholder="Search templates by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryValue)}
          style={{
            height: '36px',
            padding: '0 12px',
            fontSize: '14px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            minWidth: '180px',
          }}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '12px',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            fontSize: '13px',
            color: '#dc2626',
          }}
        >
          Failed to load templates: {error.message}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <DataTable<TemplateSummary>
          columns={columns}
          data={templates}
          loading={false}
          emptyMessage="No templates found. Create your first template to get started."
          rowKey={(row) => row.id}
        />
      )}
    </>
  );
}

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #e2e8f0',
  borderRadius: '5px',
  padding: '5px',
  cursor: 'pointer',
  color: '#475569',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};
