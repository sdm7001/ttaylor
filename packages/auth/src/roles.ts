/**
 * Role-to-permission mapping for the Ttaylor RBAC system.
 *
 * Each RoleLevel maps to the set of permissions granted to users
 * holding that role. The mapping is seeded into the database and
 * also used at runtime for quick permission checks.
 */
import { PERMISSIONS, type Permission } from './permissions';

/**
 * Mirrors the Prisma RoleLevel enum. Duplicated here so the auth
 * package does not depend on @prisma/client at the type level.
 */
export enum RoleLevel {
  ATTORNEY = 'ATTORNEY',
  PARALEGAL = 'PARALEGAL',
  LEGAL_ASSISTANT = 'LEGAL_ASSISTANT',
  RECEPTIONIST = 'RECEPTIONIST',
  ADMIN = 'ADMIN',
  PORTAL_CLIENT = 'PORTAL_CLIENT',
}

const P = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<RoleLevel, Permission[]> = {
  [RoleLevel.ATTORNEY]: [
    // Matters -- full access
    P.MATTERS_CREATE,
    P.MATTERS_READ_ALL,
    P.MATTERS_READ_ASSIGNED,
    P.MATTERS_UPDATE,
    P.MATTERS_CLOSE,
    P.MATTERS_ARCHIVE,
    // Documents -- full access including approval
    P.DOCUMENTS_CREATE,
    P.DOCUMENTS_GENERATE,
    P.DOCUMENTS_REVIEW,
    P.DOCUMENTS_APPROVE,
    P.DOCUMENTS_REJECT,
    // Filing -- full access
    P.FILING_CREATE,
    P.FILING_SUBMIT_ATTORNEY,
    P.FILING_APPROVE_ATTORNEY,
    P.FILING_SUBMIT_COURT,
    // Intake
    P.INTAKE_CREATE_LEAD,
    P.INTAKE_CONVERT_MATTER,
    P.INTAKE_CONFLICT_CHECK,
    // Admin -- view audit only (not manage users)
    P.ADMIN_VIEW_AUDIT,
    P.ADMIN_EXPORT_AUDIT,
    // Financial
    P.FINANCIAL_VIEW,
    P.FINANCIAL_CREATE_INVOICE,
    P.FINANCIAL_RECORD_PAYMENT,
    // Portal
    P.PORTAL_GRANT_ACCESS,
    P.PORTAL_REVOKE_ACCESS,
    // Reports
    P.REPORTS_VIEW,
    P.REPORTS_EXPORT,
  ],

  [RoleLevel.PARALEGAL]: [
    P.MATTERS_CREATE,
    P.MATTERS_READ_ALL,
    P.MATTERS_READ_ASSIGNED,
    P.MATTERS_UPDATE,
    // No MATTERS_CLOSE, MATTERS_ARCHIVE -- attorney only
    P.DOCUMENTS_CREATE,
    P.DOCUMENTS_GENERATE,
    P.DOCUMENTS_REVIEW,
    // No DOCUMENTS_APPROVE, DOCUMENTS_REJECT -- attorney only
    P.FILING_CREATE,
    P.FILING_SUBMIT_ATTORNEY,
    // No FILING_APPROVE_ATTORNEY, FILING_SUBMIT_COURT
    P.INTAKE_CREATE_LEAD,
    P.INTAKE_CONVERT_MATTER,
    P.INTAKE_CONFLICT_CHECK,
    P.FINANCIAL_VIEW,
    P.PORTAL_GRANT_ACCESS,
    P.REPORTS_VIEW,
  ],

  [RoleLevel.LEGAL_ASSISTANT]: [
    P.MATTERS_READ_ASSIGNED,
    P.MATTERS_UPDATE,
    P.DOCUMENTS_CREATE,
    P.DOCUMENTS_GENERATE,
    P.DOCUMENTS_REVIEW,
    P.FILING_CREATE,
    P.INTAKE_CREATE_LEAD,
    P.INTAKE_CONFLICT_CHECK,
    P.FINANCIAL_VIEW,
    P.REPORTS_VIEW,
  ],

  [RoleLevel.RECEPTIONIST]: [
    P.MATTERS_READ_ASSIGNED,
    P.INTAKE_CREATE_LEAD,
    P.INTAKE_CONFLICT_CHECK,
  ],

  [RoleLevel.ADMIN]: [
    // Full admin capabilities
    P.MATTERS_READ_ALL,
    P.MATTERS_READ_ASSIGNED,
    P.ADMIN_MANAGE_USERS,
    P.ADMIN_VIEW_AUDIT,
    P.ADMIN_EXPORT_AUDIT,
    P.FINANCIAL_VIEW,
    P.FINANCIAL_CREATE_INVOICE,
    P.FINANCIAL_RECORD_PAYMENT,
    P.PORTAL_GRANT_ACCESS,
    P.PORTAL_REVOKE_ACCESS,
    P.REPORTS_VIEW,
    P.REPORTS_EXPORT,
  ],

  [RoleLevel.PORTAL_CLIENT]: [
    // Portal clients have no staff-level permissions.
    // Their access is controlled via PortalAccess records.
  ],
};

/**
 * Check whether a role level has a specific permission.
 */
export function roleHasPermission(
  role: RoleLevel,
  permission: Permission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Given a list of role levels, return the deduplicated union of all their permissions.
 */
export function resolvePermissions(roles: RoleLevel[]): Set<Permission> {
  const perms = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      perms.add(perm);
    }
  }
  return perms;
}
