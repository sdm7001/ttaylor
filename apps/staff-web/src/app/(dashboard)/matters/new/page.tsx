'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, Card, LoadingSpinner } from '@ttaylor/ui';
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Matter types are now fetched from the API via trpc.matters.listMatterTypes.
 * The MATTER_TYPES constant below is a fallback for when the API call is still loading.
 */
const MATTER_TYPES_FALLBACK = [
  { id: 'divorce-uncontested', name: 'Divorce (Uncontested)' },
  { id: 'divorce-contested', name: 'Divorce (Contested)' },
  { id: 'sapcr-custody', name: 'SAPCR / Custody' },
  { id: 'child-support', name: 'Child Support' },
  { id: 'modification', name: 'Modification' },
  { id: 'adoption', name: 'Adoption' },
  { id: 'grandparents-rights', name: "Grandparents' Rights" },
  { id: 'mediation', name: 'Mediation' },
  { id: 'post-order-enforcement', name: 'Post-Order Enforcement' },
] as const;

const TOTAL_STEPS = 4;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // At least 7 digits, allow common separators
  return /[\d]{7,}/.test(phone.replace(/[\s\-().+]/g, ''));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  // Step 1
  matterType: string;
  matterTypeLabel: string;
  // Step 2
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clientNotes: string;
  // Step 3
  causeNumber: string;
  court: string;
  judge: string;
  assignedAttorney: string;
  matterNotes: string;
}

// ---------------------------------------------------------------------------
// Stepper component
// ---------------------------------------------------------------------------

function Stepper({ currentStep }: { currentStep: number }) {
  const steps = ['Matter Type', 'Client Info', 'Matter Details', 'Confirmation'];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        marginBottom: '32px',
      }}
    >
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isComplete = stepNum < currentStep;

        return (
          <React.Fragment key={label}>
            {idx > 0 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: isComplete || isActive ? '#1565C0' : '#e2e8f0',
                  margin: '0 8px',
                }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: isComplete
                    ? '#1565C0'
                    : isActive
                      ? '#E3F2FD'
                      : '#f1f5f9',
                  color: isComplete
                    ? '#ffffff'
                    : isActive
                      ? '#1565C0'
                      : '#94a3b8',
                  border: isActive ? '2px solid #1565C0' : '2px solid transparent',
                }}
              >
                {isComplete ? <Check size={16} /> : stepNum}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0f172a' : '#64748b',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form field helper
// ---------------------------------------------------------------------------

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: '6px',
        }}
      >
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '4px',
            fontSize: '12px',
            color: '#dc2626',
          }}
        >
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '14px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  outline: 'none',
  color: '#0f172a',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box',
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: '#dc2626',
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NewMatterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictResult, setConflictResult] = useState<{
    status: string;
    matchCount: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matches: any[];
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    matterType: '',
    matterTypeLabel: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    clientNotes: '',
    causeNumber: '',
    court: '',
    judge: '',
    assignedAttorney: '',
    matterNotes: '',
  });

  // Queries for dropdowns
  const { data: matterTypesData } = trpc.matters.listMatterTypes.useQuery();
  const { data: attorneysData } = trpc.users.listAttorneys.useQuery();

  const matterTypes = matterTypesData ?? MATTER_TYPES_FALLBACK.map((mt) => ({ id: mt.id, name: mt.name, category: null }));
  const attorneys = attorneysData ?? [];

  // Mutations
  const createLead = trpc.intake.createLead.useMutation();
  const runConflictCheck = trpc.intake.runConflictCheck.useMutation();
  const convertToMatter = trpc.intake.convertToMatter.useMutation();

  const isSubmitting = createLead.isPending || convertToMatter.isPending;

  // Field updater
  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user types
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

  // ---------------------------------------------------------------------------
  // Step validation
  // ---------------------------------------------------------------------------

  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.matterType) {
      newErrors.matterType = 'Please select a matter type';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhone(form.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep3(): boolean {
    // All step 3 fields are optional
    setErrors({});
    return true;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  // ---------------------------------------------------------------------------
  // Conflict check handler
  // ---------------------------------------------------------------------------

  async function handleConflictCheck() {
    if (!validateStep2()) return;

    try {
      // Create a temporary lead for conflict check
      const lead = await createLead.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        practiceArea: form.matterTypeLabel,
        notes: form.clientNotes.trim() || undefined,
      });

      const result = await runConflictCheck.mutateAsync({ leadId: lead.id });

      setConflictResult({
        status: result.status,
        matchCount: result.matchCount,
        matches: result.matches,
      });

      // Store lead ID in form for later use during creation
      (form as FormData & { _leadId?: string })._leadId = lead.id;
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to run conflict check',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Create matter handler
  // ---------------------------------------------------------------------------

  async function handleCreateMatter() {
    setSubmitError(null);

    try {
      // If we already created a lead during conflict check, reuse it
      let leadId = (form as FormData & { _leadId?: string })._leadId;

      if (!leadId) {
        const lead = await createLead.mutateAsync({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          practiceArea: form.matterTypeLabel,
          notes: form.clientNotes.trim() || undefined,
        });
        leadId = lead.id;
      }

      // Convert lead to matter immediately
      // Note: matterTypeId here uses the seed label -- the convertToMatter endpoint
      // requires a real cuid from the database. For now we pass the matterType string
      // and the backend will look it up. If the backend strictly requires a cuid,
      // we'll need a matterTypes.list endpoint. Using the form.matterType ID as-is.
      const result = await convertToMatter.mutateAsync({
        leadId,
        matterTypeId: form.matterType,
        assignedAttorneyId: form.assignedAttorney || leadId, // Uses real attorney userId from select dropdown
      });

      router.push(`/matters/${result.matterId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create matter',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Render steps
  // ---------------------------------------------------------------------------

  function renderStep1() {
    return (
      <Card title="Select Matter Type">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '8px',
          }}
        >
          {matterTypes.map((mt) => {
            const selected = form.matterType === mt.id;
            return (
              <button
                key={mt.id}
                onClick={() => {
                  updateField('matterType', mt.id);
                  updateField('matterTypeLabel', mt.name);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  fontSize: '14px',
                  fontWeight: selected ? 600 : 500,
                  color: selected ? '#1565C0' : '#0f172a',
                  backgroundColor: selected ? '#E3F2FD' : '#ffffff',
                  border: selected ? '2px solid #1565C0' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 100ms ease',
                }}
              >
                {selected && <Check size={16} />}
                {mt.name}
              </button>
            );
          })}
        </div>
        {errors.matterType && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            <AlertCircle size={14} />
            {errors.matterType}
          </div>
        )}
      </Card>
    );
  }

  function renderStep2() {
    return (
      <Card title="Client Information">
        <div style={{ maxWidth: '560px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="First Name" required error={errors.firstName}>
              <input
                style={errors.firstName ? inputErrorStyle : inputStyle}
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="First name"
              />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
              <input
                style={errors.lastName ? inputErrorStyle : inputStyle}
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Last name"
              />
            </FormField>
          </div>
          <FormField label="Email" required error={errors.email}>
            <input
              style={errors.email ? inputErrorStyle : inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="client@example.com"
            />
          </FormField>
          <FormField label="Phone" required error={errors.phone}>
            <input
              style={errors.phone ? inputErrorStyle : inputStyle}
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </FormField>
          <FormField label="Notes">
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={form.clientNotes}
              onChange={(e) => updateField('clientNotes', e.target.value)}
              placeholder="Any notes about the client..."
            />
          </FormField>

          {/* Conflict check */}
          <div style={{ marginTop: '8px' }}>
            <Button
              variant="secondary"
              onClick={handleConflictCheck}
              disabled={runConflictCheck.isPending || createLead.isPending}
            >
              {runConflictCheck.isPending ? 'Running...' : 'Run Conflict Check'}
            </Button>

            {conflictResult && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor:
                    conflictResult.status === 'clear' ? '#f0fdf4' : '#fef2f2',
                  border:
                    conflictResult.status === 'clear'
                      ? '1px solid #bbf7d0'
                      : '1px solid #fecaca',
                  color:
                    conflictResult.status === 'clear' ? '#166534' : '#991b1b',
                }}
              >
                {conflictResult.status === 'clear' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    No conflicts found. Clear to proceed.
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                      <AlertCircle
                        size={16}
                        style={{ verticalAlign: 'middle', marginRight: '4px' }}
                      />
                      {conflictResult.matchCount} potential conflict
                      {conflictResult.matchCount !== 1 ? 's' : ''} found:
                    </div>
                    {conflictResult.matches.map(
                      (
                        m: {
                          contactId: string;
                          contactName: string;
                          matterTitle: string;
                          matterStatus: string;
                        },
                        idx: number,
                      ) => (
                        <div
                          key={`${m.contactId}-${idx}`}
                          style={{ marginLeft: '20px', marginTop: '4px' }}
                        >
                          {m.contactName} -- Matter: {m.matterTitle} ({m.matterStatus})
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  function renderStep3() {
    return (
      <Card title="Matter Details">
        <div style={{ maxWidth: '560px' }}>
          <FormField label="Cause Number">
            <input
              style={inputStyle}
              value={form.causeNumber}
              onChange={(e) => updateField('causeNumber', e.target.value)}
              placeholder="May not be assigned yet"
            />
          </FormField>
          <FormField label="Court">
            <input
              style={inputStyle}
              value={form.court}
              onChange={(e) => updateField('court', e.target.value)}
              placeholder="Harris County District Court - 247th Judicial District"
            />
          </FormField>
          <FormField label="Judge">
            <input
              style={inputStyle}
              value={form.judge}
              onChange={(e) => updateField('judge', e.target.value)}
              placeholder="Judge name"
            />
          </FormField>
          <FormField label="Assigned Attorney">
            <select
              style={{
                ...inputStyle,
                appearance: 'auto' as const,
              }}
              value={form.assignedAttorney}
              onChange={(e) => updateField('assignedAttorney', e.target.value)}
            >
              <option value="">Select attorney...</option>
              {attorneys.map((att) => (
                <option key={att.id} value={att.id}>
                  {att.firstName} {att.lastName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={form.matterNotes}
              onChange={(e) => updateField('matterNotes', e.target.value)}
              placeholder="Additional matter notes..."
            />
          </FormField>
        </div>
      </Card>
    );
  }

  function renderStep4() {
    return (
      <Card title="Review and Confirm">
        <div style={{ maxWidth: '560px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '14px',
            }}
          >
            <SummaryRow label="Matter Type" value={form.matterTypeLabel} />
            <div
              style={{
                height: '1px',
                backgroundColor: '#f1f5f9',
                margin: '4px 0',
              }}
            />
            <SummaryRow label="Client" value={`${form.firstName} ${form.lastName}`} />
            <SummaryRow label="Email" value={form.email} />
            <SummaryRow label="Phone" value={form.phone} />
            {form.clientNotes && (
              <SummaryRow label="Client Notes" value={form.clientNotes} />
            )}
            <div
              style={{
                height: '1px',
                backgroundColor: '#f1f5f9',
                margin: '4px 0',
              }}
            />
            {form.causeNumber && (
              <SummaryRow label="Cause Number" value={form.causeNumber} />
            )}
            {form.court && <SummaryRow label="Court" value={form.court} />}
            {form.judge && <SummaryRow label="Judge" value={form.judge} />}
            {form.assignedAttorney && (
              <SummaryRow
                label="Attorney"
                value={
                  attorneys.find((a) => a.id === form.assignedAttorney)
                    ? `${attorneys.find((a) => a.id === form.assignedAttorney)!.firstName} ${attorneys.find((a) => a.id === form.assignedAttorney)!.lastName}`
                    : form.assignedAttorney
                }
              />
            )}
            {form.matterNotes && (
              <SummaryRow label="Matter Notes" value={form.matterNotes} />
            )}

            {conflictResult && (
              <div style={{ marginTop: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color:
                      conflictResult.status === 'clear' ? '#166534' : '#991b1b',
                    backgroundColor:
                      conflictResult.status === 'clear' ? '#f0fdf4' : '#fef2f2',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  Conflict Check: {conflictResult.status === 'clear' ? 'CLEAR' : 'CONFLICTS FOUND'}
                </span>
              </div>
            )}
          </div>

          {submitError && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              }}
            >
              <AlertCircle
                size={14}
                style={{ verticalAlign: 'middle', marginRight: '6px' }}
              />
              {submitError}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  return (
    <>
      <PageHeader
        title="New Matter"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/matters')}
          >
            <ArrowLeft size={16} style={{ marginRight: '4px' }} />
            Back to Matters
          </Button>
        }
      />

      <Stepper currentStep={step} />

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '24px',
        }}
      >
        <div>
          {step > 1 && (
            <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
              <ArrowLeft size={16} style={{ marginRight: '4px' }} />
              Back
            </Button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {step < TOTAL_STEPS && (
            <Button variant="primary" onClick={handleNext}>
              Next
              <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </Button>
          )}
          {step === TOTAL_STEPS && (
            <Button
              variant="primary"
              onClick={handleCreateMatter}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span style={{ marginLeft: '8px' }}>Creating...</span>
                </>
              ) : (
                'Create Matter'
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Summary row helper
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <span
        style={{
          width: '130px',
          flexShrink: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: '#64748b',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '14px', color: '#0f172a' }}>{value}</span>
    </div>
  );
}
