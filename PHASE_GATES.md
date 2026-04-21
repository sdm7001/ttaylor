# Phase Gate Criteria -- Ttaylor Platform Recovery

**Date**: 2026-04-21

Each phase has specific, testable acceptance criteria. A phase is not complete until every criterion is met.

---

## Phase Gate 0: Foundation (Unblocks Everything)

**Entry criteria**: Recovery audit documents reviewed and accepted.

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 0.1 | tRPC provider is configured in staff-web layout | App loads at `localhost:3000` without React context errors; `QueryClientProvider` and `trpc.Provider` visible in React DevTools component tree |
| 0.2 | State machine in matters router uses `@ttaylor/workflows` | `grep -r "LEAD_PENDING\|CONFLICT_REVIEW\|OPEN_ACTIVE" services/api/src/routers/matters.ts` returns zero matches; `grep "validateMatterTransition" services/api/src/routers/matters.ts` returns at least one match |
| 0.3 | Dashboard shows live metrics | Navigate to `/` (dashboard); active matters count is non-zero with seeded data; pending filings count reflects actual pending packets; upcoming deadlines count reflects deadlines within 7 days |
| 0.4 | Dashboard activity feed shows real events | Activity feed section on dashboard renders at least one audit event from seeded data; empty state message is not visible when events exist |
| 0.5 | Matters list shows real data from database | Navigate to `/matters`; table renders seeded matters with case number, client name, status, and case type columns populated |
| 0.6 | Matters list navigation works | Click any matter row in the list; browser URL changes to `/matters/[id]` where `[id]` is the matter's actual database ID; no `console.log` output in browser console |
| 0.7 | Matter detail page shows real matter data | Navigate to `/matters/[id]` for a seeded matter; page displays correct case number, client name, status badge, and case type; no hardcoded stub data visible |
| 0.8 | All existing unit tests still pass | Run `npx vitest run`; all 153 tests pass with zero failures |

**Exit criteria**: All 8 items verified. Frontend can fetch and display data from the backend.

---

## Phase Gate 1: Core Operating Loop

**Entry criteria**: Phase Gate 0 complete.

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1.1 | Matter detail Parties tab shows linked contacts | Open a seeded matter with associated contacts; Parties tab displays contact names, roles, and contact info |
| 1.2 | Matter detail Documents tab shows documents | Open a seeded matter with documents; Documents tab lists documents with title, type, status, and created date |
| 1.3 | Matter detail Checklist tab shows checklist items | Open a seeded matter with checklist; Checklist tab shows items with completion status, progress bar reflects actual completion percentage |
| 1.4 | Matter detail Calendar tab shows events | Open a seeded matter with deadlines; Calendar tab shows deadlines with due dates and urgency color coding |
| 1.5 | Matter detail Financial tab shows financial data | Open a seeded matter with invoices; Financial tab shows invoice list, payment history, and trust balance |
| 1.6 | Matter detail Filing tab shows filing packets | Open a seeded matter with filing packets; Filing tab lists packets with status badges |
| 1.7 | Contacts list shows real contacts | Navigate to `/contacts`; table renders seeded contacts with name, email, phone, and type |
| 1.8 | Contacts search works | Type a name fragment in the search input; contact list filters to matching results; clearing search shows all contacts |
| 1.9 | Calendar page shows deadlines and court dates | Navigate to `/calendar`; upcoming deadlines section shows seeded deadlines sorted by date; court dates section shows seeded court dates |
| 1.10 | New matter can be created | Click "New Matter" on matters page; dialog opens with form; fill in case type and client; submit; new matter appears in matters list; can navigate to its detail page |
| 1.11 | New contact can be created | Click "New Contact" on contacts page; dialog opens with form; fill in name and email; submit; new contact appears in contacts list |
| 1.12 | Mutations trigger data refresh | After creating a matter, the matters list updates without manual page refresh; after completing a checklist item, progress bar updates |

**Exit criteria**: All 12 items verified. A paralegal can view and manage matters, contacts, and calendar through the UI.

---

## Phase Gate 2: Legal Operations

**Entry criteria**: Phase Gate 1 complete.

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 2.1 | Filing queue shows packets by status | Navigate to `/filing`; packets render in table; clicking status tabs filters to that status only |
| 2.2 | Filing detail page loads packet data | Click a filing packet row; navigates to `/filing/[id]`; page shows packet details, document list, validation status |
| 2.3 | Filing validation works | Click "Validate" on a filing packet; validation results display (pass/fail with specific issues); packet status reflects validation outcome |
| 2.4 | Attorney approval flow works | On a validated packet, click "Approve" (as attorney role); packet status changes to APPROVED; audit event is created |
| 2.5 | Attorney rejection flow works | On a validated packet, click "Reject" (as attorney role); rejection reason dialog appears; packet status changes to REJECTED with reason |
| 2.6 | Discovery page shows requests | Navigate to `/discovery`; table renders seeded discovery requests; type tabs filter correctly; overdue items show red highlighting |
| 2.7 | New discovery request can be created | Click "New Request"; fill in form; submit; request appears in list |
| 2.8 | Financial page shows real numbers | Navigate to `/financial`; summary cards show non-zero values from seeded data; ledger table shows entries |
| 2.9 | Financial export works | Click "Export" on financial page; export mutation is called; result is available (download or display) |
| 2.10 | Client portal shows authenticated client's matters | Log in to client portal; home page shows only matters where the authenticated user is a party; no hardcoded names visible |
| 2.11 | Client portal matter detail shows real data | Click a matter in client portal; detail page shows correct case type, attorney name, and shared documents from database |
| 2.12 | Client portal messages display | Navigate to messages in client portal; threads render (or empty state if no messages); no hardcoded data visible |

**Exit criteria**: All 12 items verified. Filing, discovery, and financial workflows are operational. Client portal shows real data.

---

## Phase Gate 3: Polish and Hardening

**Entry criteria**: Phase Gate 2 complete.

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 3.1 | Zero console.log navigation calls remain | Run `grep -r "console.log.*navigate\|console.log.*nav" apps/staff-web/src/ apps/client-portal/src/`; returns zero matches |
| 3.2 | All mutations show toast feedback | Create a matter; toast appears saying "Matter created". Trigger an API error (e.g., invalid input); error toast appears. Verify for at least 5 different mutation types |
| 3.3 | Error boundaries catch rendering errors | Temporarily break a component; error boundary renders fallback UI instead of white screen; error is logged |
| 3.4 | Loading states display during data fetch | Throttle network in DevTools; navigate to matters list; loading skeleton or spinner appears before data renders |
| 3.5 | E2E test suite passes | Start full stack with seeded data; run `npx playwright test`; all 4 scenarios pass (matter creation, status transition, document generation, filing workflow) |
| 3.6 | Reports page generates at least one report | Click "Run" on Matter Pipeline report; report renders with data from database; no `console.log` in browser console |
| 3.7 | READY_FOR_RELEASE.md reflects reality | Every claim in READY_FOR_RELEASE.md has corresponding evidence (test output, screenshots, or verifiable steps); no aspirational claims remain |
| 3.8 | No placeholder data visible anywhere | Navigate through every page in staff-web and client-portal; no "Jane Smith", no hardcoded 0s with seeded data present, no empty arrays when seeded data exists for that entity |

**Exit criteria**: All 8 items verified. Platform is ready for user acceptance testing.

---

## Summary

| Phase | Criteria Count | Focus |
|-------|---------------|-------|
| Phase 0 | 8 | tRPC provider, state machine fix, dashboard + matters wiring |
| Phase 1 | 12 | All matter tabs, contacts, calendar, create flows |
| Phase 2 | 12 | Filing, discovery, financial, client portal |
| Phase 3 | 8 | Polish, error handling, E2E tests, release readiness |
| **Total** | **40** | |
