/**
 * Documents tRPC router.
 *
 * Handles document CRUD, generation dispatch, review workflow,
 * and attorney approval/rejection.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { type DocumentLifecycle } from '@prisma/client';
import { router, protectedProcedure, requirePermission, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';
import { PERMISSIONS } from '@ttaylor/auth';

// ---------------------------------------------------------------------------
// Zod enums matching Prisma DocumentLifecycle
// ---------------------------------------------------------------------------

const documentLifecycleValues = [
  'DRAFT', 'GENERATED', 'INTERNAL_REVIEW', 'ATTORNEY_REVIEW_REQUIRED',
  'APPROVED', 'SIGNED', 'FILED', 'REJECTED', 'SUPERSEDED', 'ARCHIVED',
] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const documentsRouter = router({
  /**
   * List available document templates, optionally filtered by matter type.
   */
  listTemplates: protectedProcedure
    .input(z.object({ matterTypeId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.template.findMany({
        where: input.matterTypeId
          ? { applicableMatterTypes: { has: input.matterTypeId } }
          : undefined,
        orderBy: { name: 'asc' },
      });
    }),

  /**
   * List documents for a matter with optional status filter.
   */
  list: protectedProcedure
    .use(requirePermission(PERMISSIONS.DOCUMENTS_CREATE)) // read access implied by create
    .input(
      z.object({
        matterId: z.string().cuid(),
        status: z.enum(documentLifecycleValues).optional(),
        cursor: z.string().cuid().nullish(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { matterId, status, cursor, limit } = input;

      const where: Record<string, unknown> = { matterId };
      if (status) where.lifecycleStatus = status;

      const [items, total] = await Promise.all([
        ctx.prisma.document.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            template: { select: { id: true, name: true, code: true } },
          },
        }),
        ctx.prisma.document.count({ where }),
      ]);

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor, total };
    }),

  /**
   * Get a single document by ID with versions and approvals.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
        include: {
          template: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            include: {
              approvals: {
                include: {
                  decidedBy: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document ${input.id} not found`,
        });
      }

      return document;
    }),

  /**
   * Generate a document from a template.
   *
   * Creates a Document record in DRAFT status and dispatches a
   * BullMQ job for asynchronous generation. The client polls for
   * the lifecycle status to change to GENERATED.
   */
  generate: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY', 'LEGAL_ASSISTANT'))
    .use(requirePermission(PERMISSIONS.DOCUMENTS_GENERATE))
    .input(
      z.object({
        matterId: z.string().cuid(),
        templateId: z.string().cuid(),
        mergeData: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify matter exists
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });
      if (!matter) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Matter ${input.matterId} not found` });
      }

      // Verify template exists
      const template = await ctx.prisma.template.findUnique({
        where: { id: input.templateId },
      });
      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Template ${input.templateId} not found` });
      }

      // Create document in DRAFT status
      const document = await ctx.prisma.document.create({
        data: {
          matterId: input.matterId,
          templateId: input.templateId,
          documentType: template.category,
          title: `${template.name} - ${matter.title}`,
          lifecycleStatus: 'DRAFT',
          createdByUserId: ctx.userId,
        },
      });

      // Create initial version record
      await ctx.prisma.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: 1,
          sourcePayloadJson: input.mergeData,
          generatedByUserId: ctx.userId,
        },
      });

      // In a full implementation, we would dispatch a BullMQ job here:
      // await documentGenerationQueue.add('documents:generate', {
      //   documentId: document.id,
      //   templateId: input.templateId,
      //   mergeData: input.mergeData,
      //   triggeredBy: { actorType: 'user', actorId: ctx.userId },
      //   correlationId: crypto.randomUUID(),
      // });
      //
      // For Phase 4 scaffold, we mark the document as GENERATED immediately.
      await ctx.prisma.document.update({
        where: { id: document.id },
        data: { lifecycleStatus: 'GENERATED' },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Document',
        entityId: document.id,
        metadata: {
          matterId: input.matterId,
          templateId: input.templateId,
        },
      });

      return ctx.prisma.document.findUniqueOrThrow({
        where: { id: document.id },
        include: { template: true, versions: true },
      });
    }),

  /**
   * Submit a document for review.
   *
   * Transitions from GENERATED to INTERNAL_REVIEW or ATTORNEY_REVIEW_REQUIRED.
   */
  submitForReview: protectedProcedure
    .use(requirePermission(PERMISSIONS.DOCUMENTS_REVIEW))
    .input(
      z.object({
        id: z.string().cuid(),
        reviewType: z.enum(['INTERNAL', 'ATTORNEY']),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Document ${input.id} not found` });
      }

      if (document.lifecycleStatus !== 'GENERATED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot submit for review: document is in '${document.lifecycleStatus}' status, expected 'GENERATED'`,
        });
      }

      const newStatus: DocumentLifecycle =
        input.reviewType === 'INTERNAL' ? 'INTERNAL_REVIEW' : 'ATTORNEY_REVIEW_REQUIRED';

      const updated = await ctx.prisma.document.update({
        where: { id: input.id },
        data: { lifecycleStatus: newStatus },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'Document',
        entityId: input.id,
        metadata: {
          action: 'submitForReview',
          reviewType: input.reviewType,
          oldStatus: document.lifecycleStatus,
          newStatus,
          note: input.note,
        },
      });

      return updated;
    }),

  /**
   * Approve a document. ATTORNEY only.
   *
   * Creates a DocumentApproval record and transitions to APPROVED.
   */
  approve: protectedProcedure
    .use(requireRole('ATTORNEY'))
    .use(requirePermission(PERMISSIONS.DOCUMENTS_APPROVE))
    .input(
      z.object({
        id: z.string().cuid(),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
        include: {
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Document ${input.id} not found` });
      }

      const reviewStatuses: DocumentLifecycle[] = ['INTERNAL_REVIEW', 'ATTORNEY_REVIEW_REQUIRED'];
      if (!reviewStatuses.includes(document.lifecycleStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot approve: document is in '${document.lifecycleStatus}' status`,
        });
      }

      const latestVersion = document.versions[0];
      if (!latestVersion) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'No document version exists to approve',
        });
      }

      // Create approval record
      await ctx.prisma.documentApproval.create({
        data: {
          documentVersionId: latestVersion.id,
          approvalType: 'ATTORNEY_APPROVAL',
          decidedByUserId: ctx.userId,
          decision: 'APPROVED',
          decidedAt: new Date(),
          note: input.note,
        },
      });

      // Transition to APPROVED
      const updated = await ctx.prisma.document.update({
        where: { id: input.id },
        data: { lifecycleStatus: 'APPROVED' },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'APPROVED',
        actorId: ctx.userId,
        entityType: 'Document',
        entityId: input.id,
        metadata: {
          versionId: latestVersion.id,
          note: input.note,
        },
      });

      return updated;
    }),

  /**
   * Reject a document. ATTORNEY only.
   *
   * Creates a DocumentApproval record with rejection and transitions to REJECTED.
   */
  reject: protectedProcedure
    .use(requireRole('ATTORNEY'))
    .use(requirePermission(PERMISSIONS.DOCUMENTS_REJECT))
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.id },
        include: {
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Document ${input.id} not found` });
      }

      const reviewStatuses: DocumentLifecycle[] = ['INTERNAL_REVIEW', 'ATTORNEY_REVIEW_REQUIRED'];
      if (!reviewStatuses.includes(document.lifecycleStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot reject: document is in '${document.lifecycleStatus}' status`,
        });
      }

      const latestVersion = document.versions[0];
      if (!latestVersion) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'No document version exists to reject',
        });
      }

      // Create rejection record
      await ctx.prisma.documentApproval.create({
        data: {
          documentVersionId: latestVersion.id,
          approvalType: 'ATTORNEY_APPROVAL',
          decidedByUserId: ctx.userId,
          decision: 'REJECTED',
          decidedAt: new Date(),
          note: input.reason,
        },
      });

      // Transition to REJECTED
      const updated = await ctx.prisma.document.update({
        where: { id: input.id },
        data: { lifecycleStatus: 'REJECTED' },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'REJECTED',
        actorId: ctx.userId,
        entityType: 'Document',
        entityId: input.id,
        metadata: {
          versionId: latestVersion.id,
          reason: input.reason,
        },
      });

      return updated;
    }),
});
