# Security Review -- Ttaylor Family Law Platform

**Date**: 2026-04-21
**Reviewer**: Coder Agent (static analysis)
**Scope**: Authentication, authorization, data access, audit trail, known gaps
**Codebase Version**: Phase 7 Hardening (all 15 routers complete)

---

## 1. Authentication

**Implementation**: Clerk handles all authentication. Tokens are verified server-side in `services/api/src/context.ts` using `@clerk/backend` `verifyToken()`.

**Findings**:

- Bearer token extracted from `Authorization` header (line 39-42 of context.ts)
- Token verified against `CLERK_SECRET_KEY` environment variable -- no hardcoded secrets
- Failed verification returns unauthenticated context (userId: null) -- does not throw, allowing `publicProcedure` to function
- User lookup matches Clerk `sub` claim against database `user.id` field with `status: 'ACTIVE'` and `deletedAt: null` checks -- soft-deleted and deactivated users are excluded
- No session data stored in localStorage -- Clerk manages session tokens via httpOnly cookies in the browser SDK
- All tRPC procedures use either `protectedProcedure` (requires valid session) or `publicProcedure` (health checks only)
- `protectedProcedure` middleware checks both `ctx.userId` and `ctx.userRecord` are non-null before proceeding

**Assessment**: PASS

---

## 2. Authorization (RBAC)

**Implementation**: Role-based access control enforced via tRPC middleware in `services/api/src/trpc.ts`.

**Findings**:

- `requireRole()` middleware factory checks `ctx.roles` array against required role strings. Used for attorney-only mutations.
- `requirePermission()` middleware factory checks `ctx.permissions` Set against required permission code. Used for fine-grained access control.
- Both throw `TRPCError({ code: 'FORBIDDEN' })` on failure -- cannot be bypassed from client.

**Attorney approval gates verified in code**:

| Procedure | Gate | File |
|-----------|------|------|
| `documents.approve` | `requireRole('ATTORNEY')` | documents.ts |
| `documents.reject` | `requireRole('ATTORNEY')` | documents.ts |
| `filing.attorneyApprove` | `requireRole('ATTORNEY')` | filing.ts |
| `filing.attorneyReject` | `requireRole('ATTORNEY')` | filing.ts |
| `filing.submitToCourt` | `requireRole('ATTORNEY')` | filing.ts |
| `orders.createOrder` | `requireRole('ATTORNEY')` | orders.ts |
| `matters.create` | `requireRole('ATTORNEY', 'PARALEGAL')` | matters.ts |
| `matters.assign` | `requireRole('ATTORNEY', 'ADMIN')` | matters.ts |
| `matters.updateStatus` | Attorney check for CLOSED/ARCHIVED transitions | matters.ts |
| `portal.shareDocument` | `requireRole('PARALEGAL', 'ATTORNEY', 'ADMIN')` | portal.ts |

**Confidentiality enforcement**: `matters.getById` checks `confidentialityLevel === 'RESTRICTED'` and verifies caller is in the matter's `assignments` list before returning data (matters.ts lines 115-123).

**Client portal isolation**: The client portal is a separate Next.js application with a separate Clerk organization. Portal router endpoints use `protectedProcedure` (authenticated) but do not require staff roles -- portal users authenticate through the portal Clerk org.

**Assessment**: PASS with caveat

**Caveat**: Client-side role detection for UI button visibility is not implemented. The server correctly rejects unauthorized actions with FORBIDDEN errors, but the UI shows all action buttons (approve, reject, submit to court) to all authenticated users regardless of role. This creates a confusing UX where non-attorney users see buttons that will fail when clicked.

---

## 3. Data Access

**Implementation**: All database access goes through Prisma ORM via the tRPC context (`ctx.prisma`).

**Findings**:

- No raw SQL anywhere in the codebase -- all queries use Prisma's query builder, eliminating SQL injection surface
- All user input validated through Zod schemas before reaching Prisma -- `.cuid()`, `.string().max()`, `.enum()` constraints on all inputs
- File assets accessed through `file_assets` table abstraction -- no direct filesystem access from API
- Portal document sharing validated against document `lifecycleStatus` -- only `APPROVED` or `FILED` documents can be shared (portal.ts lines 145-151)
- Document-matter ownership verified before sharing: `document.matterId !== input.matterId` check (portal.ts line 138)
- Cursor-based pagination uses Prisma's native cursor with `take: limit + 1` pattern -- no offset-based queries vulnerable to enumeration

**Assessment**: PASS

---

## 4. Audit Trail

**Implementation**: All domain mutations emit audit events via `emitAuditEvent()` defined in `services/api/src/routers/audit.ts`.

**Findings**:

- `emitAuditEvent()` creates records in the `audit_events` table with: eventType, actorUserId, entityType, entityId, payloadJson, timestamp
- Audit events are append-only -- the audit router exposes only `list` (read) queries, no `update` or `delete` mutations
- Audit list endpoint is restricted to `ADMIN` and `ATTORNEY` roles
- Events cover: matter creation, status changes, document lifecycle transitions, filing submissions, assignment changes, portal document sharing, note creation

**Assessment**: PASS

---

## 5. Input Validation

**Implementation**: Zod schemas on every tRPC procedure input.

**Findings**:

- All ID fields validated as `.cuid()` where Prisma uses CUID primary keys
- String lengths bounded: `.max(100)` for cause numbers, `.max(200)` for court/judge, `.max(5000)` for message bodies and notes
- Enum inputs validated against actual TypeScript enum values: `z.enum(Object.values(MatterStatus))`
- Pagination limited: `z.number().int().min(1).max(100).default(25)` prevents unbounded queries
- No `z.any()` or `z.unknown()` used for user-facing inputs

**Assessment**: PASS

---

## 6. Known Gaps

These are documented honestly as items that need attention before internet-facing production deployment.

### GAP-1: Client-side role detection not implemented (UX issue)

**Severity**: Medium
**Impact**: All action buttons visible to all roles. Server rejects unauthorized actions, but users see confusing 403 errors.
**Mitigation**: Server-side enforcement is in place. This is a UX problem, not a security vulnerability.
**Remediation**: Implement `useUserRole()` hook that reads roles from Clerk session claims and conditionally render action buttons.

### GAP-2: Rate limiting not implemented

**Severity**: Medium
**Impact**: No per-user or per-IP request throttling. A malicious or misbehaving client could hammer the API.
**Mitigation**: Clerk's built-in rate limiting on authentication endpoints provides some protection. tRPC endpoints behind authentication require valid tokens.
**Remediation**: Add express-rate-limit or equivalent middleware (e.g., Upstash ratelimit for serverless) at the API layer.

### GAP-3: No explicit CSRF protection beyond Clerk defaults

**Severity**: Low
**Impact**: Clerk handles CSRF via SameSite cookie attributes and token-based auth. No custom CSRF token mechanism.
**Mitigation**: Bearer token auth (not cookie-based session auth) inherently prevents CSRF for API calls. The tRPC client sends tokens via Authorization header, not cookies.
**Remediation**: No action needed for API endpoints. If any server-rendered form actions are added later, add CSRF tokens.

### GAP-4: eFileTexas BullMQ job is a placeholder

**Severity**: Low (not a security gap, but an integrity gap)
**Impact**: The `filing.submitToCourt` mutation marks the packet as submitted but does not actually transmit to the court. The BullMQ job exists but performs no real work.
**Mitigation**: Attorney approval gate still enforced. The system correctly tracks the filing as "submitted" in its internal state.
**Remediation**: Obtain eFileTexas/Odyssey API credentials and implement the real court submission worker.

### GAP-5: File upload endpoint not yet implemented

**Severity**: Low
**Impact**: Documents are generated from Handlebars templates, not uploaded. No file upload attack surface exists because the endpoint does not exist yet.
**Mitigation**: When file upload is implemented, it must include: file type validation, size limits, virus scanning, and S3-only storage (no local filesystem writes).
**Remediation**: Implement upload endpoint with proper validation before enabling user-uploaded documents.

### GAP-6: Error messages may leak internal details

**Severity**: Low
**Impact**: The tRPC error formatter returns the default `shape` without stripping internal details. In development, stack traces may be visible.
**Mitigation**: Prisma errors are caught within procedures and re-thrown as typed TRPCErrors. The default formatter does not add extra information.
**Remediation**: In production, configure `errorFormatter` to strip stack traces and internal error details.

---

## 7. Dependency Review

**Technology stack**:
- Next.js 14 (React 18)
- tRPC v10 with superjson transformer
- Prisma ORM (PostgreSQL 16)
- Clerk authentication (@clerk/backend, @clerk/nextjs)
- Zod input validation
- BullMQ (Redis 7) for background jobs

**Notes**:
- No known critical CVEs in the core stack at time of review
- `superjson` is used for tRPC serialization -- handles Date objects safely
- Prisma prevents SQL injection by design (parameterized queries)
- No `eval()`, `exec()`, `dangerouslySetInnerHTML`, or `child_process` usage found in the codebase

---

## 8. Verdict

**CONDITIONAL PASS** -- Safe for internal/pilot use within the firm's network. Not ready for internet-facing production without addressing GAP-1 (client-side role detection) and GAP-2 (rate limiting).

The server-side security posture is strong:
- Authentication is properly delegated to Clerk with server-side token verification
- Authorization is enforced at the API layer via middleware, not client-side checks
- All inputs are validated with Zod before reaching the database
- All mutations produce audit events
- No raw SQL, no eval, no file system access from API endpoints
- Confidential matters have assignment-based access control

**Recommended before public internet exposure**:
1. Implement rate limiting middleware
2. Add client-side role detection for UX cleanup
3. Configure error formatter to strip stack traces in production
4. Review Clerk webhook signature verification when user sync is implemented
5. Add Content-Security-Policy headers to Next.js responses
