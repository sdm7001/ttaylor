/**
 * Discovery tRPC router.
 *
 * Handles discovery requests, items, and response tracking for matters.
 * Discovery in family law includes interrogatories, requests for production,
 * requests for admissions, subpoenas, and deposition notices.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const discoveryRequestTypeValues = [
  'INTERROGATORIES',
  'REQUEST_FOR_PRODUCTION',
  'REQUEST_FOR_ADMISSIONS',
  'SUBPOENA',
  'DEPOSITION_NOTICE',
] as const;

const discoveryStatusValues = [
  'PENDING',
  'RESPONDED',
  'OVERDUE',
  'OBJECTED',
  'WITHDRAWN',
] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const discoveryRouter = router({
  /**
   * List all discovery requests across all matters (aggregate queue view).
   * Powers the discovery queue page. Includes matter info, type, status, due date.
   * Cursor-based pagination.
   */
  listQueue: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        cursor: z.string().cuid().nullish(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { type, status, cursor, limit } = input;

      const where: Record<string, unknown> = {};
      if (type) where.requestType = type;
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        ctx.prisma.discoveryRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            matter: {
              select: { id: true, title: true, causeNumber: true },
            },
            responses: {
              select: { id: true },
            },
          },
        }),
        ctx.prisma.discoveryRequest.count({ where }),
      ]);

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return {
        items: items.map((req) => ({
          id: req.id,
          requestType: req.requestType,
          status: req.status,
          dueAt: req.dueAt,
          servedAt: req.servedAt,
          matter: req.matter,
          responseCount: req.responses.length,
          createdAt: req.createdAt,
        })),
        nextCursor,
        total,
      };
    }),

  /**
   * List discovery requests for a matter with optional filters.
   * Cursor-based pagination.
   */
  listRequests: protectedProcedure
    .input(
      z.object({
        matterId: z.string().cuid(),
        type: z.string().optional(),
        status: z.string().optional(),
        cursor: z.string().cuid().nullish(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { matterId, type, status, cursor, limit } = input;

      const where: Record<string, unknown> = { matterId };
      if (type) where.requestType = type;
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        ctx.prisma.discoveryRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            responses: true,
          },
        }),
        ctx.prisma.discoveryRequest.count({ where }),
      ]);

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor, total };
    }),

  /**
   * Create a new discovery request. Requires PARALEGAL, ATTORNEY, or ADMIN role.
   */
  createRequest: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY', 'ADMIN'))
    .input(
      z.object({
        matterId: z.string().cuid(),
        requestType: z.enum(discoveryRequestTypeValues),
        title: z.string().min(1).max(255),
        servedOn: z.string().min(1).max(255),
        servedAt: z.date(),
        responseDeadline: z.date(),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify matter exists
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      // Determine initial status -- if responseDeadline is already past, mark OVERDUE
      const now = new Date();
      const initialStatus = input.responseDeadline < now ? 'OVERDUE' : 'PENDING';

      const request = await ctx.prisma.discoveryRequest.create({
        data: {
          matterId: input.matterId,
          requestType: input.requestType,
          servedAt: input.servedAt,
          dueAt: input.responseDeadline,
          status: initialStatus,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'DiscoveryRequest',
        entityId: request.id,
        metadata: {
          matterId: input.matterId,
          requestType: input.requestType,
          title: input.title,
          servedOn: input.servedOn,
          responseDeadline: input.responseDeadline.toISOString(),
          notes: input.notes,
        },
      });

      return request;
    }),

  /**
   * Update discovery request status.
   * Automatically checks if overdue based on responseDeadline vs now.
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(discoveryStatusValues),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.discoveryRequest.findUnique({
        where: { id: input.id },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Discovery request ${input.id} not found`,
        });
      }

      const oldStatus = request.status;

      // If the caller sets status to PENDING but the deadline has passed,
      // override to OVERDUE to prevent stale status
      let effectiveStatus: string = input.status;
      if (input.status === 'PENDING' && request.dueAt && request.dueAt < new Date()) {
        effectiveStatus = 'OVERDUE';
      }

      const updated = await ctx.prisma.discoveryRequest.update({
        where: { id: input.id },
        data: { status: effectiveStatus },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'DiscoveryRequest',
        entityId: input.id,
        metadata: {
          oldStatus,
          newStatus: effectiveStatus,
          note: input.note,
        },
      });

      return updated;
    }),

  /**
   * Add an individual discovery item (line item within a request).
   */
  addItem: protectedProcedure
    .input(
      z.object({
        requestId: z.string().cuid(),
        itemNumber: z.string().min(1).max(50),
        description: z.string().min(1).max(2000),
        status: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the parent request exists and get its matterId
      const request = await ctx.prisma.discoveryRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Discovery request ${input.requestId} not found`,
        });
      }

      const item = await ctx.prisma.discoveryItem.create({
        data: {
          matterId: request.matterId,
          category: input.itemNumber,
          title: input.description,
          status: input.status ?? 'pending',
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'DiscoveryItem',
        entityId: item.id,
        metadata: {
          requestId: input.requestId,
          itemNumber: input.itemNumber,
          description: input.description,
        },
      });

      return item;
    }),

  /**
   * Track a response to a discovery request.
   * Creates or updates the discovery response record and marks the
   * parent request status as RESPONDED.
   */
  trackResponse: protectedProcedure
    .input(
      z.object({
        requestId: z.string().cuid(),
        respondedAt: z.date(),
        notes: z.string().max(5000).optional(),
        documentId: z.string().cuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.discoveryRequest.findUnique({
        where: { id: input.requestId },
        include: { responses: true },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Discovery request ${input.requestId} not found`,
        });
      }

      // Upsert the response -- if one already exists for this request, update it
      let response;
      const existing = request.responses[0];

      if (existing) {
        response = await ctx.prisma.discoveryResponse.update({
          where: { id: existing.id },
          data: {
            receivedAt: input.respondedAt,
            completenessStatus: 'complete',
            deficiencyNote: input.notes ?? null,
          },
        });
      } else {
        response = await ctx.prisma.discoveryResponse.create({
          data: {
            discoveryRequestId: input.requestId,
            receivedAt: input.respondedAt,
            completenessStatus: 'complete',
            deficiencyNote: input.notes ?? null,
          },
        });
      }

      // Update parent request status to RESPONDED
      await ctx.prisma.discoveryRequest.update({
        where: { id: input.requestId },
        data: { status: 'RESPONDED' },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'DiscoveryRequest',
        entityId: input.requestId,
        metadata: {
          action: 'response_tracked',
          respondedAt: input.respondedAt.toISOString(),
          documentId: input.documentId,
          notes: input.notes,
        },
      });

      return response;
    }),
});
