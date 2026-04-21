'use client';

import React, { useState, useMemo } from 'react';
import { Button, LoadingSpinner } from '@ttaylor/ui';
import { X, FileText, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Standard Texas family law templates (shown when DB has no templates)
// ---------------------------------------------------------------------------

const EXPECTED_TEMPLATES = [
  'Original Petition for Divorce',
  'Waiver of Service',
  'Agreed Final Decree of Divorce',
  'SAPCR Petition (Suit Affecting Parent-Child Relationship)',
  'Temporary Restraining Order',
  'Temporary Orders',
  'Motion to Modify',
  'Motion for Enforcement / Contempt',
  'Inventory and Appraisement',
  'Child Support Withholding Order',
];

// ---------------------------------------------------------------------------
// Merge field definitions (mirroring @ttaylor/documents STANDARD_MERGE_FIELDS)
// ---------------------------------------------------------------------------

interface MergeFieldDef {
  key: string;
  label: string;
  category: string;
}

const MERGE_FIELDS: MergeFieldDef[] = [
  { key: 'matter.causeNumber', label: 'Cause Number', category: 'Matter' },
  { key: 'matter.court', label: 'Court', category: 'Matter' },
  { key: 'matter.judge', label: 'Judge', category: 'Matter' },
  { key: 'petitioner.firstName', label: 'Petitioner First Name', category: 'Petitioner' },
  { key: 'petitioner.lastName', label: 'Petitioner Last Name', category: 'Petitioner' },
  { key: 'petitioner.fullName', label: 'Petitioner Full Name', category: 'Petitioner' },
  { key: 'respondent.firstName', label: 'Respondent First Name', category: 'Respondent' },
  { key: 'respondent.lastName', label: 'Respondent Last Name', category: 'Respondent' },
  { key: 'respondent.fullName', label: 'Respondent Full Name', category: 'Respondent' },
  { key: 'attorney.firstName', label: 'Attorney First Name', category: 'Attorney' },
  { key: 'attorney.lastName', label: 'Attorney Last Name', category: 'Attorney' },
  { key: 'attorney.barNumber', label: 'Attorney Bar Number', category: 'Attorney' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GenerateDocumentDialogProps {
  matterId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GenerateDocumentDialog({
  matterId,
  isOpen,
  onClose,
  onSuccess,
}: GenerateDocumentDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [mergeData, setMergeData] = useState<Record<string, string>>({});

  const { data: templates, isLoading: templatesLoading } =
    trpc.documents.listTemplates.useQuery({});

  const { data: matter } = trpc.matters.getById.useQuery({ id: matterId });

  const generateMutation = trpc.documents.generate.useMutation({
    onSuccess: () => {
      setSelectedTemplateId('');
      setMergeData({});
      onSuccess();
      onClose();
    },
  });

  // Pre-fill merge data from matter context
  const prefilledData = useMemo(() => {
    const prefilled: Record<string, string> = {};
    if (matter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = matter as any;
      if (m.causeNumber) prefilled['matter.causeNumber'] = m.causeNumber;
      if (m.court) prefilled['matter.court'] = m.court;
      if (m.judge) prefilled['matter.judge'] = m.judge;

      // Try to extract petitioner/respondent from parties
      const parties = m.parties ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const petitioner = parties.find((p: any) => p.roleType === 'PETITIONER' || p.role === 'PETITIONER');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const respondent = parties.find((p: any) => p.roleType === 'RESPONDENT' || p.role === 'RESPONDENT');

      if (petitioner?.contact) {
        prefilled['petitioner.firstName'] = petitioner.contact.firstName ?? '';
        prefilled['petitioner.lastName'] = petitioner.contact.lastName ?? '';
        prefilled['petitioner.fullName'] = `${petitioner.contact.firstName ?? ''} ${petitioner.contact.lastName ?? ''}`.trim();
      }
      if (respondent?.contact) {
        prefilled['respondent.firstName'] = respondent.contact.firstName ?? '';
        prefilled['respondent.lastName'] = respondent.contact.lastName ?? '';
        prefilled['respondent.fullName'] = `${respondent.contact.firstName ?? ''} ${respondent.contact.lastName ?? ''}`.trim();
      }

      // Try to extract attorney from assignments
      const assignments = m.assignments ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attorney = assignments.find((a: any) => a.assignmentRole === 'ATTORNEY' || a.assignmentRole === 'LEAD_ATTORNEY');
      if (attorney?.user) {
        prefilled['attorney.firstName'] = attorney.user.firstName ?? '';
        prefilled['attorney.lastName'] = attorney.user.lastName ?? '';
      }
    }
    return prefilled;
  }, [matter]);

  function getFieldValue(key: string): string {
    return mergeData[key] ?? prefilledData[key] ?? '';
  }

  function setFieldValue(key: string, value: string) {
    setMergeData((prev) => ({ ...prev, [key]: value }));
  }

  function buildMergePayload(): Record<string, unknown> {
    // Build nested merge data from flat key-value pairs
    const result: Record<string, Record<string, string>> = {};
    for (const field of MERGE_FIELDS) {
      const value = getFieldValue(field.key);
      if (value) {
        const [category, prop] = field.key.split('.');
        if (!result[category]) result[category] = {};
        result[category][prop] = value;
      }
    }
    return result;
  }

  function handleGenerate() {
    if (!selectedTemplateId) return;
    generateMutation.mutate({
      matterId,
      templateId: selectedTemplateId,
      mergeData: buildMergePayload(),
    });
  }

  if (!isOpen) return null;

  const templateList = templates ?? [];
  const hasTemplates = templateList.length > 0;

  // Group merge fields by category
  const fieldsByCategory = MERGE_FIELDS.reduce<Record<string, MergeFieldDef[]>>((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {});

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
          width: '640px',
          maxHeight: '85vh',
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
              Generate Document
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

        {/* Template selector */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '6px',
            }}
          >
            Template
          </label>

          {templatesLoading ? (
            <div style={{ padding: '12px', textAlign: 'center' }}>
              <LoadingSpinner size="sm" />
            </div>
          ) : hasTemplates ? (
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
            >
              <option value="">Select Template</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {templateList.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#92400e',
                    }}
                  >
                    No templates configured
                  </p>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: '13px',
                      color: '#78350f',
                    }}
                  >
                    Contact your administrator to load document templates. Standard Texas family law
                    templates that should be available:
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      padding: '0 0 0 18px',
                      fontSize: '12px',
                      color: '#92400e',
                      lineHeight: 1.6,
                    }}
                  >
                    {EXPECTED_TEMPLATES.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Merge data form -- only show when a template is selected */}
        {hasTemplates && selectedTemplateId && (
          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '8px',
              }}
            >
              Merge Data
            </h3>

            {Object.entries(fieldsByCategory).map(([category, fields]) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <h4
                  style={{
                    margin: '0 0 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {category}
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}
                >
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          color: '#6b7280',
                          marginBottom: '3px',
                        }}
                      >
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={getFieldValue(field.key)}
                        onChange={(e) => setFieldValue(field.key, e.target.value)}
                        placeholder={field.label}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          borderRadius: '5px',
                          backgroundColor: prefilledData[field.key] && !mergeData[field.key]
                            ? '#f0fdf4'
                            : '#ffffff',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <p style={{ margin: '0', fontSize: '11px', color: '#94a3b8' }}>
              Green fields are pre-filled from the matter. You can override any value.
            </p>
          </div>
        )}

        {/* Error display */}
        {generateMutation.error && (
          <div
            style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            {generateMutation.error.message}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!selectedTemplateId || generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Document'}
          </Button>
        </div>
      </div>
    </>
  );
}
