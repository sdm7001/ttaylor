# Feature Completion Matrix -- Ttaylor Platform

**Date**: 2026-04-21
**Legend**: Complete | Partial | Missing

---

## Frontend Features

| Feature | Requested Behavior | Current Status | Gap | Owner | Priority |
|---------|-------------------|----------------|-----|-------|----------|
| Dashboard metrics (live counts) | Show real matter counts, upcoming deadlines, pending filings | Missing | Hardcoded `0` for all metrics; no tRPC queries | Frontend Lead | P0 |
| Dashboard activity feed | Show recent audit events and matter updates | Missing | Empty state only; no API call | Frontend Lead | P0 |
| Matters list (live data + filters) | Fetch paginated matters with status/type filters | Missing | Uses empty array `[]`; no `trpc.matters.list` call | Frontend Lead | P0 |
| Matters list navigation | Click row to navigate to `/matters/[id]` | Missing | Uses `console.log('navigate to ...')` instead of `router.push` | Frontend Lead | P0 |
| New matter flow | Open dialog, submit form, create matter via API | Missing | Button handler is no-op | Frontend Lead | P1 |
| Matter detail data hydration | Load full matter by ID with relations | Missing | Uses stub data hook returning hardcoded object | Frontend Lead | P0 |
| Matter detail parties tab | Show parties linked to matter | Partial | UI tab and layout exist; no data fetched | Frontend Lead | P1 |
| Matter detail documents tab | List documents, upload, generate | Partial | UI tab exists; no `trpc.documents.listForMatter` call | Frontend Lead | P1 |
| Matter detail checklist tab | Show checklist items with completion status | Partial | UI tab exists with progress bar; no `trpc.checklists.getForMatter` call | Frontend Lead | P1 |
| Matter detail calendar tab | Show deadlines and court dates for matter | Partial | UI tab exists; no `trpc.calendar.listEvents` call | Frontend Lead | P1 |
| Matter detail filing tab | Show filing packets and status | Partial | UI tab exists; no `trpc.filing.listPackets` call | Frontend Lead | P1 |
| Matter detail financial tab | Show invoices, payments, trust balance | Partial | UI tab exists; no `trpc.financial.getMatterSummary` call | Frontend Lead | P1 |
| Contacts list | Fetch and display contacts with search | Missing | Uses empty array `[]`; no `trpc.contacts.list` call | Frontend Lead | P1 |
| New contact flow | Open dialog, submit form, create contact | Missing | Button handler is no-op | Frontend Lead | P1 |
| Calendar/deadlines view | Show upcoming deadlines and court dates | Missing | Uses empty arrays for both sections | Frontend Lead | P1 |
| Filing queue | List filing packets with status tabs | Missing | Uses empty array `[]`; no `trpc.filing.listPackets` call | Frontend Lead | P2 |
| Filing actions (submit, approve, reject) | Execute filing workflow transitions | Missing | All action buttons are no-ops | Frontend Lead | P2 |
| Filing detail | Show full filing packet with documents and validation | Missing | Always renders null packet state | Frontend Lead | P2 |
| Discovery list | List discovery requests with filters | Missing | Uses empty array `[]`; no `trpc.discovery.listRequests` call | Frontend Lead | P2 |
| Financial overview | Show firm-wide financial summary | Missing | Uses empty array + hardcoded `0` for summary cards | Frontend Lead | P2 |
| Reports | Run and display various report types | Missing | Run button uses `console.log` | Frontend Lead | P3 |
| Client portal matters | List client's matters | Missing | Uses empty array `[]` | Frontend Lead | P2 |
| Client portal matter detail | Show matter info, documents, messages | Missing | Hardcoded "Jane Smith" name and "Divorce" case type | Frontend Lead | P2 |
| Client portal messages | Show message threads | Missing | Uses empty array `[]` | Frontend Lead | P2 |

---

## Backend (tRPC Routers)

| Feature | Requested Behavior | Current Status | Gap | Owner | Priority |
|---------|-------------------|----------------|-----|-------|----------|
| tRPC router: matters | CRUD + status transitions + search | Complete (with caveat) | State machine `VALID_TRANSITIONS` uses wrong enum values; diverges from `@ttaylor/workflows` | Backend Lead | P0 |
| tRPC router: documents | CRUD + generation + versioning | Partial | BullMQ document generation stubbed as synchronous; marks GENERATED immediately | Backend Lead | P1 |
| tRPC router: intake | Lead capture + conflict check + conversion | Complete | -- | -- | -- |
| tRPC router: checklists | Template instantiation + item completion | Complete | -- | -- | -- |
| tRPC router: calendar | Events + deadlines + upcoming view | Complete | -- | -- | -- |
| tRPC router: contacts | CRUD + search + matter linking | Complete | -- | -- | -- |
| tRPC router: filing | Packet CRUD + validation + submission flow | Partial | Court submission is BullMQ stub; no real eFileTexas dispatch | Backend Lead | P2 |
| tRPC router: discovery | Request CRUD + item tracking + response tracking | Complete | -- | -- | -- |
| tRPC router: financial | Invoices + payments + trust ledger + export | Complete | -- | -- | -- |
| tRPC router: orders | Order CRUD + compliance tracking | Complete | -- | -- | -- |
| tRPC router: audit | Event listing + filtering + export | Complete | -- | -- | -- |

---

## Packages

| Feature | Requested Behavior | Current Status | Gap | Owner | Priority |
|---------|-------------------|----------------|-----|-------|----------|
| @ttaylor/workflows | State machine, checklist engine, deadline calculator | Complete | -- | -- | -- |
| @ttaylor/documents | Template engine, document lifecycle | Complete | -- | -- | -- |
| @ttaylor/auth | Role definitions, permission matrix, Clerk types | Complete | -- | -- | -- |
| @ttaylor/domain | Shared enums, types, constants | Complete | -- | -- | -- |
| @ttaylor/ui | Design system components | Complete | -- | -- | -- |

---

## Infrastructure

| Feature | Requested Behavior | Current Status | Gap | Owner | Priority |
|---------|-------------------|----------------|-----|-------|----------|
| Prisma schema | 40-table relational schema | Complete | -- | -- | -- |
| Database seeds | Realistic seed data for all tables | Complete | -- | -- | -- |
| Unit tests | Cover all workflow and document modules | Complete (153 tests) | -- | -- | -- |
| Integration tests | Test tRPC routers against database | Partial | Uses mocked Prisma helpers, not a real database | QA Lead | P3 |
| E2E tests | Full user workflow scenarios | Partial | Written in Playwright but not runnable without a running app | QA Lead | P3 |
| Deployment runbook | Step-by-step deploy instructions | Complete | -- | -- | -- |
| Backup/recovery runbook | Backup and restore procedures | Complete | -- | -- | -- |

---

## Summary

| Status | Count |
|--------|-------|
| Complete | 19 |
| Partial | 11 |
| Missing | 23 |
| **Total** | **53** |

The 23 missing features are all frontend API wiring. The backend is ready.
