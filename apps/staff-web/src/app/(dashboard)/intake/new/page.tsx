'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button } from '@ttaylor/ui';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------
interface IntakeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  practiceArea: string;
  opposingParty: string;
  description: string;
  referralSource: string;
  hasCourtOrder: boolean | null;
  safetyConcern: boolean | null;
  preferredContactTime: string;
  staffNotes: string;
}

const PRACTICE_AREAS = [
  'Divorce',
  'SAPCR/Custody',
  'Child Support',
  'Modification',
  'Adoption',
  "Grandparents' Rights",
  'Mediation',
  'Post-Order Enforcement',
] as const;

const REFERRAL_SOURCES = [
  'Referral',
  'Google',
  'Social Media',
  'Previous Client',
  'Other',
] as const;

const CONTACT_TIMES = ['Morning', 'Afternoon', 'Evening'] as const;

const INITIAL_FORM: IntakeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  practiceArea: '',
  opposingParty: '',
  description: '',
  referralSource: '',
  hasCourtOrder: null,
  safetyConcern: null,
  preferredContactTime: '',
  staffNotes: '',
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateForm(data: IntakeFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.firstName.trim()) errors.firstName = 'First name is required';
  if (!data.lastName.trim()) errors.lastName = 'Last name is required';
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.phone.trim()) errors.phone = 'Phone is required';
  if (!data.practiceArea) errors.practiceArea = 'Practice area is required';
  if (!data.description.trim()) errors.description = 'Description is required';
  return errors;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
  padding: '24px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#0f172a',
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid #f1f5f9',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#334155',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '16px',
  border: '1px solid #CBD5E1',
  borderRadius: '6px',
  color: '#0f172a',
  backgroundColor: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: '#dc2626',
};

const errorTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#dc2626',
  marginTop: '2px',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
};

const radioGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  marginTop: '4px',
};

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
  color: '#334155',
  cursor: 'pointer',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function NewIntakePage() {
  const router = useRouter();
  const [form, setForm] = useState<IntakeFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createLead = trpc.intake.createLead.useMutation({
    onSuccess: (lead) => {
      router.push(`/intake/${lead.id}`);
    },
    onError: (err) => {
      setSubmitError(err.message);
    },
  });

  function updateField<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Build full notes from all text fields
    const noteParts: string[] = [];
    if (form.description.trim()) noteParts.push(`Description: ${form.description.trim()}`);
    if (form.opposingParty.trim()) noteParts.push(`Opposing party: ${form.opposingParty.trim()}`);
    if (form.referralSource) noteParts.push(`Referral source: ${form.referralSource}`);
    if (form.hasCourtOrder !== null) noteParts.push(`Active court order: ${form.hasCourtOrder ? 'Yes' : 'No'}`);
    if (form.safetyConcern !== null) noteParts.push(`Safety concern: ${form.safetyConcern ? 'YES' : 'No'}`);
    if (form.preferredContactTime) noteParts.push(`Preferred contact: ${form.preferredContactTime}`);
    if (form.street.trim() || form.city.trim()) {
      noteParts.push(`Address: ${[form.street, form.city, form.state, form.zip].filter(Boolean).join(', ')}`);
    }
    if (form.staffNotes.trim()) noteParts.push(`Staff notes: ${form.staffNotes.trim()}`);

    createLead.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      practiceArea: form.practiceArea,
      notes: noteParts.join('\n'),
    });
  }

  return (
    <>
      <PageHeader title="New Intake" />

      <form onSubmit={handleSubmit} style={{ maxWidth: '720px' }}>
        {/* ----------------------------------------------------------------- */}
        {/* Section 1: Contact Information */}
        {/* ----------------------------------------------------------------- */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Contact Information</h2>
          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>
                First Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                style={errors.firstName ? inputErrorStyle : inputStyle}
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="First name"
              />
              {errors.firstName && <p style={errorTextStyle}>{errors.firstName}</p>}
            </div>
            <div>
              <label style={labelStyle}>
                Last Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                style={errors.lastName ? inputErrorStyle : inputStyle}
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Last name"
              />
              {errors.lastName && <p style={errorTextStyle}>{errors.lastName}</p>}
            </div>
          </div>

          <div style={{ ...fieldGroupStyle, marginTop: '16px' }}>
            <div>
              <label style={labelStyle}>
                Email <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                style={errors.email ? inputErrorStyle : inputStyle}
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="email@example.com"
              />
              {errors.email && <p style={errorTextStyle}>{errors.email}</p>}
            </div>
            <div>
              <label style={labelStyle}>
                Phone <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                style={errors.phone ? inputErrorStyle : inputStyle}
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 555-5555"
              />
              {errors.phone && <p style={errorTextStyle}>{errors.phone}</p>}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Address (optional)</label>
            <input
              style={{ ...inputStyle, marginBottom: '8px' }}
              value={form.street}
              onChange={(e) => updateField('street', e.target.value)}
              placeholder="Street address"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
              <input
                style={inputStyle}
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="City"
              />
              <input
                style={inputStyle}
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="State"
                maxLength={2}
              />
              <input
                style={inputStyle}
                value={form.zip}
                onChange={(e) => updateField('zip', e.target.value)}
                placeholder="ZIP"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 2: Legal Matter */}
        {/* ----------------------------------------------------------------- */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Legal Matter</h2>

          <div style={fieldGroupStyle}>
            <div>
              <label style={labelStyle}>
                Practice Area <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                style={errors.practiceArea ? { ...selectStyle, borderColor: '#dc2626' } : selectStyle}
                value={form.practiceArea}
                onChange={(e) => updateField('practiceArea', e.target.value)}
              >
                <option value="">Select practice area...</option>
                {PRACTICE_AREAS.map((pa) => (
                  <option key={pa} value={pa}>
                    {pa}
                  </option>
                ))}
              </select>
              {errors.practiceArea && <p style={errorTextStyle}>{errors.practiceArea}</p>}
            </div>
            <div>
              <label style={labelStyle}>Opposing Party Name (optional)</label>
              <input
                style={inputStyle}
                value={form.opposingParty}
                onChange={(e) => updateField('opposingParty', e.target.value)}
                placeholder="Full name of opposing party"
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>
              Brief Description of Situation <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              style={errors.description ? { ...textareaStyle, borderColor: '#dc2626' } : textareaStyle}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe the legal situation in a few sentences..."
            />
            {errors.description && <p style={errorTextStyle}>{errors.description}</p>}
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>How did you hear about us?</label>
            <select
              style={selectStyle}
              value={form.referralSource}
              onChange={(e) => updateField('referralSource', e.target.value)}
            >
              <option value="">Select...</option>
              {REFERRAL_SOURCES.map((rs) => (
                <option key={rs} value={rs}>
                  {rs}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 3: Urgency and Notes */}
        {/* ----------------------------------------------------------------- */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Urgency and Notes</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Is there an active court order?</label>
            <div style={radioGroupStyle}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="hasCourtOrder"
                  checked={form.hasCourtOrder === true}
                  onChange={() => updateField('hasCourtOrder', true)}
                />
                Yes
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="hasCourtOrder"
                  checked={form.hasCourtOrder === false}
                  onChange={() => updateField('hasCourtOrder', false)}
                />
                No
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Is there an immediate safety concern?</label>
            <div style={radioGroupStyle}>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="safetyConcern"
                  checked={form.safetyConcern === true}
                  onChange={() => updateField('safetyConcern', true)}
                />
                Yes
              </label>
              <label style={radioLabelStyle}>
                <input
                  type="radio"
                  name="safetyConcern"
                  checked={form.safetyConcern === false}
                  onChange={() => updateField('safetyConcern', false)}
                />
                No
              </label>
            </div>
            {form.safetyConcern === true && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Please notify the attorney immediately. This client may need emergency protective orders or safety planning.
              </div>
            )}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Preferred Contact Time</label>
            <div style={radioGroupStyle}>
              {CONTACT_TIMES.map((t) => (
                <label key={t} style={radioLabelStyle}>
                  <input
                    type="radio"
                    name="preferredContactTime"
                    checked={form.preferredContactTime === t}
                    onChange={() => updateField('preferredContactTime', t)}
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Staff Notes (internal only)</label>
            <textarea
              style={textareaStyle}
              value={form.staffNotes}
              onChange={(e) => updateField('staffNotes', e.target.value)}
              placeholder="Internal notes about this lead..."
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Submit */}
        {/* ----------------------------------------------------------------- */}
        {submitError && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '13px',
            }}
          >
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '48px' }}>
          <Button
            variant="primary"
            type="submit"
            disabled={createLead.isPending}
          >
            {createLead.isPending ? 'Saving...' : 'Save Lead'}
          </Button>
          <Button variant="secondary" type="button" onClick={() => router.push('/intake')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
