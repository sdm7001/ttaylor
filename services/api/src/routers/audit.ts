/**
 * Audit router and audit emission service function.
 *
 * The `emitAuditEvent` function is a service-level helper called by
 * every mutation that modifies domain data. It is NOT exposed as a
 * tRPC route.
 *
 * The `auditRouter` exposes a read-only `list` procedure restricted
 * to ADMIN or ATTORNEY roles.
 */
import { type PrismaClient, type AuditEventType } from '@prisma/client';
import { z } from 'zod';
import { router, protectedProcedure, requireRole } from '../trpc';

// ---------------------------------------------------------------------------
// Service function -- called from other routers
// ---------------------------------------------------------------------------

export interface AuditEventParams {
  eventType: AuditEventType;
  actorId: string;
  entityType: string;
  entityId: string;
  matterId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Emit an audit event to the audit_events table.
 *
 * Called from every mutation that modifies legally significant data.
 * This is intentionally a plain async function, not a tRPC procedure,
 * so it can be called directly from other routers without HTTP overhead.
 */
export async function emitAuditEvent(
  prisma: PrismaClient,
  params: AuditEventParams,
): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      eventType: params.eventType,
      actorUserId: params.actorId,
      payloadJson: (params.metadata as Record<string, unknown>) ?? {},
    },
  });
}

// ---------------------------------------------------------------------------
// tRPC router -- read-only audit log
// ---------------------------------------------------------------------------

const auditEventTypeValues = [
  'CREATED',
  'UPDATED',
  'DELETED',
  'STAGE_CHANGED',
  'APPROVED',
  'REJECTED',
  'FILED',
  'ACCESSED',
  'EXPORTED',
  'PERMISSION_CHANGED',
  'CONFLICT_CLEARED',
  'PORTAL_INVITED',
] as const;

export const auditRouter = router({
  /**
   * List audit events with optional filters.
   * Restricted to ADMIN or ATTORNEY.
   */
  list: protectedProcedure
    .use(requireRole('ADMIN', 'ATTORNEY'))
    .input(
      z.object({
        matterId: z.string().cuid().optional(),
        actorId: z.string().cuid().optional(),
        eventType: z.enum(auditEventTypeValues).optional(),
        cursor: z.string().cuid().nullish(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { matterId, actorId, eventType, cursor, limit } = input;

      const where: Record<string, unknown> = {};
      if (actorId) where.actorUserId = actorId;
      if (eventType) where.eventType = eventType;

      // Filter by matterId via entityType + entityId if provided.
      // Audit events that reference a matter directly have entityType = 'Matter'.
      // For a broader matter filter we search payloadJson, but for Phase 4
      // we filter on entityType/entityId when matterId is given.
      if (matterId) {
        where.entityType = 'Matter';
        where.entityId = matterId;
      }

      const [items, total] = await Promise.all([
        ctx.prisma.auditEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
        ctx.prisma.auditEvent.count({ where }),
      ]);

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor, total };
    }),
});
