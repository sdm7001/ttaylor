'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@ttaylor/ui';
import { X, Upload, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { TemplateSummary } from './TemplateManager';

const CATEGORY_OPTIONS = [
  { value: 'DIVORCE', label: 'Divorce' },
  { value: 'CHILD_CUSTODY', label: 'Child Custody' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'GENERAL', label: 'General' },
] as const;

type CategoryValue = (typeof CATEGORY_OPTIONS)[number]['value'];

const ENGINE_OPTIONS = [
  { value: 'handlebars', label: 'Handlebars' },
  { value: 'plaintext', label: 'Plain Text' },
] as const;

type EngineValue = (typeof ENGINE_OPTIONS)[number]['value'];

interface TemplateModalProps {
  mode: 'create' | 'edit';
  template: TemplateSummary | null;
  onClose: () => void;
}

export function TemplateModal({ mode, template, onClose }: TemplateModalProps) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(template?.name ?? '');
  const [code, setCode] = useState(template?.code ?? '');
  const [category, setCategory] = useState<CategoryValue>(
    (template?.category as CategoryValue) ?? 'GENERAL',
  );
  const [templateEngine, setTemplateEngine] = useState<EngineValue>(
    (template?.templateEngine as EngineValue) ?? 'handlebars',
  );
  const [content, setContent] = useState(template?.content ?? '');
  const [fileError, setFileError] = useState<string | null>(null);

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      onClose();
    },
  });
  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      onClose();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error ?? updateMutation.error;

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.txt', '.docx'];
    const name = file.name.toLowerCase();
    const hasAllowed = allowedExtensions.some((ext) => name.endsWith(ext));
    if (!hasAllowed) {
      setFileError('Only .txt and .docx files are supported');
      return;
    }

    if (name.endsWith('.txt')) {
      const text = await file.text();
      setContent(text);
    } else {
      // .docx: read as text. Proper DOCX parsing would require a library;
      // we surface the raw extracted text the browser can decode. Users
      // are expected to clean up formatting after upload.
      try {
        const text = await file.text();
        setContent(text);
      } catch {
        setFileError('Unable to read file contents');
      }
    }

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (mode === 'create') {
      createMutation.mutate({
        name: name.trim(),
        code: code.trim(),
        category,
        templateEngine,
        content: content || undefined,
      });
    } else if (template) {
      updateMutation.mutate({
        id: template.id,
        name: name.trim(),
        code: code.trim(),
        category,
        content: content,
      });
    }
  }

  const canSubmit = name.trim().length > 0 && code.trim().length > 0 && !isPending;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50,
        }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '720px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 51,
          padding: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} style={{ color: '#1565C0' }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
              {mode === 'create' ? 'New Template' : 'Edit Template'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#64748b',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Name" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Code" required>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{
                  ...inputStyle,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
              />
            </Field>

            <Field label="Category" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryValue)}
                style={inputStyle}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Template Engine" required>
              <select
                value={templateEngine}
                onChange={(e) => setTemplateEngine(e.target.value as EngineValue)}
                disabled={mode === 'edit'}
                style={inputStyle}
              >
                {ENGINE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Content */}
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Content
              </label>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '5px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={13} />
                  Upload .txt / .docx
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder="Enter template content, or upload a file above."
              style={{
                ...inputStyle,
                minHeight: '280px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '13px',
                lineHeight: 1.55,
                resize: 'vertical',
              }}
            />

            {fileError && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626' }}>
                {fileError}
              </p>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: '12px',
                marginTop: '16px',
                borderRadius: '6px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                fontSize: '13px',
                color: '#dc2626',
              }}
            >
              {error.message}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              paddingTop: '16px',
              marginTop: '20px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <Button variant="ghost" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!canSubmit}>
              {isPending
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                ? 'Create Template'
                : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151',
          marginBottom: '6px',
        }}
      >
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  boxSizing: 'border-box',
  outline: 'none',
};
