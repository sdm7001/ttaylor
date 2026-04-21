# RBAC Matrix -- Ttaylor Family Law Paralegal Platform

**Version**: 1.0.0
**Source of Truth**: `/SCHEMA_CANON.md`
**Last Updated**: 2026-04-21

---

## Roles

| Role | Description | Scope |
|---|---|---|
| ADMIN | System administrator. Full access to all resources and configuration. Typically the firm owner or office manager. | Global |
| ATTORNEY | Licensed attorney (users.is_attorney = true). Can approve documents, filing packets, and checklist items. Gates critical legal decisions. | Global + matter-assigned |
| PARALEGAL | Paralegal staff. Primary workflow operators. Can create, edit, and submit documents and filings. | Assigned matters |
| LEGAL_ASSISTANT | Legal assistant. Supports paralegals with document preparation, data entry, and scheduling. | Assigned matters |
| RECEPTIONIST | Front desk. Handles intake, lead creation, and basic scheduling. Limited access to matter details. | Leads + limited matter read |
| CLIENT | Client portal user (portal_access table, not users table). Can view shared documents, send messages, and upload files for their specific matter only. | Single matter (portal-scoped) |

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Full access (no restrictions) |
| 🔒 | Restricted: own records only OR assigned matters only |
| ❌ | No access |
| 🔑 | Requires attorney approval gate (action dispatched, but an attorney must approve before it takes effect) |

---

## Permission Matrix

### Matters

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create | ✅ | ✅ | 🔑 | ❌ | ❌ | ❌ |
| read (assigned) | ✅ | 🔒 | 🔒 | 🔒 | ❌ | 🔒 |
| read (all) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| update | ✅ | 🔒 | 🔒 | ❌ | ❌ | ❌ |
| close | ✅ | 🔒 | 🔑 | ❌ | ❌ | ❌ |
| archive | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- PARALEGAL can initiate matter creation from a converted lead, but an attorney must clear the conflict check first (upstream gate).
- PARALEGAL can initiate close, but ATTORNEY must approve the PENDING_CLOSE to CLOSED transition.
- CLIENT sees a summary view of their matter through the portal, scoped to `portal_access.matter_id`.

### Leads

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| read | ✅ | ✅ | ✅ | 🔒 | 🔒 | ❌ |
| convert-to-matter | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

**Notes**:
- RECEPTIONIST can read leads assigned to them.
- LEGAL_ASSISTANT can read leads they are assigned to assist.
- Convert-to-matter requires a cleared conflict check (attorney gate upstream).

### Contacts

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| read | ✅ | ✅ | 🔒 | 🔒 | 🔒 | ❌ |
| update | ✅ | ✅ | 🔒 | 🔒 | ❌ | ❌ |
| delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- PARALEGAL and LEGAL_ASSISTANT can read/update contacts associated with their assigned matters.
- RECEPTIONIST can read contacts they created (intake context).
- Delete is soft-delete. Only ADMIN and ATTORNEY can soft-delete contacts due to legal record retention implications.

### Documents

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create-draft | ✅ | ✅ | 🔒 | 🔒 | ❌ | ❌ |
| generate (template merge) | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| review (internal) | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| attorney-approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| attorney-reject | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| file | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |

**Notes**:
- attorney-approve and attorney-reject require `users.is_attorney = true`. ADMIN can approve only if they are also an attorney.
- LEGAL_ASSISTANT can create drafts on assigned matters but cannot generate from templates or review.
- CLIENT can view documents explicitly shared via portal (see Portal section).

### Filing Packets

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| assemble (add/remove items) | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| submit-for-attorney-review | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| attorney-approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| submit-to-court | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |

**Notes**:
- attorney-approve requires `users.is_attorney = true`. This is a hard gate -- no bypass.
- submit-to-court requires `attorney_approved_by` to be non-null. The tRPC mutation enforces this.
- PARALEGAL operations are restricted to assigned matters.

### Checklists

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create-template | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| assign (item to user) | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| complete-item | ✅ | ✅ | 🔒 | 🔒 | ❌ | ❌ |
| waive-item | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| attorney-review-item | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- waive-item requires `users.is_attorney = true`. Waiving is a documented legal decision.
- attorney-review-item requires `users.is_attorney = true`.
- LEGAL_ASSISTANT can complete items assigned to them on their assigned matters.

### Calendar

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create-event | ✅ | ✅ | 🔒 | 🔒 | 🔒 | ❌ |
| read (assigned matters) | ✅ | 🔒 | 🔒 | 🔒 | 🔒 | ❌ |
| read (all) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| update | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| delete | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |

**Notes**:
- RECEPTIONIST can create events and read events for scheduling purposes but cannot modify or delete.
- LEGAL_ASSISTANT can read and create events on assigned matters.

### Discovery

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create-request | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| track-response | ✅ | ✅ | 🔒 | 🔒 | ❌ | ❌ |
| mark-complete | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |

**Notes**:
- LEGAL_ASSISTANT can track responses (data entry) but cannot create requests or mark complete.
- All discovery operations are scoped to assigned matters.

### Financial

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| create-invoice | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| record-payment | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| view-trust-ledger | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| export-financial-report | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- PARALEGAL can create invoices and record payments for assigned matters, but export is restricted to ADMIN and ATTORNEY.
- Trust ledger operations are sensitive. PARALEGAL can view but all trust disbursements require attorney approval (enforced via `financial_entries.approved_by`).

### Portal

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| grant-access | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| revoke-access | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| message-client | ✅ | ✅ | 🔒 | 🔒 | ❌ | ❌ |
| view-shared-documents | ✅ | ✅ | 🔒 | 🔒 | ❌ | 🔒 |

**Notes**:
- CLIENT can only view documents explicitly shared to their portal (via shared_documents or document visibility flags).
- CLIENT can send messages in portal threads on their matter.
- LEGAL_ASSISTANT can message clients and view shared documents on assigned matters.

### Admin

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| manage-users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| manage-roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view-audit-log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| export-audit-log | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| configure-system | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- ATTORNEY can view audit logs for oversight but cannot export or configure.
- User management, role management, and system configuration are ADMIN-only.

### Reports

| Action | ADMIN | ATTORNEY | PARALEGAL | LEGAL_ASSISTANT | RECEPTIONIST | CLIENT |
|---|---|---|---|---|---|---|
| view-matter-pipeline | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ |
| view-financial-summary | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| view-staff-productivity | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| export-reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Notes**:
- PARALEGAL can view matter pipeline for their assigned matters only.
- Financial and productivity reports are restricted to ADMIN and ATTORNEY for confidentiality.

---

## Implementation Notes

### 1. Permission Checking in tRPC Middleware

Permissions are checked in a layered middleware stack on every tRPC procedure:

```
Request
  -> authMiddleware (verify session, load user record)
  -> permissionMiddleware (check user has required permission key)
  -> matterScopeMiddleware (if applicable, check user is assigned to the matter)
  -> procedure handler
```

**authMiddleware**: Extracts the session token from the request header, verifies it via Clerk (or the internal session store), and loads the full user record including roles and permissions from the database. The result is attached to `ctx.user`.

```typescript
// Pseudocode for auth middleware
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const session = await verifySession(ctx.req.headers.authorization);
  if (!session) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const user = await db.users.findUnique({
    where: { id: session.userId },
    include: {
      user_roles: { include: { role: { include: { role_permissions: { include: { permission: true } } } } } }
    }
  });

  if (!user || !user.is_active) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const permissions = new Set(
    user.user_roles.flatMap(ur => ur.role.role_permissions.map(rp => rp.permission.key))
  );

  return next({ ctx: { ...ctx, user, permissions } });
});
```

**permissionMiddleware**: A factory function that takes a permission key and returns middleware that checks the user's permission set.

```typescript
const requirePermission = (permissionKey: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.permissions.has(permissionKey)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Missing permission: ${permissionKey}` });
    }
    return next({ ctx });
  });
```

**matterScopeMiddleware**: For procedures that operate on a specific matter, verifies the user is assigned to that matter (unless they have global read access via ADMIN or ATTORNEY roles).

```typescript
const requireMatterAccess = t.middleware(async ({ ctx, input, next }) => {
  const matterId = (input as { matterId: string }).matterId;
  if (!matterId) return next({ ctx });

  // ADMIN and ATTORNEY with global read skip assignment check
  if (ctx.permissions.has('matter:read_all')) return next({ ctx });

  const assignment = await db.matter_assignments.findFirst({
    where: { matter_id: matterId, user_id: ctx.user.id, removed_at: null }
  });

  if (!assignment) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Not assigned to this matter' });
  }

  return next({ ctx: { ...ctx, matterAssignment: assignment } });
});
```

### 2. Matter-Level Access Restrictions

Matters have an implicit sensitivity level derived from their properties:

| Level | Criteria | Access Rule |
|---|---|---|
| STANDARD | Default for all matters | Normal RBAC applies (assigned staff can access) |
| RESTRICTED | Set manually by attorney when matter involves sensitive parties (e.g., firm employee, public figure) | Only explicitly assigned staff; no global attorney read; admin retains access |
| ACP_PROTECTED | Attorney-client privilege flag on the matter | Only assigned attorney and designated paralegal; admin access logged with special audit event |

Implementation: The `matters` table does not have a `sensitivity` column currently. When this feature is needed, a `sensitivity TEXT NOT NULL DEFAULT 'standard'` column will be added. For now, all matters are STANDARD.

The `matterScopeMiddleware` will be extended to check `matters.sensitivity`:

```typescript
// Future extension for matter sensitivity
if (matter.sensitivity === 'restricted') {
  // Must have explicit assignment, no global read bypass
  const assignment = await db.matter_assignments.findFirst({ ... });
  if (!assignment) throw new TRPCError({ code: 'FORBIDDEN' });
} else if (matter.sensitivity === 'acp_protected') {
  // Only assigned attorney or designated paralegal
  const assignment = await db.matter_assignments.findFirst({
    where: {
      matter_id: matterId,
      user_id: ctx.user.id,
      removed_at: null,
      assignment_role: { in: ['lead_attorney', 'supporting_attorney', 'lead_paralegal'] }
    }
  });
  if (!assignment) throw new TRPCError({ code: 'FORBIDDEN' });
  // Log elevated access
  await audit.emit({ eventType: 'matter.acp_access', ... });
}
```

### 3. Attorney Approval Gate Enforcement

Attorney approval gates appear in three places:

**Document Approval**: The `documents.approve` mutation checks:
```typescript
if (!ctx.user.is_attorney) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Only attorneys may approve documents'
  });
}
```

**Filing Packet Approval**: The `filingPackets.attorneyApprove` mutation checks:
```typescript
if (!ctx.user.is_attorney) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Only attorneys may approve filing packets'
  });
}
```

**Filing Submission Gate**: The `filingPackets.submitToCourt` mutation checks:
```typescript
if (!packet.attorney_approved_by) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Filing packet must be approved by an attorney before submission'
  });
}
```

**Checklist Item Waiver**: The `checklists.items.waive` mutation checks:
```typescript
if (!ctx.user.is_attorney) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: 'Only attorneys may waive checklist items'
  });
}
```

These gates are not role-based -- they check the `users.is_attorney` boolean directly. This is because the attorney gate is a legal requirement (a licensed attorney must authorize these actions), not a configurable permission. Even an ADMIN cannot approve documents unless they are also a licensed attorney.

### 4. Client Portal Access Isolation

Portal clients authenticate via a separate auth flow that produces a `portal_session` token distinct from staff tokens. The portal auth middleware:

1. Verifies the portal session token.
2. Loads the `portal_access` record.
3. Sets `ctx.portalAccess` (not `ctx.user`).
4. All portal queries are automatically scoped to `portal_access.matter_id`.

A portal client CANNOT:
- Access any matter other than the one in their `portal_access` record.
- See internal communications (only `channel = 'client_portal'` threads).
- See documents not explicitly shared.
- See financial details, discovery items, or checklist internals.
- Access any admin, audit, or configuration endpoints.

The portal tRPC router is a separate router tree (`portalRouter`) that does not share middleware with the staff router. This prevents any accidental leakage of staff-only data to portal clients.
