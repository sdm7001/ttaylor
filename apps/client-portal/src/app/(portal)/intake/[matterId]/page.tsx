'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, LoadingSpinner, EmptyState } from '@ttaylor/ui';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';

/**
 * Client intake questionnaire form.
 *
 * Sections cover basic information, marriage details (for divorce matters),
 * children, assets, employment, and existing court orders.
 *
 * TODO: Wire submit to real API endpoint once intake questionnaire
 * record creation is implemented on the backend.
 */

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  outline: 'none',
  color: '#0f172a',
  backgroundColor: '#ffffff',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#0f172a',
  marginBottom: '4px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#0f172a',
  margin: '0 0 12px 0',
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: '14px',
};

export default function IntakeQuestionnairePage() {
  const params = useParams();
  const matterId = params.matterId as string;

  const { data: matter, isLoading } = trpc.matters.getById.useQuery(
    { id: matterId },
    { enabled: !!matterId },
  );

  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('TX');
  const [zip, setZip] = useState('');

  // Marriage info
  const [dateOfMarriage, setDateOfMarriage] = useState('');
  const [dateOfSeparation, setDateOfSeparation] = useState('');
  const [grounds, setGrounds] = useState('insupportability');

  // Children
  const [hasChildren, setHasChildren] = useState('no');
  const [childrenDetails, setChildrenDetails] = useState('');

  // Assets
  const [ownsRealProperty, setOwnsRealProperty] = useState('no');
  const [ownsVehicles, setOwnsVehicles] = useState('no');
  const [hasBusinessInterests, setHasBusinessInterests] = useState('no');

  // Employment
  const [employer, setEmployer] = useState('');
  const [approximateIncome, setApproximateIncome] = useState('');

  // Court orders
  const [existingOrders, setExistingOrders] = useState('no');
  const [orderDetails, setOrderDetails] = useState('');

  const matterTypeName =
    matter?.matterType?.name ?? matter?.matterTypeId ?? 'Matter';
  const isDivorce = matterTypeName.toLowerCase().includes('divorce');
  const isSAPCR =
    matterTypeName.toLowerCase().includes('sapcr') ||
    matterTypeName.toLowerCase().includes('custody');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!matter) {
    return (
      <EmptyState
        icon={<Info size={40} />}
        heading="Matter not found"
        body="This matter could not be loaded."
      />
    );
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link
          href="/intake"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            color: '#64748b',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Back to Intake
        </Link>

        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <CheckCircle size={48} style={{ color: '#16a34a' }} />
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
              }}
            >
              Thank you!
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
                maxWidth: '400px',
                lineHeight: '1.6',
              }}
            >
              Your answers have been submitted to your legal team. They will review
              your responses and may follow up with additional questions.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Submit questionnaire data to backend via tRPC once
    // the intake questionnaire creation endpoint is implemented.
    // For now, show the thank-you confirmation.
    setSubmitted(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back link */}
      <Link
        href="/intake"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          color: '#64748b',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={14} />
        Back to Intake
      </Link>

      <h1
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#0f172a',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {matterTypeName} -- Intake Questionnaire
      </h1>
      <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
        Please fill out the information below as completely as possible. This helps
        your attorney prepare your case. All information is kept confidential.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <Card>
          <h3 style={sectionTitleStyle}>Basic Information</h3>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Full Legal Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              style={fieldStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="As it appears on your driver's license"
              required
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Date of Birth</label>
            <input
              type="date"
              style={fieldStyle}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Current Address</label>
            <input
              style={fieldStyle}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '8px',
              ...fieldGroupStyle,
            }}
          >
            <div>
              <label style={labelStyle}>City</label>
              <input
                style={fieldStyle}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input
                style={fieldStyle}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>ZIP Code</label>
              <input
                style={fieldStyle}
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Marriage Information (divorce matters only) */}
        {isDivorce && (
          <Card>
            <h3 style={sectionTitleStyle}>Marriage Information</h3>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Date of Marriage</label>
              <input
                type="date"
                style={fieldStyle}
                value={dateOfMarriage}
                onChange={(e) => setDateOfMarriage(e.target.value)}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Date of Separation</label>
              <input
                type="date"
                style={fieldStyle}
                value={dateOfSeparation}
                onChange={(e) => setDateOfSeparation(e.target.value)}
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Grounds for Divorce</label>
              <select
                style={{
                  ...fieldStyle,
                  appearance: 'auto',
                }}
                value={grounds}
                onChange={(e) => setGrounds(e.target.value)}
              >
                <option value="insupportability">
                  Insupportability (no-fault)
                </option>
                <option value="cruelty">Cruelty</option>
                <option value="adultery">Adultery</option>
                <option value="conviction_of_felony">
                  Conviction of Felony
                </option>
                <option value="abandonment">Abandonment</option>
                <option value="living_apart">
                  Living Apart (3+ years)
                </option>
                <option value="confinement_mental_hospital">
                  Confinement in Mental Hospital
                </option>
              </select>
            </div>
          </Card>
        )}

        {/* Section 3: Children */}
        {(isDivorce || isSAPCR) && (
          <Card>
            <h3 style={sectionTitleStyle}>Children</h3>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                Do you have children with the other party?
              </label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="hasChildren"
                    value="yes"
                    checked={hasChildren === 'yes'}
                    onChange={(e) => setHasChildren(e.target.value)}
                    style={{ marginRight: '6px' }}
                  />
                  Yes
                </label>
                <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="hasChildren"
                    value="no"
                    checked={hasChildren === 'no'}
                    onChange={(e) => setHasChildren(e.target.value)}
                    style={{ marginRight: '6px' }}
                  />
                  No
                </label>
              </div>
            </div>

            {hasChildren === 'yes' && (
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  List each child's name and date of birth
                </label>
                <textarea
                  style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }}
                  value={childrenDetails}
                  onChange={(e) => setChildrenDetails(e.target.value)}
                  placeholder="Example:&#10;Jane Doe — 03/15/2018&#10;John Doe — 07/22/2020"
                />
              </div>
            )}
          </Card>
        )}

        {/* Section 4: Assets */}
        <Card>
          <h3 style={sectionTitleStyle}>Assets</h3>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Do you own real property (house, land)?</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ownsRealProperty"
                  value="yes"
                  checked={ownsRealProperty === 'yes'}
                  onChange={(e) => setOwnsRealProperty(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                Yes
              </label>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ownsRealProperty"
                  value="no"
                  checked={ownsRealProperty === 'no'}
                  onChange={(e) => setOwnsRealProperty(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                No
              </label>
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Do you own vehicles?</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ownsVehicles"
                  value="yes"
                  checked={ownsVehicles === 'yes'}
                  onChange={(e) => setOwnsVehicles(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                Yes
              </label>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ownsVehicles"
                  value="no"
                  checked={ownsVehicles === 'no'}
                  onChange={(e) => setOwnsVehicles(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                No
              </label>
            </div>
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Do you have any business interests?</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hasBusinessInterests"
                  value="yes"
                  checked={hasBusinessInterests === 'yes'}
                  onChange={(e) => setHasBusinessInterests(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                Yes
              </label>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hasBusinessInterests"
                  value="no"
                  checked={hasBusinessInterests === 'no'}
                  onChange={(e) => setHasBusinessInterests(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                No
              </label>
            </div>
          </div>
        </Card>

        {/* Section 5: Employment */}
        <Card>
          <h3 style={sectionTitleStyle}>Employment</h3>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Current Employer</label>
            <input
              style={fieldStyle}
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              placeholder="Company name"
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Approximate Annual Income</label>
            <input
              style={fieldStyle}
              value={approximateIncome}
              onChange={(e) => setApproximateIncome(e.target.value)}
              placeholder="e.g., $50,000"
            />
          </div>
        </Card>

        {/* Section 6: Existing Court Orders */}
        <Card>
          <h3 style={sectionTitleStyle}>Existing Court Orders</h3>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              Are there any existing court orders related to this matter?
            </label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="existingOrders"
                  value="yes"
                  checked={existingOrders === 'yes'}
                  onChange={(e) => setExistingOrders(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                Yes
              </label>
              <label style={{ fontSize: '14px', color: '#1e293b', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="existingOrders"
                  value="no"
                  checked={existingOrders === 'no'}
                  onChange={(e) => setExistingOrders(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                No
              </label>
            </div>
          </div>

          {existingOrders === 'yes' && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                Please describe the existing court orders
              </label>
              <textarea
                style={{ ...fieldStyle, minHeight: '80px', resize: 'vertical' }}
                value={orderDetails}
                onChange={(e) => setOrderDetails(e.target.value)}
                placeholder="Describe any existing orders, including the court that issued them and approximate date."
              />
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  margin: '4px 0 0 0',
                }}
              >
                If you have copies, please bring them to your next meeting with your
                attorney. File upload is coming in a future update.
              </p>
            </div>
          )}
        </Card>

        {/* Submit */}
        <div style={{ marginTop: '8px' }}>
          <button
            type="submit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#1565C0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Submit Questionnaire
          </button>
        </div>
      </form>
    </div>
  );
}
