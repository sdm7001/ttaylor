# Recovery Plan -- Ttaylor Platform

**Date**: 2026-04-21
**Approach**: Priority-phased wiring of frontend to existing backend API

---

## Priority 0 -- Immediate (Unblocks Everything)

These items must be completed first. All subsequent work depends on them.

### 0.1 Add tRPC Provider to Staff Web Layout

- Create `apps/staff-web/src/lib/trpc.ts` with typed tRPC client initialization
- Create `apps/staff-web/src/providers/TrpcProvider.tsx` (`'use client'` component wrapping QueryClientProvider + trpc.Provider)
- Update `apps/staff-web/src/app/layout.tsx` to wrap `{children}` in `<TrpcProvider>`
- Verify: app loads without runtime errors; React DevTools show QueryClient context

### 0.2 Fix State Machine Divergence in Matters Router

- Delete inline `VALID_TRANSITIONS` map from `services/api/src/routers/matters.ts`
- Import `validateMatterTransition` from `@ttaylor/workflows`
- Replace transition validation in `updateStatus` procedure
- Verify: unit test for matters router passes with correct enum values; `validateMatterTransition('LEAD', 'INTAKE', 'PARALEGAL')` returns `true`

### 0.3 Wire Dashboard Metrics to Real API Queries

- Replace hardcoded `0` values in `apps/staff-web/src/app/(dashboard)/page.tsx`
- Add `trpc.matters.list.useQuery()` for active matter count
- Add `trpc.filing.listPackets.useQuery()` for pending filing count
- Add `trpc.calendar.getUpcoming.useQuery()` for deadline count
- Add `trpc.audit.listEvents.useQuery()` for activity feed
- Verify: dashboard shows non-zero counts when seeded data is present

### 0.4 Wire Matters List to Real API

- Replace empty array in `apps/staff-web/src/app/(dashboard)/matters/page.tsx` with `trpc.matters.list.useQuery()`
- Add `useRouter` from `next/navigation`
- Replace `console.log('navigate to', id)` with `router.push(\`/matters/\${id}\`)`
- Wire filter buttons to query parameters
- Verify: matters list shows seeded matters; clicking a row navigates to `/matters/[id]`

### 0.5 Wire Matter Detail Page

- Replace stub data hook in `apps/staff-web/src/app/(dashboard)/matters/[id]/page.tsx` with `trpc.matters.getById.useQuery({ id })`
- Add loading and error states
- Verify: navigating to `/matters/[id]` shows real matter data from database

---

## Priority 1 -- Core Operating Loop

These complete the daily workflow for a paralegal managing matters.

### 1.1 Wire Matter Detail Tabs

For each tab in the matter detail page:
- **Parties tab**: `trpc.contacts.list.useQuery({ matterId })` + Add Party mutation
- **Documents tab**: `trpc.documents.listForMatter.useQuery({ matterId })` + Upload/Generate mutations
- **Checklist tab**: `trpc.checklists.getForMatter.useQuery({ matterId })` + Complete/Waive mutations
- **Calendar tab**: `trpc.calendar.listEvents.useQuery({ matterId })` + Add Event/Deadline mutations
- **Financial tab**: `trpc.financial.getMatterSummary.useQuery({ matterId })` + Create Invoice mutation
- **Filing tab**: `trpc.filing.listPackets.useQuery({ matterId })` + Create Packet mutation

Verify: each tab shows real data; mutations trigger optimistic updates or refetches.

### 1.2 Wire Contacts List and Navigation

- Replace empty array with `trpc.contacts.list.useQuery({ search })`
- Wire search input to query parameter
- Replace `console.log` with `router.push`
- Verify: contacts page shows seeded contacts; search filters results

### 1.3 Wire Calendar Page

- Replace empty arrays with `trpc.calendar.getUpcoming.useQuery()` and `trpc.calendar.listEvents.useQuery()`
- Wire Add Event and Add Deadline buttons
- Verify: calendar shows seeded deadlines and court dates with color-coded urgency

### 1.4 Implement New Matter Dialog

- Create `NewMatterDialog` component with form fields (case type, client, opposing party, county)
- Wire form submission to `trpc.matters.create.useMutation()`
- Add dialog trigger to matters page and dashboard
- Verify: creating a matter adds it to the list and navigates to its detail page

### 1.5 Implement New Contact Dialog

- Create `NewContactDialog` component with form fields (name, email, phone, type, firm)
- Wire form submission to `trpc.contacts.create.useMutation()`
- Verify: creating a contact adds it to the contacts list

---

## Priority 2 -- Legal Operations

These enable the filing, discovery, and financial workflows.

### 2.1 Wire Filing Queue

- Replace empty array in filing page with `trpc.filing.listPackets.useQuery({ status })`
- Wire status tab filters
- Wire row click to `router.push(\`/filing/\${id}\`)`
- Verify: filing queue shows packets grouped by status

### 2.2 Wire Filing Detail and Actions

- Replace null packet in filing detail page with `trpc.filing.getPacket.useQuery({ id })`
- Wire Validate button to `trpc.filing.validatePacket.useMutation()`
- Wire Attorney Approve to `trpc.filing.attorneyApprove.useMutation()`
- Wire Attorney Reject to `trpc.filing.attorneyReject.useMutation()`
- Wire Submit to Court to `trpc.filing.submitToCourt.useMutation()`
- Verify: filing detail shows packet data; action buttons transition status correctly

### 2.3 Wire Discovery Page

- Replace empty array with `trpc.discovery.listRequests.useQuery()`
- Wire New Request button to dialog with `trpc.discovery.createRequest.useMutation()`
- Wire type and status filters
- Verify: discovery page shows requests; overdue items highlighted in red

### 2.4 Wire Financial Page

- Replace empty array and hardcoded 0s with `trpc.financial.getTrustLedger.useQuery()` and aggregate computations
- Wire Export button to `trpc.financial.exportSummary.useMutation()`
- Verify: financial page shows summary cards with real numbers and ledger entries

### 2.5 Fix Client Portal

- Add tRPC provider to `apps/client-portal/src/app/layout.tsx`
- Replace empty array on portal home with client-scoped matter query
- Replace hardcoded "Jane Smith" / "Divorce" with data from `trpc.matters.getById`
- Replace empty documents and messages arrays with real queries
- Verify: client portal shows the authenticated client's matters with correct names

### 2.6 Wire Client Portal Messages

- Wire messages page to real API (may require new `messages` tRPC router or procedure)
- Verify: message threads display with unread counts

---

## Priority 3 -- Polish and Hardening

### 3.1 Replace All console.log Navigation

- Audit all pages for remaining `console.log` navigation calls
- Replace with `router.push()` using `useRouter` from `next/navigation`
- Verify: no `console.log('navigate')` calls remain in codebase

### 3.2 Add Toast Notifications for Mutations

- Install/configure toast library (e.g., `sonner` or `react-hot-toast`)
- Add success/error toasts to all `useMutation` `onSuccess`/`onError` callbacks
- Verify: creating a matter shows "Matter created" toast; errors show error message

### 3.3 Add Error Boundary Handling

- Create `ErrorBoundary` component for route segments
- Add `error.tsx` files to dashboard route groups
- Add loading states (`loading.tsx`) to route groups
- Verify: API errors show friendly error message instead of white screen

### 3.4 Run E2E Tests Against Seeded Data

- Start full stack (API + Postgres + Redis + staff-web)
- Seed database with test data
- Run Playwright E2E suite
- Fix any failures
- Verify: all 4 E2E scenarios pass

### 3.5 Update READY_FOR_RELEASE.md

- Replace placeholder evidence with real test results
- Document which features are complete with screenshots or test output
- List any remaining known issues
- Verify: every claim in READY_FOR_RELEASE.md has supporting evidence

---

## Dependency Graph

```
P0.1 (tRPC Provider)
  |
  +-- P0.3 (Dashboard metrics)
  +-- P0.4 (Matters list) -- P0.5 (Matter detail)
  |                              |
  |                              +-- P1.1 (Matter tabs)
  |                              +-- P1.4 (New matter dialog)
  |
  +-- P1.2 (Contacts)
  +-- P1.3 (Calendar)
  +-- P2.1 (Filing queue) -- P2.2 (Filing detail)
  +-- P2.3 (Discovery)
  +-- P2.4 (Financial)
  +-- P2.5 (Client portal)

P0.2 (State machine fix) -- independent, can parallel with P0.1
```

---

## Estimated Total Effort

| Phase | Items | Estimate |
|-------|-------|----------|
| Priority 0 | 5 | 1-2 days |
| Priority 1 | 5 | 2-3 days |
| Priority 2 | 6 | 3-4 days |
| Priority 3 | 5 | 2-3 days |
| **Total** | **21** | **8-12 days** |
