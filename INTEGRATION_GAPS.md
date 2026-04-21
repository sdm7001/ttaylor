# Integration Gaps -- Ttaylor Platform

**Date**: 2026-04-21

---

## Gap 1: No tRPC Provider in Frontend Layout

**Location**: `apps/staff-web/src/app/layout.tsx`

**Problem**: The root layout does not wrap `{children}` in a TanStack Query `QueryClientProvider` or a tRPC provider. Without this wrapper, any component that calls `trpc.X.useQuery()` or `trpc.X.useMutation()` will throw a runtime error because there is no React context to resolve the tRPC client.

**Impact**: Blocks ALL frontend API calls. This is the single prerequisite for every other wiring task. Nothing works until this is fixed.

**Fix**:

1. Create `apps/staff-web/src/lib/trpc.ts` -- initialize the tRPC client with `httpBatchLink` pointing to the API server URL (e.g., `http://localhost:4000/trpc`).

2. Create `apps/staff-web/src/providers/TrpcProvider.tsx` -- a `'use client'` component that:
   - Creates a `QueryClient` instance (with sensible defaults for staleTime, retry)
   - Creates the tRPC client instance
   - Wraps children in `<trpc.Provider client={trpcClient} queryClient={queryClient}>` and `<QueryClientProvider client={queryClient}>`

3. Wrap `{children}` in `layout.tsx` with `<TrpcProvider>`.

4. The same pattern must be applied to `apps/client-portal/src/app/layout.tsx`.

**Estimated effort**: 1-2 hours.

---

## Gap 2: State Machine Divergence

**Location**: `services/api/src/routers/matters.ts` (the `updateStatus` procedure)

**Problem**: The matters router defines its own `VALID_TRANSITIONS` map using status strings that do not match the `MatterStatus` enum:

```
Router uses:        'LEAD_PENDING', 'CONFLICT_REVIEW', 'OPEN_ACTIVE', ...
Enum defines:       'LEAD', 'INTAKE', 'CONFLICT_CHECK', 'ACTIVE', ...
Workflow package:   Uses enum values correctly
```

The `updateStatus` procedure looks up the current status in `VALID_TRANSITIONS`, finds no match (because the DB stores enum values like `LEAD`, not `LEAD_PENDING`), and either silently fails or throws an invalid transition error for every request.

**Impact**: No matter can have its status changed through the API. The entire matter lifecycle is frozen.

**Fix**:

1. Delete the inline `VALID_TRANSITIONS` map from `matters.ts`.
2. Import `validateMatterTransition` and `getAvailableTransitions` from `@ttaylor/workflows`.
3. Replace the transition validation logic with:
   ```typescript
   const isValid = validateMatterTransition(currentStatus, newStatus, userRole);
   if (!isValid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid transition' });
   ```
4. This ensures the router and the workflow package use the same state machine -- single source of truth.

**Estimated effort**: 30 minutes.

---

## Gap 3: BullMQ Document Generation Stub

**Location**: `services/api/src/routers/documents.ts` (the `generate` procedure)

**Problem**: The document generation procedure creates a document record, renders the template synchronously using `@ttaylor/documents` template engine, and immediately marks the document status as `GENERATED`. In production, document generation should be an async background job because:
- Template rendering with complex merge data can be slow
- PDF conversion (not yet implemented) is CPU-intensive
- The client should not block on generation

**Current behavior**:
```
Client calls generate -> Router renders template -> Marks GENERATED -> Returns document
```

**Expected behavior**:
```
Client calls generate -> Router creates document in GENERATING state -> Dispatches BullMQ job -> Returns document (GENERATING)
Worker picks up job -> Renders template -> Converts to PDF -> Marks GENERATED
Client polls or receives websocket notification
```

**Impact**: Medium. The current synchronous approach works for simple templates but will not scale. Acceptable for Phase 1 if documented.

**Fix (Phase 2+)**:
1. Define a `document-generation` BullMQ queue in `services/api/src/queues/`.
2. Create a worker that processes generation jobs.
3. Update the `generate` procedure to dispatch a job and return the document in `GENERATING` state.
4. Add a `documents.getById` polling endpoint or websocket event for status updates.

**Estimated effort**: 4-6 hours.

---

## Gap 4: BullMQ Filing Submission Stub

**Location**: `services/api/src/routers/filing.ts` (the `submitToCourt` procedure)

**Problem**: The `submitToCourt` procedure marks the filing packet as `SUBMITTED` and emits an audit event, but does not actually dispatch anything to eFileTexas. The comment in the code notes this is a placeholder for the real court filing integration.

**Current behavior**:
```
Attorney calls submitToCourt -> Router marks SUBMITTED -> Returns success
```

**Expected behavior**:
```
Attorney calls submitToCourt -> Router marks SUBMITTING -> Dispatches BullMQ job -> Returns packet (SUBMITTING)
Worker constructs eFileTexas envelope -> Submits to court API -> Updates status (ACCEPTED/REJECTED)
```

**Impact**: Medium. This is acceptable for the current phase since eFileTexas integration requires court credentials and testing environment access. The stub correctly models the data flow -- it just skips the external call.

**Fix (when eFileTexas credentials available)**:
1. Define a `court-filing` BullMQ queue.
2. Create a worker that constructs the eFileTexas SOAP/REST envelope using `@ttaylor/documents` template data.
3. Handle court response codes and map to filing packet statuses.
4. Add retry logic for transient court API failures.

**Estimated effort**: 2-3 days (includes eFileTexas API integration and testing).

---

## Gap 5: No Global Search Endpoint

**Location**: Not implemented anywhere.

**Problem**: The architecture documents reference a global search capability, and the staff-web navigation bar includes a search input. However, no tRPC procedure exists to handle search queries across matters, contacts, documents, and other entities.

**Impact**: Low. Search is a convenience feature. Users can filter within individual list pages. But the search bar in the nav is non-functional.

**Fix**:
1. Add a `search.global` tRPC procedure that queries multiple tables:
   - Matters (by case number, client name, type)
   - Contacts (by name, email, phone)
   - Documents (by title, template type)
2. Return typed union results with entity type discriminator.
3. Wire the nav search bar to this endpoint with debounced input.

**Estimated effort**: 3-4 hours.

---

## Gap 6: No Notification Delivery System

**Location**: Multiple routers reference notifications but none are delivered.

**Specific instances**:
- `filing.ts` ~line 406: Comment notes "TODO: send notification to attorney" when packet is ready for review
- `orders.ts`: Compliance violation emits a `HIGH` severity audit event with `notifyAttorney: true` in metadata, but no system reads this metadata to send an actual notification
- `calendar.ts`: Deadline creation does not trigger any reminder notification

**Impact**: Low for Phase 1. Audit events are logged, so there is a record. But no one is alerted in real time when action is needed.

**Fix**:
1. Define a notification model in Prisma (or use an existing one if present in schema).
2. Create a `notifications` tRPC router with `list`, `markRead`, `getUnreadCount` procedures.
3. Add notification creation calls in filing, orders, and calendar routers where comments indicate missing notifications.
4. Add a notification bell/dropdown to the staff-web nav bar.
5. Optionally: email notifications via a BullMQ worker for critical alerts (compliance violations, filing rejections).

**Estimated effort**: 1-2 days.
