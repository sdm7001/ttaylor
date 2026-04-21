# ADR-002: Authentication and Role-Based Access Control

**Status**: Accepted
**Date**: 2026-04-20
**Decision Makers**: Architecture team
**Supersedes**: None
**Related**: ADR-001 (System Topology)

---

## Context

The platform handles confidential legal data including attorney-client privileged communications, sealed court records, financial trust accounts, protective order details, and Address Confidentiality Program (ACP) participant information. Unauthorized access to this data could result in:

- **Disciplinary action** against attorneys (Texas Disciplinary Rules of Professional Conduct Rule 1.05)
- **Criminal liability** for ACP address disclosure (Texas Code of Criminal Procedure Chapter 56B)
- **Malpractice claims** from confidentiality breaches
- **Loss of attorney-client privilege** for inadequately protected communications

The platform serves two fundamentally different user populations:

1. **Staff users** — Attorneys, paralegals, legal assistants, receptionists, and administrators who work within the firm and need varying levels of access to all matters and system functions.
2. **Portal clients** — Clients of the firm who need limited, read-mostly access to their own matters through a self-service portal.

These populations have completely different security profiles, access patterns, trust levels, and risk tolerances.

### Options Considered

**Option A: Unified auth system for both populations**
- Single authentication provider, single session model, role-based differentiation.
- Pros: Simpler implementation, single identity provider.
- Cons: Shared attack surface. A vulnerability in the portal auth could escalate to staff functions. Portal users exist in a lower-trust environment (public internet, unmanaged devices) and should not share authentication infrastructure with staff users who access privileged data.

**Option B: Separate auth systems with shared identity store**
- Two authentication pathways (staff and portal) with independent session models, both backed by a shared user/contact database.
- Pros: Clean security boundary. Portal compromise cannot escalate to staff access. Each system can be hardened independently. Session models can differ (long-lived staff sessions with MFA vs. short-lived portal tokens).
- Cons: More implementation complexity. Must maintain two auth flows.

---

## Decision

**Separate authentication systems for staff and portal users, with distinct session models and security requirements.**

### Staff Authentication

- **Method**: Session-based authentication with server-side session storage (Redis-backed).
- **MFA**: Mandatory for all staff users. TOTP (authenticator app) as primary method; WebAuthn/FIDO2 as recommended method for attorneys. No SMS-based MFA (SIM swap vulnerability unacceptable for legal data).
- **Session duration**: 8-hour maximum session lifetime. 30-minute idle timeout. Re-authentication required for sensitive operations (financial transactions, filing submissions, matter access changes).
- **Password requirements**: Minimum 12 characters, checked against breached password databases (Have I Been Pwned API), no composition rules (per NIST 800-63B).
- **Login controls**: Account lockout after 5 failed attempts (30-minute lockout). IP-based rate limiting. Login anomaly detection (new device, unusual location, unusual time).
- **Session storage**: Server-side sessions stored in Redis with encryption at rest. Session ID transmitted via HttpOnly, Secure, SameSite=Strict cookie. No session data in client-accessible storage.

### Portal Authentication

- **Method**: Token-based authentication with short-lived JWTs.
- **Access tokens**: 15-minute expiration. Signed with RS256. Contains minimal claims (user ID, matter IDs, role).
- **Refresh tokens**: 7-day expiration. Stored server-side with device binding. Rotated on each use (refresh token rotation). Revocable by staff.
- **Initial access**: Client receives a secure invitation link (single-use, 72-hour expiration) to set up their portal account. Link sent to verified email or delivered in person.
- **MFA**: Optional but encouraged. Offered during setup. Not mandatory because portal access is inherently limited in scope.
- **Scope**: Portal tokens grant access only to the specific matters the client is a party to. No cross-matter visibility. No access to staff functions, other clients' data, or system configuration.

---

## RBAC Model

### Role Definitions

| Role | Description | Population | License Count |
|------|-------------|-----------|---------------|
| **Attorney** | Licensed attorney at the firm. Full access to matters they are assigned to. Can approve documents, authorize filings, and manage client relationships. | Staff | Per-attorney |
| **Paralegal** | Paralegal performing substantive legal work under attorney supervision. Can draft documents, manage workflows, communicate with clients, and prepare filings. Cannot approve filings or provide legal advice. | Staff | Per-seat |
| **Legal Assistant** | Administrative support staff. Can manage calendars, handle correspondence, update contact information, and perform data entry. Cannot draft legal documents or access financial trust data. | Staff | Per-seat |
| **Receptionist** | Front desk / intake staff. Can create leads, schedule consultations, and access basic contact information. Cannot access matter details, documents, or financial data. | Staff | Per-seat |
| **Admin** | System administrator. Can manage users, roles, system configuration, and audit logs. Does not automatically have access to matter content (must be separately granted). | Staff | Limited |
| **Portal Client** | Client of the firm accessing the self-service portal. Can view their own matter status, access shared documents, send messages to their attorney/paralegal, and view billing statements. | Portal | Unlimited |

### Permission Model

Permissions follow a **resource + action** pattern. Each permission grants the ability to perform a specific action on a specific resource type.

#### Core Permissions

| Permission | Description | Attorney | Paralegal | Legal Asst | Reception | Admin |
|-----------|-------------|----------|-----------|------------|-----------|-------|
| `matters:read` | View matter details and status | Yes | Yes | Yes (limited) | No | Audit only |
| `matters:write` | Create and update matters | Yes | Yes | No | No | No |
| `matters:assign` | Assign staff to matters | Yes | No | No | No | Yes |
| `contacts:read` | View contact records | Yes | Yes | Yes | Yes (basic) | No |
| `contacts:write` | Create and update contacts | Yes | Yes | Yes | Yes (leads only) | No |
| `documents:read` | View documents | Yes | Yes | No | No | No |
| `documents:write` | Create and edit documents | Yes | Yes | No | No | No |
| `documents:attorney_review` | Approve documents for filing | Yes | No | No | No | No |
| `filing_packets:read` | View filing packets | Yes | Yes | No | No | No |
| `filing_packets:write` | Create and edit filing packets | Yes | Yes | No | No | No |
| `filing_packets:approve` | Authorize filing submission | Yes | No | No | No | No |
| `calendar:read` | View calendar events | Yes | Yes | Yes | Yes (own) | No |
| `calendar:write` | Create and update events | Yes | Yes | Yes | Yes (consult only) | No |
| `discovery:read` | View discovery items | Yes | Yes | No | No | No |
| `discovery:write` | Manage discovery workflow | Yes | Yes | No | No | No |
| `financial:read` | View billing and trust data | Yes | Yes (billing only) | No | No | No |
| `financial:write` | Create invoices, record payments | Yes | Yes (time entry only) | No | No | No |
| `financial:trust` | Manage IOLTA trust transactions | Yes | No | No | No | No |
| `leads:read` | View leads | Yes | Yes | Yes | Yes | No |
| `leads:write` | Create and update leads | Yes | Yes | Yes | Yes | No |
| `conflict:check` | Run conflict checks | Yes | Yes | No | No | No |
| `conflict:resolve` | Resolve flagged conflicts | Yes | No | No | No | No |
| `users:read` | View user accounts | No | No | No | No | Yes |
| `users:write` | Manage user accounts and roles | No | No | No | No | Yes |
| `audit:read` | View audit logs | Yes | No | No | No | Yes |
| `system:config` | Modify system configuration | No | No | No | No | Yes |

#### Portal Client Permissions

Portal clients have a separate, minimal permission set:

| Permission | Description |
|-----------|-------------|
| `portal:matters:read` | View status and summary of own matters only |
| `portal:documents:read` | View documents explicitly shared by staff |
| `portal:messages:read` | Read messages from attorney/paralegal |
| `portal:messages:write` | Send messages to attorney/paralegal |
| `portal:billing:read` | View own invoices and payment status |
| `portal:billing:pay` | Make payments on outstanding invoices |
| `portal:profile:write` | Update own contact information |

---

## Matter-Level Access Restrictions

Beyond role-based permissions, the platform enforces **matter-level visibility restrictions** for sensitive case types:

### Restriction Levels

| Level | Trigger | Effect |
|-------|---------|--------|
| **Standard** | Default for all matters | Visible to all staff with appropriate role permissions |
| **Restricted** | Attorney marks matter as restricted | Visible only to staff explicitly assigned to the matter. Other staff with the same role cannot see the matter in search results, dashboards, or reports. |
| **ACP Protected** | Party enrolled in Address Confidentiality Program | All standard restrictions plus: actual physical address suppressed from all views and documents; only ACP substitute address displayed; address fields encrypted with separate key; audit logging on any address field access. |
| **Sealed** | Court order sealing records | All restricted protections plus: matter does not appear in any reports or aggregate statistics; access logged and reviewed monthly; export/print disabled except by attorney. |
| **Juvenile** | Matter involves juvenile records | All restricted protections plus: compliance with Texas Family Code confidentiality requirements for juvenile proceedings; name redaction in any cross-matter context. |

### Enforcement

Matter-level restrictions are enforced at the database query level using PostgreSQL row-level security policies, not just at the application layer. This provides defense in depth — even if an application-level access check is bypassed, the database will not return restricted rows to unauthorized sessions.

The identity module exposes a `getAccessibleMatterIds(userId)` function that returns the set of matter IDs visible to a given user, accounting for both their role and any matter-level restrictions. All other modules use this function as a filter on all matter-related queries.

---

## Rationale

### Why separate auth systems?

The primary driver is **blast radius containment**. Portal clients access the system from unmanaged devices over the public internet. If a portal authentication vulnerability is exploited, the attacker gains access to a single client's limited portal view — not to staff functions, other clients' data, or privileged legal information.

A unified auth system would mean a single session hijacking vulnerability could potentially escalate from portal access to full staff access. The legal and professional consequences of such a breach are severe enough to justify the additional implementation complexity of separation.

### Why session-based for staff and token-based for portal?

Staff users work in long sessions on managed devices. Session-based auth with server-side storage provides: immediate revocation capability (critical when an employee is terminated), no client-side token storage to steal, and simpler MFA re-verification for sensitive operations.

Portal clients access the system intermittently from mobile devices and browsers. Token-based auth with short-lived access tokens provides: stateless API access (portal is a lighter-weight SPA), automatic expiration without server-side cleanup, and device-bound refresh tokens for reasonable session continuity without long-lived server sessions.

### Why mandatory MFA for staff?

Legal data confidentiality is a professional obligation, not just a best practice. A single compromised staff credential could expose privileged communications for every matter in the system. MFA is the single most effective control against credential-based attacks. There is no acceptable tradeoff between convenience and the risk of a privileged data breach.

### Why RBAC maps to law office roles?

The role model directly maps to how law offices actually operate. Attorneys have professional obligations (document approval, filing authorization) that cannot be delegated. Paralegals perform substantive work under attorney supervision. Legal assistants handle administrative tasks. Receptionists manage intake. This is not an arbitrary hierarchy — it reflects legal and ethical requirements of law practice.

---

## Consequences

### Positive
- **Defense in depth** — Multiple layers of access control (auth separation, RBAC, matter-level restrictions, database RLS) means no single failure exposes the full system.
- **Clear audit trail** — Every access decision is logged with actor, resource, action, and result. Supports compliance and malpractice defense.
- **Role clarity** — Staff understand what they can and cannot do based on their familiar office role, not abstract permission names.
- **ACP compliance** — Address suppression is built into the access control model, not bolted on as an afterthought.

### Negative
- **Implementation complexity** — Two auth systems require more code, more testing, and more security review than a single system.
- **User management overhead** — Admin must manage staff accounts and portal invitations through different interfaces.
- **MFA friction** — Mandatory MFA adds friction to staff login. Must invest in good UX (remember device for 30 days, WebAuthn for low-friction MFA).
- **Permission granularity** — 30+ permissions across 6 roles requires careful testing of every role-permission combination. Must have comprehensive permission integration tests.

### Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Staff shares credentials to bypass MFA | Audit logging of login anomalies (multiple concurrent sessions, unusual IP); periodic access reviews |
| Portal invitation link intercepted | Single-use links with 72-hour expiration; email verification; option for in-person delivery of access credentials |
| Role creep (permissions gradually added) | Quarterly access reviews; principle of least privilege enforced by default; permission changes require Admin role and are audit logged |
| ACP address leakage through reporting or exports | Address fields excluded from all aggregate queries; export functions check ACP status; dedicated integration tests for ACP suppression |

---

## Implementation Notes

### Session Storage Schema (Redis)

```
session:{sessionId} → {
  userId: string,
  role: Role,
  mfaVerified: boolean,
  mfaVerifiedAt: timestamp,
  accessibleMatterIds: string[], // cached, refreshed on matter assignment change
  ipAddress: string,
  userAgent: string,
  createdAt: timestamp,
  lastActivityAt: timestamp
}
```

### Permission Check Pattern

```typescript
// All permission checks go through the identity module's service interface
interface IdentityService {
  checkPermission(userId: string, permission: string, resourceId?: string): Promise<boolean>;
  getAccessibleMatterIds(userId: string): Promise<string[]>;
  requirePermission(userId: string, permission: string, resourceId?: string): Promise<void>; // throws if denied
}
```

### Database Row-Level Security

```sql
-- Example RLS policy for matters table
CREATE POLICY matter_access_policy ON matters
  USING (
    id IN (
      SELECT matter_id FROM matter_assignments
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
    OR
    restriction_level = 'standard'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = current_setting('app.current_user_id')::uuid
      AND role IN ('attorney', 'paralegal', 'legal_assistant')
    )
  );
```

---

## References

- Texas Disciplinary Rules of Professional Conduct, Rules 1.05, 1.06
- Texas Code of Criminal Procedure, Chapter 56B (Address Confidentiality Program)
- NIST Special Publication 800-63B (Digital Identity Guidelines — Authentication)
- OWASP Authentication Cheat Sheet
- ADR-001: System Topology
- ADR-003: Document Automation and Filing Workflow
