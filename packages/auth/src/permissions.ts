/**
 * Permission constants for the Ttaylor RBAC system.
 *
 * Each permission maps to a specific capability in the platform.
 * These codes are stored in the `permissions` table and associated
 * with roles via `role_permissions`.
 */
export const PERMISSIONS = {
  // Matters
  MATTERS_CREATE: 'matters.create',
  MATTERS_READ_ALL: 'matters.readAll',
  MATTERS_READ_ASSIGNED: 'matters.readAssigned',
  MATTERS_UPDATE: 'matters.update',
  MATTERS_CLOSE: 'matters.close',
  MATTERS_ARCHIVE: 'matters.archive',

  // Documents
  DOCUMENTS_CREATE: 'documents.create',
  DOCUMENTS_GENERATE: 'documents.generate',
  DOCUMENTS_REVIEW: 'documents.review',
  DOCUMENTS_APPROVE: 'documents.approve',
  DOCUMENTS_REJECT: 'documents.reject',

  // Templates
  TEMPLATES_READ: 'templates.read',
  TEMPLATES_CREATE: 'templates.create',
  TEMPLATES_UPDATE: 'templates.update',
  TEMPLATES_DELETE: 'templates.delete',

  // Filing
  FILING_CREATE: 'filing.create',
  FILING_SUBMIT_ATTORNEY: 'filing.submitAttorney',
  FILING_APPROVE_ATTORNEY: 'filing.approveAttorney',
  FILING_SUBMIT_COURT: 'filing.submitCourt',

  // Intake
  INTAKE_CREATE_LEAD: 'intake.createLead',
  INTAKE_CONVERT_MATTER: 'intake.convertMatter',
  INTAKE_CONFLICT_CHECK: 'intake.conflictCheck',

  // Admin
  ADMIN_MANAGE_USERS: 'admin.manageUsers',
  ADMIN_VIEW_AUDIT: 'admin.viewAudit',
  ADMIN_EXPORT_AUDIT: 'admin.exportAudit',

  // Financial
  FINANCIAL_VIEW: 'financial.view',
  FINANCIAL_CREATE_INVOICE: 'financial.createInvoice',
  FINANCIAL_RECORD_PAYMENT: 'financial.recordPayment',

  // Portal
  PORTAL_GRANT_ACCESS: 'portal.grantAccess',
  PORTAL_REVOKE_ACCESS: 'portal.revokeAccess',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** All permission codes as an array (useful for seeding). */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
