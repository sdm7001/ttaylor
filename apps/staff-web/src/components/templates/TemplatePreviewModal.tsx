'use client';

import React from 'react';
import { Button } from '@ttaylor/ui';
import { X, FileText } from 'lucide-react';
import type { TemplateSummary } from './TemplateManager';

interface TemplatePreviewModalProps {
  template: TemplateSummary;
  onClose: () => void;
}

export function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
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
          width: '760px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 51,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} style={{ color: '#1565C0' }} />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {template.name}
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '12px',
                  color: '#64748b',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                }}
              >
                {template.code}
              </p>
            </div>
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

        {/* Metadata */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            fontSize: '12px',
          }}
        >
          <Meta label="Category" value={template.category.replace(/_/g, ' ')} />
          <Meta label="Engine" value={template.templateEngine} />
          <Meta label="Version" value={`v${template.version}`} />
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {template.content ? (
            <pre
              style={{
                margin: 0,
                padding: '16px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: '13px',
                lineHeight: 1.6,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {template.content}
            </pre>
          ) : (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px',
                border: '1px dashed #e2e8f0',
                borderRadius: '8px',
              }}
            >
              This template has no content yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '2px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
