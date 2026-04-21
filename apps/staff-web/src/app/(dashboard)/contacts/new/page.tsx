'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Button, Card, LoadingSpinner } from '@ttaylor/ui';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTACT_TYPES = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'OPPOSING_PARTY', label: 'Opposing Party' },
  { value: 'WITNESS', label: 'Witness' },
  { value: 'EXPERT', label: 'Expert' },
  { value: 'MEDIATOR', label: 'Mediator' },
  { value: 'JUDGE', label: 'Judge' },
  { value: 'COURT_STAFF', label: 'Court Staff' },
  { value: 'OTHER', label: 'Other' },
] as const;

type ContactTypeValue = (typeof CONTACT_TYPES)[number]['value'];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1.5L6 6.5L11 1.5\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
};

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

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NewContactPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactType, setContactType] = useState<ContactTypeValue>('CLIENT');
  const [organizationName, setOrganizationName] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      setSuccessMessage('Contact created successfully.');
      // Navigate to contacts list after brief delay to show success
      setTimeout(() => {
        router.push('/contacts');
      }, 800);
    },
    onError: (err) => {
      setSubmitError(err.message || 'Failed to create contact');
    },
  });

  const clearFieldError = useCallback(
    (field: string) => {
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

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';

    if (email.trim() && !isValidEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    createContact.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      contactType,
      organizationName: organizationName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <>
      <PageHeader
        title="New Contact"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} style={{ marginRight: '4px' }} />
            Cancel
          </Button>
        }
      />

      {successMessage && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Check size={16} />
          {successMessage}
        </div>
      )}

      {submitError && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ maxWidth: '560px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <FormField label="First Name" required error={errors.firstName}>
                <input
                  style={errors.firstName ? inputErrorStyle : inputStyle}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError('firstName');
                  }}
                  placeholder="First name"
                />
              </FormField>
              <FormField label="Last Name" required error={errors.lastName}>
                <input
                  style={errors.lastName ? inputErrorStyle : inputStyle}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError('lastName');
                  }}
                  placeholder="Last name"
                />
              </FormField>
            </div>

            <FormField label="Email" error={errors.email}>
              <input
                style={errors.email ? inputErrorStyle : inputStyle}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="contact@example.com"
              />
            </FormField>

            <FormField label="Phone">
              <input
                style={inputStyle}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </FormField>

            <FormField label="Contact Type" required>
              <select
                style={selectStyle}
                value={contactType}
                onChange={(e) => setContactType(e.target.value as ContactTypeValue)}
              >
                {CONTACT_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Organization Name">
              <input
                style={inputStyle}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Organization or firm name"
              />
            </FormField>

            <FormField label="Notes">
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </FormField>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '24px',
              }}
            >
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={createContact.isPending}
              >
                {createContact.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span style={{ marginLeft: '8px' }}>Creating...</span>
                  </>
                ) : (
                  'Create Contact'
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </>
  );
}
