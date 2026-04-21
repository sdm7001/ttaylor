# ADR-002: Authentication and Role-Based Access Control

**Status:** Accepted
**Date:** 2026-04-21
**Deciders:** Architect, Security Lead
**Supersedes:** None

---

## Context

The Ttaylor platform handles legally privileged data: attorney-client communications, financial records, Social Security numbers (last four digits), driver's license numbers, and children's personal information. The security requirements are not optional preferences -- they are driven by:

1. **Attorney-client privilege** -- unauthorized access to matter data could waive privilege. Access must be strictly scoped to users with a legitimate need.
2. **Texas Disciplinary Rules of Professional Conduct** -- attorneys must supervise non-attorney staff. The platform must enforce that certain actions (filing approval, conflict clearance) can only be performed by licensed attorneys.
3. **Multi-role staff** -- a senior paralegal may also serve as an intake specialist. A user may hold multiple roles simultaneously, and their effective permissions are the union of all granted role permissions.
4. **Client portal isolation** -- clients must never see other clients' data, staff-only notes, financial details beyond their own invoices, or internal workflow states. The client portal is a separate trust boundary.
5. **Audit requirements** -- every permission-checked action must produce an audit trail entry. Regulatory inquiries, malpractice defense, and bar complaints all require demonstrating who accessed what and when.
6. **MFA for staff** -- given the sensitivity of the data, staff accounts must support TOTP-based multi-factor authentication, with the ability to require MFA for specific roles (attorneys, admins).

---

## Decision

### Authentication: Clerk

Use **Clerk** as the authentication provider for both the staff application and the client portal.

**Rationale:**
- Clerk provides hosted authentication UI (sign-in, sign-up, MFA enrollment), eliminating the need to build and maintain password hashing, session management, CSRF protection, and MFA TOTP flows from scratch.
- Clerk supports organization-scoped sessions, allowing the staff application and client portal to operate as separate organizations with isolated user pools.
- Clerk's JWT includes custom claims, which we populate with the user's role slugs and organization ID at session creation.
- Clerk handles email verification, password reset, and brute-force protection out of the box.

**Integration pattern:**
- Clerk middleware runs on every Next.js request (both staff app and client portal).
- On first Clerk sign-in, a webhook syncs the Clerk user ID to the `users` table, creating or linking the internal user record. The `users.clerk_id` column stores this mapping.
- The `password_hash` column in the `users` table is retained for offline/backup authentication scenarios but is not the primary auth path.
- JWT custom claims are populated via Clerk's `session.claims` webhook, injecting `roles: string[]` and `org_id: string` from the internal RBAC tables.

### Authorization: Custom RBAC

Build a **custom role-based access control system** using the existing `roles`, `permissions`, `user_roles`, and `role_permissions` tables defined in the Schema Canon.

#### Roles

Six seeded roles, aligned with firm hierarchy:

| Role | Slug | Description | System Role |
|------|------|-------------|-------------|
| Administrator | `admin` | Full platform access, user management, configuration | Yes |
| Attorney | `attorney` | All staff operations + attorney-gated actions (filing approval, conflict clearance) | Yes |
| Senior Paralegal | `senior_paralegal` | Full matter management, document generation, filing packet assembly | Yes |
| Paralegal | `paralegal` | Standard matter work, document drafting, limited filing access | Yes |
| Intake Specialist | `intake_specialist` | Lead management, intake questionnaires, conflict check initiation | Yes |
| Billing Clerk | `billing_clerk` | Financial module access, invoice generation, payment recording | Yes |

Additional custom roles can be created by admins. System roles cannot be deleted or renamed.

#### Permissions

Permissions follow the `resource:action` format. Every permission is a row in the `permissions` table.

**Core permission set:**

| Permission Key | Description | admin | attorney | senior_paralegal | paralegal | intake_specialist | billing_clerk |
|---------------|-------------|:-----:|:--------:|:----------------:|:---------:|:-----------------:|:-------------:|
| `matter:create` | Create a new matter from a converted lead | x | x | x | | | |
| `matter:read` | View matter details (scoped to assigned matters for non-admin) | x | x | x | x | | |
| `matter:update` | Edit matter metadata (status, type, assigned staff) | x | x | x | | | |
| `matter:delete` | Soft-delete a matter | x | x | | | | |
| `matter:assign` | Assign/reassign staff to a matter | x | x | x | | | |
| `document:create` | Generate a document from a template | x | x | x | x | | |
| `document:read` | View documents on assigned matters | x | x | x | x | | |
| `document:update` | Edit document content or metadata | x | x | x | x | | |
| `document:approve` | Attorney approval of a document (requires `is_attorney` flag) | x | x | | | | |
| `document:delete` | Soft-delete a document | x | x | x | | | |
| `filing:assemble` | Create and manage filing packets | x | x | x | | | |
| `filing:submit` | Submit a filing packet to eFileTexas (requires attorney approval) | x | x | | | | |
| `filing:read` | View filing packet status and history | x | x | x | x | | |
| `lead:create` | Create a new lead | x | x | x | x | x | |
| `lead:read` | View lead details | x | x | x | x | x | |
| `lead:update` | Update lead status, notes, assignment | x | x | x | x | x | |
| `lead:convert` | Convert a lead into a matter | x | x | x | | | |
| `conflict:initiate` | Start a conflict check | x | x | x | x | x | |
| `conflict:clear` | Attorney clearance of a conflict check (requires `is_attorney`) | x | x | | | | |
| `calendar:create` | Create calendar events and deadlines | x | x | x | x | | |
| `calendar:read` | View calendar events on assigned matters | x | x | x | x | | |
| `discovery:manage` | Create and track discovery requests/responses | x | x | x | x | | |
| `financial:read` | View invoices, payments, trust balances | x | x | x | | | x |
| `financial:create` | Generate invoices, record payments | x | x | | | | x |
| `financial:approve` | Approve trust disbursements (requires `is_attorney`) | x | x | | | | |
| `portal:manage` | Grant/revoke client portal access | x | x | x | | | |
| `portal:view` | Client-side portal access (client role, not staff) | | | | | | |
| `user:manage` | Create, deactivate, assign roles to staff users | x | | | | | |
| `user:read` | View staff directory | x | x | x | x | x | x |
| `report:view` | Access dashboard and report views | x | x | x | | | x |
| `audit:read` | View audit log entries | x | x | | | | |
| `checklist:manage` | Create and modify checklist templates | x | x | x | | | |
| `note:create` | Add notes to matters | x | x | x | x | | |
| `note:read` | Read notes on assigned matters | x | x | x | x | | |
| `notification:manage` | Configure notification templates and preferences | x | | | | | |

#### Enforcement Architecture

```
Client Request
      |
      v
[Clerk Middleware] -- verifies JWT, extracts clerk_id
      |
      v
[tRPC Context] -- looks up internal user by clerk_id,
                   loads roles[] and permissions[] into ctx.user
      |
      v
[tRPC Procedure] -- calls requirePermission('matter:create')
      |              which checks ctx.user.permissions.includes('matter:create')
      |              throws TRPCError('FORBIDDEN') if denied
      |
      v
[Audit Middleware] -- logs { user_id, permission_key, resource_type,
                     resource_id, action, granted: boolean, ip, timestamp }
                     to audit_events table
      |
      v
[Business Logic] -- executes only after permission check passes
```

**Key enforcement rules:**

1. **All permission checks are server-side.** The frontend may hide UI elements based on the user's role for UX purposes, but the tRPC procedure always re-checks permissions. The client is never trusted.
2. **Attorney-gated actions have a double check.** Actions like `document:approve`, `conflict:clear`, and `financial:approve` require both the permission AND the `users.is_attorney` flag to be true. Having the permission without being a licensed attorney is insufficient.
3. **Matter-scoped access.** For roles below `admin`, `matter:read` and related permissions are scoped to matters where the user appears in `matter_assignments`. An attorney or admin can see all matters; a paralegal sees only their assigned matters.
4. **Client portal is a separate namespace.** Client portal users authenticate through a separate Clerk organization. Their JWT contains `org_type: 'portal'`, and the tRPC context enforces that portal users can only call portal-namespaced procedures. No staff procedure is callable from the portal context.
5. **All permission checks are logged.** Every call to `requirePermission()` writes to `audit_events` regardless of whether access was granted or denied. Denied access attempts are flagged for security review.

---

## Consequences

### Positive

1. **Separation of authentication and authorization** -- Clerk handles the complex, security-critical authentication flows (password hashing, MFA, session management) while the custom RBAC gives full control over domain-specific permission logic.
2. **Fine-grained permissions** -- the `resource:action` model allows precise control. A billing clerk can generate invoices but cannot view matter notes. A paralegal can draft documents but cannot approve them.
3. **Audit completeness** -- every permission check produces an audit record, providing a defensible log for regulatory inquiries and malpractice defense.
4. **Role composability** -- users can hold multiple roles. A user who is both `attorney` and `admin` gets the union of both permission sets without special-case logic.
5. **Portal isolation** -- the separate Clerk organization and namespace enforcement makes it architecturally impossible for a client portal bug to expose staff data.

### Negative

1. **Clerk dependency** -- authentication is coupled to a third-party SaaS. If Clerk has an outage, no one can log in. Mitigation: the `password_hash` column is retained for emergency fallback authentication via a local auth bypass (admin-only, requires server access).
2. **Webhook complexity** -- Clerk-to-internal-user sync relies on webhooks. If a webhook fails, the internal user record may be stale. Mitigation: idempotent webhook handler with retry queue; periodic reconciliation job compares Clerk users to internal `users` table.
3. **Permission explosion** -- with 30+ permissions and 6 roles, the `role_permissions` junction table has 100+ rows. Adding a new module means adding new permissions and updating every role. Mitigation: seed scripts manage the canonical permission set; a migration adds new permissions and grants them to appropriate roles atomically.
4. **Custom RBAC maintenance** -- unlike an off-the-shelf authorization service, the RBAC logic must be maintained and tested as part of the application. Mitigation: comprehensive unit tests for the permission checker; integration tests verify that each role can/cannot perform expected operations.

---

## Alternatives Considered

### NextAuth.js (Auth.js)

Open-source authentication library for Next.js with session and JWT support.

**Rejected because:**
- NextAuth provides authentication primitives but no built-in organization management, MFA enrollment UI, or user management dashboard. These would all need to be built from scratch.
- Session management and CSRF protection require careful implementation. Clerk handles these as managed infrastructure.
- NextAuth's adapter model would still require building the entire RBAC layer, so the authorization savings are zero.

### Keycloak

Self-hosted identity and access management with built-in RBAC, organization support, and admin console.

**Rejected because:**
- Keycloak is a Java application requiring its own JVM, database, and operational maintenance. For a small firm platform, this adds significant infrastructure burden.
- Keycloak's RBAC model is generic. Mapping legal domain concepts (attorney-gated approvals, matter-scoped access, client portal isolation) into Keycloak's realm/client/role model would require extensive customization that negates the benefit of using an off-the-shelf solution.
- The operational overhead of keeping Keycloak patched, backed up, and monitored exceeds the cost of Clerk's SaaS pricing for a sub-20-user deployment.

### Fully Custom Authentication (No External Provider)

Build password hashing (bcrypt), session management, CSRF tokens, MFA (TOTP), password reset flows, and brute-force protection in-house.

**Rejected because:**
- Authentication is a security-critical domain where subtle implementation bugs (timing attacks, session fixation, weak CSRF tokens) create real vulnerabilities. Using a battle-tested provider eliminates this class of risk.
- The `users.password_hash` and `users.mfa_secret` columns exist in the schema for fallback purposes, but routing all primary authentication through them would require building and maintaining every auth flow that Clerk provides out of the box.

---

## Implementation Notes

### Clerk Configuration

- **Staff Organization:** Single Clerk organization for all firm staff. Users are invited by admin and cannot self-register.
- **Portal Organization:** Separate Clerk organization for client portal users. Clients are invited per-matter by staff with `portal:manage` permission.
- **MFA Policy:** MFA is required for `admin` and `attorney` roles. Optional but encouraged for other staff roles. Enforced via Clerk organization settings.
- **Session Duration:** Staff sessions expire after 8 hours of inactivity (business day). Portal sessions expire after 30 minutes of inactivity.
- **JWT Claims:** Custom claims added via Clerk session webhook:
  ```json
  {
    "internal_user_id": "uuid",
    "roles": ["attorney", "admin"],
    "permissions": ["matter:create", "matter:read", "document:approve", "..."],
    "org_type": "staff",
    "is_attorney": true
  }
  ```

### RBAC Seed Script

The seed script in `database/seeds/` creates the canonical roles and permissions:

```typescript
// Pseudocode for seed structure
const ROLES = ['admin', 'attorney', 'senior_paralegal', 'paralegal', 'intake_specialist', 'billing_clerk'];

const PERMISSION_GRANTS: Record<string, string[]> = {
  'admin': ['*'],  // Expanded to all permissions at seed time
  'attorney': ['matter:*', 'document:*', 'filing:*', 'lead:*', 'conflict:*', 'calendar:*', 'discovery:*', 'financial:read', 'financial:approve', 'portal:manage', 'user:read', 'report:view', 'audit:read', 'checklist:manage', 'note:*'],
  'senior_paralegal': ['matter:create', 'matter:read', 'matter:update', 'matter:assign', 'document:create', 'document:read', 'document:update', 'document:delete', 'filing:assemble', 'filing:read', 'lead:*', 'conflict:initiate', 'calendar:*', 'discovery:manage', 'financial:read', 'portal:manage', 'user:read', 'report:view', 'checklist:manage', 'note:*'],
  'paralegal': ['matter:read', 'document:create', 'document:read', 'document:update', 'filing:read', 'lead:create', 'lead:read', 'lead:update', 'conflict:initiate', 'calendar:*', 'discovery:manage', 'user:read', 'note:*'],
  'intake_specialist': ['lead:*', 'conflict:initiate', 'user:read'],
  'billing_clerk': ['financial:read', 'financial:create', 'user:read', 'report:view'],
};
```

### tRPC Permission Middleware

```typescript
// packages/auth/src/middleware.ts
export function requirePermission(...keys: PermissionKey[]) {
  return middleware(async ({ ctx, next }) => {
    const { user } = ctx;
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const granted = keys.every(key => user.permissions.includes(key));

    // Always log the check
    await ctx.audit.log({
      userId: user.id,
      permissionKeys: keys,
      granted,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    if (!granted) throw new TRPCError({ code: 'FORBIDDEN' });

    return next({ ctx });
  });
}

export function requireAttorney() {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user?.isAttorney) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This action requires a licensed attorney.',
      });
    }
    return next({ ctx });
  });
}
```

### Client Portal Isolation

The client portal tRPC router is a completely separate router definition from the staff router. It shares no procedures. The portal context always scopes queries to the authenticated client's `contact_id`, ensuring that:

- `portal.getMyMatters()` returns only matters where the client is a linked contact with portal access.
- `portal.getMyDocuments()` returns only documents explicitly shared via `portal_shared_documents`.
- `portal.sendMessage()` creates a `portal_messages` record visible to staff on the matter but does not expose staff-to-staff notes.

No staff procedure is importable from the portal router. This is enforced by ESLint import boundaries and verified in CI.
