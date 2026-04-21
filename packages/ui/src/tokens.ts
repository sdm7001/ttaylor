export const colors = {
  primary: '#0f172a',
  accent: '#1565C0',
  accentHover: '#0D47A1',
  accentLight: '#E3F2FD',
  surface: '#ffffff',
  background: '#f8fafc',
  muted: '#f1f5f9',
  border: '#e2e8f0',
  borderStrong: '#CBD5E1',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  destructive: '#dc2626',
  destructiveHover: '#B91C1C',
  destructiveLight: '#FEF2F2',
  success: '#16a34a',
  successLight: '#F0FDF4',
  warning: '#d97706',
  warningLight: '#FFFBEB',
  info: '#2563EB',
  infoLight: '#EFF6FF',
} as const;

export const matterStatusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  LEAD: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  INTAKE: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  CONFLICT_CHECK: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  RETAINER_PENDING: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  OPEN: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  ACTIVE: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  DISCOVERY: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  NEGOTIATION: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  MEDIATION: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  TRIAL_PREP: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  ON_HOLD: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  PENDING_CLOSE: { bg: '#F3E8FF', text: '#6B21A8', border: '#C084FC' },
  CLOSED: { bg: '#E2E8F0', text: '#64748B', border: '#CBD5E1' },
  ARCHIVED: { bg: '#F1F5F9', text: '#94A3B8', border: '#E2E8F0' },
} as const;

export const documentStatusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  DRAFT: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  GENERATING: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  GENERATED: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  INTERNAL_REVIEW: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  ATTORNEY_REVIEW: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  ATTORNEY_APPROVED: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  REVISION_NEEDED: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  SIGNED: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  FILED: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
} as const;

export const filingStatusColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  ASSEMBLING: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  DOCUMENTS_COMPLETE: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  READY_FOR_ATTORNEY_REVIEW: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  ATTORNEY_APPROVED: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  ATTORNEY_REJECTED: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  SUBMITTED_TO_COURT: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  ACCEPTED: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
  REJECTED_BY_COURT: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  DEFICIENCY_NOTICE: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  CORRECTING: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  ARCHIVED: { bg: '#F1F5F9', text: '#94A3B8', border: '#E2E8F0' },
} as const;

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  size: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '18px',
    xl: '24px',
    '2xl': '30px',
    '3xl': '36px',
  },
  lineHeight: {
    xs: '16px',
    sm: '18px',
    base: '20px',
    md: '22px',
    lg: '28px',
    xl: '32px',
    '2xl': '36px',
    '3xl': '40px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '32px',
  8: '40px',
  9: '48px',
  10: '56px',
  11: '64px',
  12: '80px',
} as const;

export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const;
