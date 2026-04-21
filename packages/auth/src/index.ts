/**
 * @ttaylor/auth -- RBAC helpers for the Ttaylor Family Law platform.
 *
 * Exports permission constants, role-to-permission mapping, and
 * helper functions for resolving effective permissions from roles.
 */

export { PERMISSIONS, ALL_PERMISSIONS, type Permission } from './permissions';
export {
  RoleLevel,
  ROLE_PERMISSIONS,
  roleHasPermission,
  resolvePermissions,
} from './roles';
