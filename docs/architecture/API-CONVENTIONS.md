# API Conventions -- Ttaylor Family Law Paralegal Platform

**Version**: 1.0.0
**Source of Truth**: `/SCHEMA_CANON.md`, `/docs/architecture/MODULE-BOUNDARIES.md`
**Last Updated**: 2026-04-21

This document defines the conventions for all tRPC procedures in the platform. Every developer must follow these conventions. Deviations require documented justification and architect approval.

---

## 1. tRPC Router Organization

Routers are nested to mirror the module boundary structure. The top-level `appRouter` composes module-level routers.

```typescript
// src/server/routers/_app.ts
import { router } from '../trpc';
import { identityRouter } from './identity';
import { intakeRouter } from './intake';
import { conflictRouter } from './conflict';
import { contactsRouter } from './contacts';
import { mattersRouter } from './matters';
import { documentsRouter } from './documents';
import { filingRouter } from './filing';
import { checklistsRouter } from './checklists';
import { calendarRouter } from './calendar';
import { discoveryRouter } from './discovery';
import { financialRouter } from './financial';
import { notesRouter } from './notes';
import { notificationsRouter } from './notifications';
import { portalRouter } from './portal';
import { auditRouter } from './audit';

export const appRouter = router({
  identity: identityRouter,
  intake: intakeRouter,
  conflict: conflictRouter,
  contacts: contactsRouter,
  matters: mattersRouter,
  documents: documentsRouter,
  filing: filingRouter,
  checklists: checklistsRouter,
  calendar: calendarRouter,
  discovery: discoveryRouter,
  financial: financialRouter,
  notes: notesRouter,
  notifications: notificationsRouter,
  portal: portalRouter,
  audit: auditRouter,
});

export type AppRouter = typeof appRouter;
```

Each module router further nests sub-routers for resource groups:

```typescript
// src/server/routers/matters.ts
export const mattersRouter = router({
  list: publicProcedure.use(authMiddleware).use(requirePermission('matter:read')).query(...),
  getById: publicProcedure.use(authMiddleware).use(requirePermission('matter:read')).query(...),
  create: publicProcedure.use(authMiddleware).use(requirePermission('matter:create')).mutation(...),
  updateStatus: publicProcedure.use(authMiddleware).use(requirePermission('matter:update')).mutation(...),
  // Nested sub-routers
  assignments: mattersAssignmentsRouter,
  parties: mattersPartiesRouter,
  types: mattersTypesRouter,
  stages: mattersStagesRouter,
  transitions: mattersTransitionsRouter,
  orders: mattersOrdersRouter,
  compliance: mattersComplianceRouter,
});
```

**File structure convention**:
```
src/server/routers/
  _app.ts              # appRouter composition
  identity.ts          # identityRouter
  matters.ts           # mattersRouter (with sub-routers)
  matters/
    assignments.ts     # mattersAssignmentsRouter
    parties.ts         # mattersPartiesRouter
  documents.ts
  documents/
    templates.ts
    versions.ts
    approvals.ts
  ...
```

---

## 2. Naming Conventions

### Queries

Queries use **noun-based names** describing what is returned.

| Pattern | Example | Description |
|---|---|---|
| `{resource}.list` | `matters.list` | List resources with filters and pagination |
| `{resource}.getById` | `matters.getById` | Get a single resource by ID |
| `{resource}.search` | `contacts.search` | Full-text search |
| `{resource}.listBy{Relation}` | `documents.listByMatter` | List resources filtered by a parent |
| `{resource}.{computed}` | `financial.summaryByMatter` | Computed/aggregated data |
| `{resource}.listUpcoming` | `calendar.deadlines.listUpcoming` | Time-based filtered list |

### Mutations

Mutations use **verb-based names** describing the action performed.

| Pattern | Example | Description |
|---|---|---|
| `{resource}.create` | `matters.create` | Create a new resource |
| `{resource}.update` | `matters.update` | Update fields on an existing resource |
| `{resource}.delete` | `contacts.delete` | Delete (soft-delete) a resource |
| `{resource}.updateStatus` | `matters.updateStatus` | Transition resource status |
| `{resource}.{specificAction}` | `documents.approve` | Domain-specific action |
| `{resource}.{action}{Target}` | `filing.packets.submitToCourt` | Action with target clarification |
| `{resource}.{action}` | `checklists.items.waive` | Action on a nested resource |

### Naming Rules

1. Use camelCase for procedure names.
2. Use singular for getById, plural for list operations.
3. Never abbreviate (`submitForAttorneyReview`, not `submitForAttyRev`).
4. Mutations that change status use `updateStatus`, not `setStatus` or `changeStatus`.
5. Approval actions are `approve` and `reject`, not `setApproved`.

---

## 3. Input Validation

All inputs are validated with Zod schemas. No raw input passes through to business logic.

### Standard Zod Patterns

**UUID**:
```typescript
import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid UUID format');
```

**Pagination (cursor-based)**:
```typescript
const paginationSchema = z.object({
  cursor: z.string().uuid().nullish(), // null = first page
  limit: z.number().int().min(1).max(100).default(25),
});
```

**Date Range**:
```typescript
const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  { message: 'from must be before or equal to to' }
);
```

**Status Enums** (generated from schema canon CHECK constraints):
```typescript
const matterStatusSchema = z.enum(['active', 'on_hold', 'closed', 'archived']);

const documentStatusSchema = z.enum([
  'draft', 'in_review', 'revision_requested', 'approved', 'filed', 'superseded', 'archived'
]);

const leadStatusSchema = z.enum([
  'new', 'contacted', 'qualified', 'converted', 'declined', 'lost'
]);

const filingPacketStatusSchema = z.enum([
  'assembling', 'pending_review', 'approved', 'submitted', 'accepted', 'rejected', 'correcting'
]);
```

**Sort Order**:
```typescript
const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
}).optional();
```

**Shared Input Patterns**:
```typescript
// For any procedure that operates on a single resource
const byIdInput = z.object({ id: uuidSchema });

// For any procedure that operates within a matter context
const matterScopedInput = z.object({ matterId: uuidSchema });

// Combined: resource within a matter
const matterResourceInput = z.object({
  matterId: uuidSchema,
  id: uuidSchema,
});
```

---

## 4. Output Shapes

### List Response (Paginated)

All list queries return a consistent paginated shape:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null; // UUID of last item, null if no more pages
  total: number;             // Total count matching filters (without pagination)
}
```

**Zod output schema**:
```typescript
function paginatedOutput<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().uuid().nullable(),
    total: z.number().int().nonnegative(),
  });
}
```

### Single Item Response

Single-item queries return the item directly (not wrapped):

```typescript
// matters.getById returns:
{
  id: "uuid",
  matterNumber: "TT-2026-00142",
  title: "In re Marriage of Smith & Smith",
  status: "active",
  // ... all fields
  assignments: [...],  // included relations
  parties: [...],
  currentStage: { ... },
}
```

### Mutation Response

Mutations return the affected resource after the operation:

```typescript
// matters.updateStatus returns:
{
  id: "uuid",
  status: "on_hold",       // new status
  updatedAt: "2026-04-21T...",
  // ... full matter object
}
```

For mutations that create resources, HTTP-level status is 200 (tRPC convention), and the response includes the created object with its generated ID.

### Error Response

Errors use tRPC's built-in error format:

```typescript
// TRPCError shape (automatic)
{
  code: "FORBIDDEN",           // tRPC error code
  message: "Not assigned to this matter",
  data: {
    code: "FORBIDDEN",
    httpStatus: 403,
    path: "matters.getById",   // procedure path
  }
}
```

For business logic errors that carry additional data:

```typescript
throw new TRPCError({
  code: 'PRECONDITION_FAILED',
  message: 'Cannot advance stage: incomplete checklist items',
  cause: {
    incompleteItems: ['item-uuid-1', 'item-uuid-2'],
    stageGateId: 'stage-uuid',
  }
});
```

---

## 5. Auth Middleware

Every tRPC procedure gets authentication context through a middleware chain.

### Auth Context Flow

```
HTTP Request
  -> Extract Authorization header (Bearer token)
  -> Verify session with Clerk SDK
  -> Load user record from database (with roles + permissions)
  -> Attach to tRPC context as ctx.user and ctx.permissions
```

### Implementation

```typescript
// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';

const t = initTRPC.context<Context>().create();

// Base middleware: verifies auth and loads user
export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  const user = await ctx.db.users.findUnique({
    where: { id: ctx.session.userId, is_active: true, deleted_at: null },
    include: {
      user_roles: {
        include: {
          role: {
            include: {
              role_permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found or inactive' });
  }

  const permissions = new Set<string>(
    user.user_roles.flatMap(ur =>
      ur.role.role_permissions.map(rp => rp.permission.key)
    )
  );

  return next({
    ctx: {
      ...ctx,
      user,
      permissions,
    }
  });
});

// Permission check middleware factory
export const requirePermission = (permissionKey: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.permissions.has(permissionKey)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permissionKey}`,
      });
    }
    return next({ ctx });
  });

// Attorney gate middleware (for approval actions)
export const requireAttorney = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user.is_attorney) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'This action requires a licensed attorney',
    });
  }
  return next({ ctx });
});

// Matter scope middleware
export const requireMatterAccess = t.middleware(async ({ ctx, next, rawInput }) => {
  const input = rawInput as { matterId?: string };
  if (!input.matterId) return next({ ctx });

  if (ctx.permissions.has('matter:read_all')) {
    return next({ ctx });
  }

  const assignment = await ctx.db.matter_assignments.findFirst({
    where: {
      matter_id: input.matterId,
      user_id: ctx.user.id,
      removed_at: null,
    },
  });

  if (!assignment) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Not assigned to this matter',
    });
  }

  return next({ ctx: { ...ctx, matterAssignment: assignment } });
});
```

### Declaring Permissions on Procedures

Each procedure chains the middleware it needs:

```typescript
// A query requiring auth + permission + matter scope
matters.getById = publicProcedure
  .use(authMiddleware)
  .use(requirePermission('matter:read'))
  .use(requireMatterAccess)
  .input(z.object({ matterId: uuidSchema }))
  .query(async ({ ctx, input }) => { ... });

// A mutation requiring auth + permission + attorney gate
documents.approve = publicProcedure
  .use(authMiddleware)
  .use(requirePermission('document:approve'))
  .use(requireAttorney)
  .use(requireMatterAccess)
  .input(z.object({ matterId: uuidSchema, documentId: uuidSchema }))
  .mutation(async ({ ctx, input }) => { ... });
```

---

## 6. Pagination Pattern

All list endpoints use cursor-based pagination.

### Request Shape

```typescript
const listInput = z.object({
  cursor: z.string().uuid().nullish(),  // null or undefined = first page
  limit: z.number().int().min(1).max(100).default(25),
  // ... additional filters
});
```

### Response Shape

```typescript
{
  items: Matter[],
  nextCursor: "last-item-uuid" | null,  // null = no more pages
  total: 142,                            // total matching filter (regardless of page)
}
```

### Implementation Pattern

```typescript
async function paginatedQuery<T extends { id: string }>(
  db: PrismaClient,
  model: string,
  where: object,
  orderBy: object,
  cursor: string | null | undefined,
  limit: number,
): Promise<{ items: T[]; nextCursor: string | null; total: number }> {
  const [items, total] = await Promise.all([
    db[model].findMany({
      where,
      orderBy,
      take: limit + 1, // Fetch one extra to detect next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    db[model].count({ where }),
  ]);

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop()!;
    nextCursor = nextItem.id;
  }

  return { items: items as T[], nextCursor, total };
}
```

### Cursor Stability

Cursors are UUIDs (the `id` of the last item on the current page). This provides stable pagination even when items are inserted or deleted between pages, because UUIDs are immutable and globally unique.

For time-ordered lists (audit events, messages), the cursor is still the `id`, but `orderBy` is `created_at DESC`. The query uses `cursor: { id }` with Prisma's built-in cursor support.

---

## 7. Filtering Pattern

List queries accept a `filters` object with typed fields. Filters are optional -- omitting a filter field means "no constraint on this dimension."

### Standard Filter Objects

**Matters**:
```typescript
const mattersFilterSchema = z.object({
  status: z.array(matterStatusSchema).optional(),        // IN filter
  matterTypeId: uuidSchema.optional(),                   // exact match
  county: z.string().optional(),                          // exact match
  urgency: z.array(z.enum(['low','normal','high','critical'])).optional(),
  assignedToUserId: uuidSchema.optional(),               // has assignment
  search: z.string().min(1).max(200).optional(),         // full-text on title, matter_number
  openedAfter: z.coerce.date().optional(),
  openedBefore: z.coerce.date().optional(),
});
```

**Documents**:
```typescript
const documentsFilterSchema = z.object({
  matterId: uuidSchema,                                   // required (scoped to matter)
  status: z.array(documentStatusSchema).optional(),
  documentType: z.array(z.enum([/* document_type values */])).optional(),
  createdBy: uuidSchema.optional(),
  search: z.string().min(1).max(200).optional(),         // full-text on title
});
```

**Contacts**:
```typescript
const contactsFilterSchema = z.object({
  contactType: z.array(z.enum([/* contact_type values */])).optional(),
  search: z.string().min(1).max(200).optional(),         // full-text on name fields
  matterId: uuidSchema.optional(),                        // contacts associated with a matter
});
```

### Filter-to-Prisma Translation

```typescript
function buildMattersWhere(filters: z.infer<typeof mattersFilterSchema>) {
  const where: Prisma.mattersWhereInput = {
    deleted_at: null, // Always exclude soft-deleted
  };

  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.matterTypeId) where.matter_type_id = filters.matterTypeId;
  if (filters.county) where.county = filters.county;
  if (filters.urgency?.length) where.urgency = { in: filters.urgency };
  if (filters.assignedToUserId) {
    where.matter_assignments = {
      some: { user_id: filters.assignedToUserId, removed_at: null }
    };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { matter_number: { contains: filters.search, mode: 'insensitive' } },
      { cause_number: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.openedAfter) where.opened_at = { ...where.opened_at as object, gte: filters.openedAfter };
  if (filters.openedBefore) where.opened_at = { ...where.opened_at as object, lte: filters.openedBefore };

  return where;
}
```

---

## 8. Audit Emission

Every mutation that touches a matter, document, filing packet, financial entry, or any legally significant record MUST emit an audit event.

### The Pattern

```typescript
import { auditService } from '../services/audit';

// Inside a tRPC mutation handler:
async ({ ctx, input }) => {
  // 1. Perform the business logic
  const previousStatus = matter.status;
  const updatedMatter = await ctx.db.matters.update({
    where: { id: input.matterId },
    data: { status: input.newStatus, updated_at: new Date() },
  });

  // 2. Emit the audit event (MANDATORY)
  await auditService.emit({
    eventType: 'matter.statusChanged',
    actorType: 'user',
    actorId: ctx.user.id,
    resourceType: 'matter',
    resourceId: input.matterId,
    matterId: input.matterId,
    changes: {
      status: { before: previousStatus, after: input.newStatus },
    },
    metadata: {
      ip: ctx.req.ip,
      userAgent: ctx.req.headers['user-agent'],
      sessionId: ctx.session.id,
      reason: input.reason,
    },
  });

  return updatedMatter;
}
```

### Audit Service Interface

```typescript
// src/server/services/audit.ts
interface AuditEmitParams {
  eventType: string;          // Dot-notation: 'matter.created', 'document.approved'
  actorType: 'user' | 'portal_client' | 'system';
  actorId: string;            // UUID of the actor
  resourceType: string;       // Table/entity name: 'matter', 'document', 'filing_packet'
  resourceId: string;         // UUID of the affected resource
  matterId?: string | null;   // Matter context (for cross-reference queries)
  changes: Record<string, { before: unknown; after: unknown }>;  // Field-level diffs
  metadata?: Record<string, unknown>;  // IP, user agent, session ID, etc.
}

class AuditService {
  async emit(params: AuditEmitParams): Promise<void> {
    await this.db.audit_events.create({
      data: {
        event_type: params.eventType,
        actor_type: params.actorType,
        actor_id: params.actorId,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        matter_id: params.matterId ?? null,
        changes: params.changes,
        metadata: params.metadata ?? {},
      },
    });
  }
}
```

### Event Type Naming Convention

```
{module}.{action}

Examples:
  matter.created
  matter.statusChanged
  matter.stageChanged
  matter.closed
  document.created
  document.approved
  document.rejected
  filing.submitted
  filing.accepted
  filing.rejected
  checklist.itemCompleted
  checklist.itemWaived
  financial.entryCreated
  financial.paymentRecorded
  portal.clientLogin
  user.login
  user.roleAssigned
```

### Audit Emission Rules

1. **Every mutation** on a legally significant table must emit at least one audit event.
2. **changes field** must contain before/after values for every field that changed.
3. **metadata field** must include `ip` and `userAgent` for user-initiated actions.
4. **System actions** (BullMQ job completions) use `actorType: 'system'` and a well-known system UUID.
5. **Portal actions** use `actorType: 'portal_client'` and the `portal_access.id` as actorId.
6. Audit emission MUST NOT be skipped even if the business logic throws after the mutation. Use a try/finally pattern or a Prisma middleware that emits on successful writes.

---

## 9. Error Codes

### Standard tRPC Error Codes

| Code | HTTP Status | When Used |
|---|---|---|
| `UNAUTHORIZED` | 401 | No valid session token, user not found, user inactive |
| `FORBIDDEN` | 403 | Valid session but missing required permission, not assigned to matter |
| `NOT_FOUND` | 404 | Resource does not exist or is soft-deleted |
| `BAD_REQUEST` | 400 | Input validation failure (Zod), malformed request |
| `CONFLICT` | 409 | Unique constraint violation (duplicate matter_number, duplicate role assignment) |
| `PRECONDITION_FAILED` | 412 | Gate failure: attorney approval required, checklist items incomplete, filing packet not approved |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error, database failure, external service failure |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded (applied at API gateway level) |

### PRECONDITION_FAILED Usage

This is the most important non-standard code. It is used whenever a business rule gate blocks an action:

```typescript
// Attorney gate
throw new TRPCError({
  code: 'PRECONDITION_FAILED',
  message: 'Only attorneys may approve documents',
});

// Stage gate (checklist items incomplete)
throw new TRPCError({
  code: 'PRECONDITION_FAILED',
  message: 'Cannot advance to stage: 3 required checklist items incomplete',
  cause: {
    gate: 'stage_gate',
    stageId: 'target-stage-uuid',
    incompleteItems: ['item-1', 'item-2', 'item-3'],
  },
});

// Filing gate (attorney approval required)
throw new TRPCError({
  code: 'PRECONDITION_FAILED',
  message: 'Filing packet must be approved by an attorney before court submission',
  cause: {
    gate: 'attorney_approval',
    packetId: 'packet-uuid',
  },
});

// Retainer gate (no retainer deposited)
throw new TRPCError({
  code: 'PRECONDITION_FAILED',
  message: 'Cannot open matter: no retainer deposit recorded',
  cause: {
    gate: 'retainer_deposit',
    matterId: 'matter-uuid',
  },
});
```

The `cause` object is structured so the frontend can display specific, actionable error messages and link to the blocking resource.

---

## 10. Background Job Dispatch

BullMQ is used for asynchronous work triggered by tRPC mutations.

### Two Dispatch Patterns

**Fire-and-forget**: The mutation does not wait for the job to complete. Used for notifications, document generation, and non-critical side effects.

```typescript
// Inside a tRPC mutation
await notificationQueue.add('send', {
  type: 'matter.stageChanged',
  recipientUserIds: assignedStaff.map(a => a.user_id),
  matterId: input.matterId,
  data: { fromStage: previousStage.code, toStage: newStage.code },
});
// Returns immediately -- notification is sent asynchronously
```

**Awaited queue add**: The mutation adds the job and returns a job ID for tracking. Used for long-running operations like document generation where the client may want to poll for completion.

```typescript
// Inside documents.generate mutation
const job = await documentGenerationQueue.add('generate', {
  documentId: input.documentId,
  templateId: document.template_id,
  mergeData: await collectMergeData(document.matter_id),
});

return {
  documentId: input.documentId,
  status: 'generating',
  jobId: job.id,  // Client can poll for completion
};
```

### Queue Naming Convention

```
{module}.{action}

Examples:
  notifications.send
  notifications.send-email
  notifications.send-sms
  documents.generate-from-template
  documents.virus-scan
  filing.submit-to-efiling
  filing.track-submission
  calendar.schedule-reminders
  calendar.check-overdue-deadlines
  checklists.check-dependencies
  audit.archive-old-events
  conflict.run-automated-search
  intake.send-confirmation-email
```

### Job Payload Convention

Every job payload includes:

```typescript
interface BaseJobPayload {
  triggeredBy: {
    actorType: 'user' | 'portal_client' | 'system';
    actorId: string;
  };
  matterId?: string;    // For matter-scoped jobs
  correlationId: string; // For tracing across services (UUID generated at dispatch time)
}
```

---

## Complete Example: matters.updateStatus

This example shows a full tRPC mutation following all conventions.

```typescript
// src/server/routers/matters.ts

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc';
import { authMiddleware, requirePermission, requireMatterAccess, requireAttorney } from '../middleware';
import { auditService } from '../services/audit';
import { notificationQueue } from '../queues/notifications';
import { checklistService } from '../services/checklists';

const updateStatusInput = z.object({
  matterId: z.string().uuid('Invalid matter ID'),
  newStatus: z.enum(['active', 'on_hold', 'closed', 'archived']),
  reason: z.string().min(1).max(2000).optional(),
});

export const updateStatus = publicProcedure
  // Middleware chain: auth -> permission -> attorney (for close/hold) -> matter scope
  .use(authMiddleware)
  .use(requirePermission('matter:update'))
  .use(requireMatterAccess)
  .input(updateStatusInput)
  .mutation(async ({ ctx, input }) => {
    // 1. Load current matter
    const matter = await ctx.db.matters.findUnique({
      where: { id: input.matterId, deleted_at: null },
      include: {
        matter_assignments: { where: { removed_at: null } },
        current_stage: true,
      },
    });

    if (!matter) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Matter ${input.matterId} not found`,
      });
    }

    // 2. Validate transition rules
    const validTransitions: Record<string, string[]> = {
      active: ['on_hold', 'closed'],
      on_hold: ['active'],
      closed: ['archived'],
      archived: [], // terminal state
    };

    if (!validTransitions[matter.status]?.includes(input.newStatus)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot transition from '${matter.status}' to '${input.newStatus}'`,
      });
    }

    // 3. Attorney gate for close and hold
    if (input.newStatus === 'on_hold' || input.newStatus === 'closed') {
      if (!ctx.user.is_attorney) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Transitioning to '${input.newStatus}' requires attorney authorization`,
        });
      }
    }

    // 4. Stage gate check for closure
    if (input.newStatus === 'closed') {
      const gateResult = await checklistService.stageGateCheck(input.matterId, 'close');
      if (!gateResult.passed) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot close matter: ${gateResult.incompleteItems.length} required checklist items incomplete`,
          cause: {
            gate: 'stage_gate',
            incompleteItems: gateResult.incompleteItems,
          },
        });
      }

      if (!input.reason) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Reason is required when closing a matter',
        });
      }
    }

    // 5. Perform the update
    const previousStatus = matter.status;
    const now = new Date();

    const updatedMatter = await ctx.db.matters.update({
      where: { id: input.matterId },
      data: {
        status: input.newStatus,
        updated_at: now,
        ...(input.newStatus === 'closed' ? { closed_at: now } : {}),
        ...(input.newStatus === 'archived' ? { archived_at: now } : {}),
      },
      include: {
        matter_type: true,
        current_stage: true,
        matter_assignments: {
          where: { removed_at: null },
          include: { user: { select: { id: true, first_name: true, last_name: true, email: true } } },
        },
      },
    });

    // 6. Emit audit event (MANDATORY)
    await auditService.emit({
      eventType: 'matter.statusChanged',
      actorType: 'user',
      actorId: ctx.user.id,
      resourceType: 'matter',
      resourceId: input.matterId,
      matterId: input.matterId,
      changes: {
        status: { before: previousStatus, after: input.newStatus },
        ...(input.newStatus === 'closed' ? { closed_at: { before: null, after: now.toISOString() } } : {}),
        ...(input.newStatus === 'archived' ? { archived_at: { before: null, after: now.toISOString() } } : {}),
      },
      metadata: {
        ip: ctx.req.ip,
        userAgent: ctx.req.headers['user-agent'],
        sessionId: ctx.session.id,
        reason: input.reason,
      },
    });

    // 7. Dispatch notifications (fire-and-forget)
    const recipientIds = updatedMatter.matter_assignments.map(a => a.user.id);
    await notificationQueue.add('send', {
      type: `matter.${input.newStatus === 'on_hold' ? 'held' : input.newStatus}`,
      recipientUserIds: recipientIds,
      matterId: input.matterId,
      data: {
        matterNumber: updatedMatter.matter_number,
        matterTitle: updatedMatter.title,
        previousStatus,
        newStatus: input.newStatus,
        changedBy: `${ctx.user.first_name} ${ctx.user.last_name}`,
        reason: input.reason,
      },
      triggeredBy: { actorType: 'user', actorId: ctx.user.id },
      correlationId: crypto.randomUUID(),
    });

    // 8. Return the updated matter
    return updatedMatter;
  });
```

This example demonstrates:
- **Input validation** with Zod (UUID format, enum constraint, optional string with length bounds)
- **Auth check** via `authMiddleware` (session verification, user loading)
- **Permission check** via `requirePermission('matter:update')`
- **Matter scope check** via `requireMatterAccess`
- **Business logic**: valid transition check, attorney gate, stage gate
- **Audit emission**: full before/after changes, metadata with IP and session
- **Notification dispatch**: fire-and-forget BullMQ job
- **Response**: full updated matter object with included relations
