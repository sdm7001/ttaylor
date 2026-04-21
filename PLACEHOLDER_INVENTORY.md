# Placeholder Inventory -- Ttaylor Platform

**Date**: 2026-04-21
**Total placeholders**: 52 TODOs, 30 no-op handlers, 13 affected files

---

## File 1: `apps/staff-web/src/app/layout.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Missing provider | Root layout `children` wrapper | No TanStack Query `QueryClientProvider` or tRPC provider wrapping `{children}` | Add `TrpcProvider` client component that wraps children in `QueryClientProvider` + `trpc.Provider` with httpBatchLink pointing to API URL |

---

## File 2: `apps/staff-web/src/app/(dashboard)/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Hardcoded 0 | ~line 15 | `activeMatterCount = 0` | `trpc.matters.list.useQuery({ status: 'OPEN_ACTIVE' })` then use `data.total` |
| Hardcoded 0 | ~line 16 | `pendingFilingCount = 0` | `trpc.filing.listPackets.useQuery({ status: 'PENDING_REVIEW' })` then use `data.total` |
| Hardcoded 0 | ~line 17 | `upcomingDeadlineCount = 0` | `trpc.calendar.getUpcoming.useQuery({ days: 7 })` then use `data.length` |
| Hardcoded 0 | ~line 18 | `overdueTaskCount = 0` | `trpc.checklists.getOverdue.useQuery()` or compute from checklist data |
| Empty array | ~line 22 | `recentActivity = []` | `trpc.audit.listEvents.useQuery({ limit: 10, orderBy: 'desc' })` |
| No-op handler | ~line 35 | New Matter button `onClick={() => {}}` | Open NewMatterDialog, call `trpc.matters.create.useMutation()` on submit |

---

## File 3: `apps/staff-web/src/app/(dashboard)/matters/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 12 | `matters = []` | `trpc.matters.list.useQuery({ status: activeFilter, cursor })` |
| console.log | ~line 28 | `onClick={() => console.log('navigate to', matter.id)}` | `router.push(\`/matters/\${matter.id}\`)` using `useRouter` from `next/navigation` |
| No-op handler | ~line 8 | New Matter button `onClick={() => {}}` | Open NewMatterDialog component |
| No-op handler | ~line 45 | Filter buttons do not update query | Add `useState` for filter, pass as query param to `trpc.matters.list` |

---

## File 4: `apps/staff-web/src/app/(dashboard)/matters/[id]/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Stub data hook | ~line 8 | `useMatterDetail(id)` returns hardcoded object with fake matter data | Replace with `trpc.matters.getById.useQuery({ id })` |
| Empty array | ~line 30 | Parties tab: `parties = []` | `trpc.contacts.list.useQuery({ matterId: id })` |
| Empty array | ~line 42 | Documents tab: `documents = []` | `trpc.documents.listForMatter.useQuery({ matterId: id })` |
| Empty array | ~line 54 | Checklist tab: `items = []` | `trpc.checklists.getForMatter.useQuery({ matterId: id })` |
| Empty array | ~line 66 | Calendar tab: `events = []` | `trpc.calendar.listEvents.useQuery({ matterId: id })` |
| Empty array | ~line 78 | Filing tab: `packets = []` | `trpc.filing.listPackets.useQuery({ matterId: id })` |
| Empty array | ~line 90 | Financial tab: `summary = { invoices: [], payments: [] }` | `trpc.financial.getMatterSummary.useQuery({ matterId: id })` |
| No-op handler | ~line 35 | Add Party button no-op | Open AddPartyDialog, call `trpc.contacts.addToMatter.useMutation()` |
| No-op handler | ~line 47 | Upload Document button no-op | Open upload dialog, call `trpc.documents.create.useMutation()` |
| No-op handler | ~line 50 | Generate Document button no-op | Open template picker, call `trpc.documents.generate.useMutation()` |
| No-op handler | ~line 59 | Complete Checklist Item no-op | Call `trpc.checklists.completeItem.useMutation()` |
| No-op handler | ~line 71 | Add Event button no-op | Open event dialog, call `trpc.calendar.createEvent.useMutation()` |
| No-op handler | ~line 83 | Create Filing Packet button no-op | Call `trpc.filing.createPacket.useMutation()` |
| No-op handler | ~line 95 | Create Invoice button no-op | Open invoice dialog, call `trpc.financial.createInvoice.useMutation()` |

---

## File 5: `apps/staff-web/src/app/(dashboard)/contacts/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 10 | `contacts = []` | `trpc.contacts.list.useQuery({ search: searchTerm })` |
| No-op handler | ~line 6 | New Contact button `onClick={() => {}}` | Open NewContactDialog, call `trpc.contacts.create.useMutation()` |
| console.log | ~line 22 | Row click `console.log('view contact', id)` | `router.push(\`/contacts/\${id}\`)` |

---

## File 6: `apps/staff-web/src/app/(dashboard)/calendar/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 12 | `deadlines = []` | `trpc.calendar.getUpcoming.useQuery({ days: 30 })` |
| Empty array | ~line 13 | `courtDates = []` | `trpc.calendar.listEvents.useQuery({ type: 'COURT_DATE' })` |
| No-op handler | ~line 8 | Add Event button no-op | Open event dialog, call `trpc.calendar.createEvent.useMutation()` |
| No-op handler | ~line 9 | Add Deadline button no-op | Open deadline dialog, call `trpc.calendar.createDeadline.useMutation()` |

---

## File 7: `apps/staff-web/src/app/(dashboard)/filing/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 14 | `packets = []` | `trpc.filing.listPackets.useQuery({ status: activeTab })` |
| No-op handler | ~line 30 | Submit for Review button no-op | Call `trpc.filing.submitForAttorneyReview.useMutation()` |
| No-op handler | ~line 32 | Quick Approve button no-op | Call `trpc.filing.attorneyApprove.useMutation()` |
| console.log | ~line 25 | Row click `console.log('view packet', id)` | `router.push(\`/filing/\${id}\`)` |

---

## File 8: `apps/staff-web/src/app/(dashboard)/filing/[id]/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Always null | ~line 10 | `packet = null` (always renders "Packet not found") | `trpc.filing.getPacket.useQuery({ id })` |
| No-op handler | ~line 40 | Validate button no-op | Call `trpc.filing.validatePacket.useMutation()` |
| No-op handler | ~line 45 | Attorney Approve button no-op | Call `trpc.filing.attorneyApprove.useMutation()` |
| No-op handler | ~line 48 | Attorney Reject button no-op | Call `trpc.filing.attorneyReject.useMutation()` |
| No-op handler | ~line 52 | Submit to Court button no-op | Call `trpc.filing.submitToCourt.useMutation()` |

---

## File 9: `apps/staff-web/src/app/(dashboard)/discovery/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 12 | `requests = []` | `trpc.discovery.listRequests.useQuery({ type: typeFilter, status: statusFilter })` |
| No-op handler | ~line 7 | New Request button no-op | Open dialog, call `trpc.discovery.createRequest.useMutation()` |

---

## File 10: `apps/staff-web/src/app/(dashboard)/financial/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 14 | `ledger = []` | `trpc.financial.getTrustLedger.useQuery()` or aggregate query |
| Hardcoded 0 | ~line 8 | `outstandingBalance = 0` | Compute from `trpc.financial.getMatterSummary` aggregate |
| Hardcoded 0 | ~line 9 | `trustBalance = 0` | Compute from trust ledger data |
| Hardcoded 0 | ~line 10 | `paymentsThisMonth = 0` | Compute from filtered payment data |
| No-op handler | ~line 20 | Export button no-op | Call `trpc.financial.exportSummary.useMutation()` |

---

## File 11: `apps/staff-web/src/app/(dashboard)/reports/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| console.log | ~line 25 | Run Report button `onClick={() => console.log('run report', type)}` | Call dedicated report generation endpoint or aggregate existing tRPC queries; display results in modal or new page |

---

## File 12: `apps/client-portal/src/app/(portal)/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 8 | `matters = []` | `trpc.matters.listForClient.useQuery()` (needs new procedure scoped to authenticated client's matters) |

---

## File 13: `apps/client-portal/src/app/(portal)/matters/[id]/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Hardcoded string | ~line 12 | `clientName = "Jane Smith"` | Fetch from authenticated user's Clerk profile or `trpc.matters.getById` response |
| Hardcoded string | ~line 13 | `caseType = "Divorce"` | Fetch from `trpc.matters.getById.useQuery({ id })` |
| Empty array | ~line 18 | `sharedDocuments = []` | `trpc.documents.listForMatter.useQuery({ matterId: id, clientVisible: true })` |
| Empty array | ~line 19 | `messages = []` | `trpc.messages.listForMatter.useQuery({ matterId: id })` (messages router may need creation) |

---

## File 14: `apps/client-portal/src/app/(portal)/messages/page.tsx`

| Type | Location | Placeholder | Real Implementation |
|------|----------|-------------|---------------------|
| Empty array | ~line 8 | `threads = []` | `trpc.messages.listThreads.useQuery()` (needs messages router or procedure) |

---

## Summary by Type

| Placeholder Type | Count |
|-----------------|-------|
| Empty array | 18 |
| No-op handler | 22 |
| Hardcoded 0 | 8 |
| console.log (navigation) | 4 |
| Stub data hook | 1 |
| Hardcoded string | 2 |
| Always null | 1 |
| Missing provider | 1 |
| **Total** | **57** |
