# Recovery Audit -- Ttaylor Family Law Paralegal Platform

**Date**: 2026-04-21
**Scope**: Full codebase audit of frontend-backend integration, API wiring, placeholder inventory
**Verdict**: Strong architecture and backend; zero frontend API wiring; 52 TODOs; 30 no-op handlers

---

## Executive Summary

The Ttaylor platform has a complete backend (tRPC routers, workflow packages, Prisma schema, database seeds) and a complete frontend shell (all pages, components, navigation structure). However, the two halves are not connected. Every frontend page uses placeholder empty arrays and hardcoded zeros instead of real API calls. No tRPC provider is configured in the app layout, meaning even if individual pages added `trpc.X.useQuery()` calls, they would fail at runtime.

The backend is production-quality: 11 tRPC routers with proper role gates, audit logging, input validation, and cursor-based pagination. The workflow packages (`@ttaylor/workflows`, `@ttaylor/documents`, `@ttaylor/auth`, `@ttaylor/domain`, `@ttaylor/ui`) are complete and well-tested (153 unit tests). The Prisma schema covers 40 tables with proper relations, indexes, and constraints.

The gap is entirely in the integration layer: frontend pages need real data hooks, the tRPC provider needs to be wired into the layout, and navigation handlers need to use `router.push` instead of `console.log`.

---

## What Is Complete

### Backend (tRPC API)

All 11 routers are implemented with full CRUD, role-based access control, audit event emission, and input validation:

| Router | Procedures | Role Gates | Audit Events |
|--------|-----------|------------|--------------|
| `matters` | 6 | Yes | Yes |
| `documents` | 6 | Yes | Yes |
| `intake` | 5 | Yes | Yes |
| `checklists` | 4 | Yes | Yes |
| `calendar` | 4 | Yes | Yes |
| `contacts` | 5 | Yes | Yes |
| `filing` | 9 | Yes | Yes |
| `discovery` | 5 | Yes | Yes |
| `financial` | 5 | Yes | Yes |
| `orders` | 5 | Yes | Yes |
| `audit` | 3 | Yes | N/A |

### Workflow Packages

| Package | Status | Contents |
|---------|--------|----------|
| `@ttaylor/workflows` | Complete | Matter state machine (14 statuses), checklist engine, deadline calculator |
| `@ttaylor/documents` | Complete | Template engine (Handlebars), document lifecycle (10-state machine), 21 merge fields |
| `@ttaylor/auth` | Complete | Role definitions, permission matrix, Clerk integration types |
| `@ttaylor/domain` | Complete | Shared enums, types, constants |
| `@ttaylor/ui` | Complete | Design system components (Button, Card, Badge, DataTable, Dialog, Input) |

### Database

| Item | Status |
|------|--------|
| Prisma schema | 40 tables, fully relational |
| Seed data | Complete (matters, users, contacts, documents) |
| Migrations | Generated |

### Operations

| Item | Status |
|------|--------|
| Docker Compose | Complete (API, Postgres, Redis, BullMQ) |
| Deployment runbook | Complete |
| Backup/recovery runbook | Complete |
| Governance docs | Complete (PROJECT_CHARTER, TEAM_CHARTER, RISKS, ASSUMPTIONS, DECISIONS) |

### Tests

| Type | Count | Status |
|------|-------|--------|
| Unit tests | 153 | Written, covering all 5 workflow/document modules |
| Integration tests | 12 | Written with mocked Prisma (not real DB) |
| E2E tests | 4 scenarios | Written in Playwright, not runnable without running app |

---

## What Is Incomplete

### 1. No tRPC Provider in Frontend Layout

`apps/staff-web/src/app/layout.tsx` does not wrap children in a TanStack Query provider or tRPC provider. Without this, no page can call `trpc.X.useQuery()` or `trpc.X.useMutation()`. This is the single biggest blocker.

### 2. Every Frontend Page Uses Placeholder Data

All 13 staff-web pages and 3 client-portal pages use:
- Empty arrays (`[]`) instead of `trpc.X.useQuery()` calls
- Hardcoded `0` instead of computed counts
- `console.log('navigate to ...')` instead of `router.push()`
- No-op button handlers (`onClick={() => {}}` or `onClick={() => console.log()}`)
- Stub data hooks (matter detail page)

### 3. State Machine Divergence

`services/api/src/routers/matters.ts` defines a `VALID_TRANSITIONS` map using status strings (`'LEAD_PENDING'`, `'CONFLICT_REVIEW'`, `'OPEN_ACTIVE'`) that do not exist in the `MatterStatus` enum. The `@ttaylor/workflows` package uses the correct enum values (`LEAD`, `INTAKE`, `CONFLICT_CHECK`, etc.). The router's state machine is non-functional.

### 4. BullMQ Stubs

Two operations that should be async background jobs are implemented as synchronous stubs:
- **Document generation**: Documents router marks document as `GENERATED` immediately instead of dispatching a BullMQ job
- **Filing submission**: Filing router marks submission as complete without dispatching to eFileTexas

### 5. Client Portal Hardcoded Data

The client portal matter detail page displays hardcoded "Jane Smith" and "Divorce" instead of fetching real matter data.

---

## Critical Issues (Ranked)

| # | Issue | Impact | Severity |
|---|-------|--------|----------|
| 1 | No tRPC hooks anywhere in frontend | All pages show empty state | Critical |
| 2 | No tRPC provider in layout | Even if hooks added, they would crash | Critical |
| 3 | State machine enum mismatch | `matters.updateStatus` is broken | High |
| 4 | Hardcoded "Jane Smith" in client portal | Client-facing data is fake | High |
| 5 | BullMQ stubs (document generation) | Documents appear instant, no real processing | Medium |
| 6 | BullMQ stubs (filing submission) | Filing appears instant, no court integration | Medium |
| 7 | No global search endpoint | Search UI has nothing to call | Low |
| 8 | No notification delivery system | Filing and compliance alerts go nowhere | Low |

---

## Files Audited

### Staff Web (apps/staff-web/)
- `src/app/layout.tsx` -- missing tRPC provider
- `src/app/(dashboard)/page.tsx` -- dashboard, hardcoded 0s
- `src/app/(dashboard)/matters/page.tsx` -- empty array, console.log nav
- `src/app/(dashboard)/matters/[id]/page.tsx` -- stub data hook
- `src/app/(dashboard)/contacts/page.tsx` -- empty array
- `src/app/(dashboard)/calendar/page.tsx` -- empty arrays
- `src/app/(dashboard)/filing/page.tsx` -- empty array
- `src/app/(dashboard)/filing/[id]/page.tsx` -- always null
- `src/app/(dashboard)/discovery/page.tsx` -- empty array
- `src/app/(dashboard)/financial/page.tsx` -- empty array, hardcoded 0s
- `src/app/(dashboard)/reports/page.tsx` -- console.log run button

### Client Portal (apps/client-portal/)
- `src/app/(portal)/page.tsx` -- empty array
- `src/app/(portal)/matters/[id]/page.tsx` -- hardcoded "Jane Smith"/"Divorce"
- `src/app/(portal)/messages/page.tsx` -- empty array

### API (services/api/)
- `src/routers/matters.ts` -- state machine divergence
- `src/routers/documents.ts` -- BullMQ generation stub
- `src/routers/filing.ts` -- BullMQ submission stub, missing notification

---

## Conclusion

The platform architecture is sound. The backend API is complete. The frontend UI structure is complete. The only work remaining is integration -- wiring the frontend to the backend -- plus fixing the state machine divergence and adding the tRPC provider. This is a wiring problem, not a design problem.
