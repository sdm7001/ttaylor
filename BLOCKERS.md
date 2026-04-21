# Current Blockers -- Ttaylor Platform

**Date**: 2026-04-21

---

| # | Blocker | Affects | Resolution | Owner |
|---|---------|---------|------------|-------|
| 1 | No tRPC provider configured in staff-web layout | ALL frontend API calls -- every page remains in empty/placeholder state until this is resolved | Create `TrpcProvider` client component with `QueryClientProvider` + `trpc.Provider` wrapping `httpBatchLink` to API URL; wrap `{children}` in `layout.tsx` | Frontend Lead |
| 2 | State machine enum mismatch in matters router | `matters.updateStatus` is non-functional -- no matter can transition status through the API | Delete inline `VALID_TRANSITIONS` map; import and use `validateMatterTransition` from `@ttaylor/workflows` package | Backend Lead |
| 3 | No BullMQ worker process defined | Document generation remains synchronous (blocks request thread); filing submission has no async processing path | Define worker entry point in `services/api/src/workers/`; register `document-generation` and `court-filing` queues; add worker process to Docker Compose | DevOps Lead |

---

## Blocker Dependencies

```
Blocker 1 (tRPC Provider)
  -> Unblocks: ALL frontend wiring (Priority 0-2 tasks)
  -> Must be resolved FIRST

Blocker 2 (State Machine)
  -> Unblocks: Matter status transitions, workflow progression
  -> Can be resolved in parallel with Blocker 1

Blocker 3 (BullMQ Workers)
  -> Unblocks: Async document generation, court filing dispatch
  -> Lower priority; synchronous stubs are acceptable for Phase 1
```

---

## Non-Blocking Issues (for awareness)

These are not blockers but should be tracked:

| Issue | Impact | When to Address |
|-------|--------|-----------------|
| No global search endpoint | Nav search bar is non-functional | Priority 3 |
| No notification delivery | Alerts go to audit log only, no real-time notification | Priority 3 |
| Integration tests use mocked Prisma | Tests do not validate real DB behavior | Priority 3 |
| Client portal has no tRPC provider | Same as Blocker 1 but for client-portal app | Priority 2 (after staff-web) |
