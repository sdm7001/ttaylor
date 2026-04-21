/**
 * Filing tRPC router.
 *
 * Handles filing packet CRUD, document attachment, validation,
 * attorney approval workflow, and court submission dispatch.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { type FilingPacketStatus } from '@prisma/client';
import { router, protectedProcedure, requirePermission, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';
import { PERMISSIONS } from '@ttaylor/auth';

// ---------------------------------------------------------------------------
// Zod enums matching Prisma FilingPacketStatus
// ---------------------------------------------------------------------------

const filingPacketStatusValues = [
  'ASSEMBLING',
  'DOCUMENTS_COMPLETE',
  'READY_FOR_ATTORNEY_REVIEW',
  'ATTORNEY_APPROVED',
  'ATTORNEY_REJECTED',
  'SUBMITTED_TO_COURT',
  'ACCEPTED',
  'REJECTED_BY_COURT',
  'DEFICIENCY_NOTICE',
  'CORRECTING',
  'ARCHIVED',
] as const;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

interface ValidationResult {
  valid: boolean;
  issues: string[];
}

async function validatePacketInternal(
  prisma: Parameters<Parameters<typeof protectedProcedure.query>[0]>['ctx']['prisma'],
  packetId: string,
): Promise<ValidationResult> {
  const packet = await prisma.filingPacket.findUnique({
    where: { id: packetId },
    include: {
      items: {
        include: {
          document: true,
        },
      },
    },
  });

  if (!packet) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Filing packet ${packetId} not found`,
    });
  }

  const issues: string[] = [];

  // Must have at least one item
  if (packet.items.length === 0) {
    issues.push('Filing packet must contain at least one document');
  }

  // Must have exactly one lead document
  const leadDocs = packet.items.filter((item: { isLeadDocument?: boolean }) => item.isLeadDocument === true);
  if (leadDocs.length === 0) {
    issues.push('Filing packet must have exactly one lead document');
  } else if (leadDocs.length > 1) {
    issues.push(`Filing packet has ${leadDocs.length} lead documents; exactly one is required`);
  }

  // All documents must be ATTORNEY_APPROVED (using APPROVED from Prisma which maps to attorney-approved)
  for (const item of packet.items) {
    const doc = item.document;
    if (doc && doc.lifecycleStatus !== 'APPROVED') {
      issues.push(
        `Document "${doc.title}" is in ${doc.lifecycleStatus} status; must be attorney-approved before filing`,
      );
    }
  }

  // Must have cause number
  if (!packet.causeNumber) {
    issues.push('Filing packet must have a cause number');
  }

  // Must have court name
  if (!packet.courtName) {
    issues.push('Filing packet must have a court name');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const filingRouter = router({
  /**
   * Create a new filing packet in ASSEMBLING status.
   * Requires PARALEGAL or higher role.
   */
  createPacket: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY', 'ADMIN'))
    .use(requirePermission(PERMISSIONS.FILING_CREATE))
    .input(
      z.object({
        matterId: z.string().cuid(),
        title: z.string().min(1).max(500),
        filingType: z.string().min(1).max(200),
        courtName: z.string().min(1).max(200),
        causeNumber: z.string().min(1).max(100),
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

      const packet = await ctx.prisma.filingPacket.create({
        data: {
          matterId: input.matterId,
          title: input.title,
          filingType: input.filingType,
          courtName: input.courtName,
          causeNumber: input.causeNumber,
          status: 'ASSEMBLING',
          preparedByUserId: ctx.userId,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'FilingPacket',
        entityId: packet.id,
        metadata: {
          matterId: input.matterId,
          filingType: input.filingType,
          courtName: input.courtName,
          causeNumber: input.causeNumber,
        },
      });

      return packet;
    }),

  /**
   * Get a single filing packet by ID with items and submission history.
   */
  getPacket: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const packet = await ctx.prisma.filingPacket.findUnique({
        where: { id: input.id },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              document: {
                select: {
                  id: true,
                  title: true,
                  lifecycleStatus: true,
                  createdAt: true,
                },
              },
            },
          },
          submissions: {
            orderBy: { submittedAt: 'desc' },
          },
          preparedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      if (!packet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Filing packet ${input.id} not found`,
        });
      }

      return packet;
    }),

  /**
   * List filing packets for a matter with optional status filter.
   */
  listPackets: protectedProcedure
    .input(
      z.object({
        matterId: z.string().cuid(),
        status: z.enum(filingPacketStatusValues).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { matterId: input.matterId };
      if (input.status) where.status = input.status;

      const packets = await ctx.prisma.filingPacket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: { id: true, isLeadDocument: true },
          },
          preparedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      return packets;
    }),

  /**
   * Add a document to a filing packet.
   * Validates the document is in APPROVED (attorney-approved) status.
   * If isLeadDocument is true, unsets lead flag on all other items.
   */
  addDocument: protectedProcedure
    .use(requirePermission(PERMISSIONS.FILING_CREATE))
    .input(
      z.object({
        packetId: z.string().cuid(),
        documentId: z.string().cuid(),
        isLeadDocument: z.boolean(),
        order: z.number().int().min(0),
        filingCode: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify packet exists and is in ASSEMBLING status
      const packet = await ctx.prisma.filingPacket.findUnique({
        where: { id: input.packetId },
      });

      if (!packet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Filing packet ${input.packetId} not found`,
        });
      }

      if (packet.status !== 'ASSEMBLING') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot add documents to a packet in '${packet.status}' status; must be ASSEMBLING`,
        });
      }

      // Verify document exists and is APPROVED (attorney-approved)
      const document = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document ${input.documentId} not found`,
        });
      }

      if (document.lifecycleStatus !== 'APPROVED') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Document must be in ATTORNEY_APPROVED status to be added to a filing packet; current status is '${document.lifecycleStatus}'`,
        });
      }

      // If this is the lead document, unset lead flag on all other items
      if (input.isLeadDocument) {
        await ctx.prisma.filingPacketItem.updateMany({
          where: {
            packetId: input.packetId,
            isLeadDocument: true,
          },
          data: { isLeadDocument: false },
        });
      }

      const item = await ctx.prisma.filingPacketItem.create({
        data: {
          packetId: input.packetId,
          documentId: input.documentId,
          isLeadDocument: input.isLeadDocument,
          sortOrder: input.order,
          filingCode: input.filingCode ?? null,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'FilingPacket',
        entityId: input.packetId,
        metadata: {
          action: 'addDocument',
          documentId: input.documentId,
          isLeadDocument: input.isLeadDocument,
          filingCode: input.filingCode,
        },
      });

      return item;
    }),

  /**
   * Validate a filing packet against Harris County requirements.
   *
   * Checks:
   * - Exactly one lead document
   * - All documents are attorney-approved
   * - Cause number present
   * - Court name present
   * - At least one item in the packet
   */
  validatePacket: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return validatePacketInternal(ctx.prisma, input.id);
    }),

  /**
   * Submit filing packet for attorney review.
   * Validates the packet first -- throws PRECONDITION_FAILED if invalid.
   * Transitions to READY_FOR_ATTORNEY_REVIEW.
   */
  submitForAttorneyReview: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY', 'ADMIN'))
    .use(requirePermission(PERMISSIONS.FILING_SUBMIT_ATTORNEY))
    .input(
      z.object({
        id: z.string().cuid(),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate the packet first
      const validation = await validatePacketInternal(ctx.prisma, input.id);

      if (!validation.valid) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Filing packet validation failed: ${validation.issues.join('; ')}`,
        });
      }

      const packet = await ctx.prisma.filingPacket.findUnique({
        where: { id: input.id },
        include: {
          matter: {
            select: { assignedAttorneyId: true },
          },
        },
      });

      if (!packet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Filing packet ${input.id} not found`,
        });
      }

      if (packet.status !== 'ASSEMBLING' && packet.status !== 'ATTORNEY_REJECTED') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot submit for review: packet is in '${packet.status}' status`,
        });
      }

      // Transition to READY_FOR_ATTORNEY_REVIEW
      const updated = await ctx.prisma.filingPacket.update({
        where: { id: input.id },
        data: {
          status: 'READY_FOR_ATTORNEY_REVIEW',
        },
      });

      // Create notification for assigned attorney (placeholder -- actual notification
      // system is future work; we record the intent in the audit event)
      // TODO: Integrate with notification system when available

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'FilingPacket',
        entityId: input.id,
        metadata: {
          action: 'submitForAttorneyReview',
          note: input.note,
          oldStatus: packet.status,
          newStatus: 'READY_FOR_ATTORNEY_REVIEW',
          assignedAttorneyId: packet.matter?.assignedAttorneyId,
        },
      });

      return updated;
    }),

  /**
   * Attorney approves a filing packet.
   * Only ATTORNEY role may call this.
   * Transitions to ATTORNEY_APPROVED and records approval metadata.
   */
  attorneyApprove: protectedProcedure
    .use(requireRole('ATTORNEY'))
    .use(requirePermission(PERMISSIONS.FILING_APPROVE_ATTORNEY))
    .input(
      z.object({
        id: z.string().cuid(),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const packet = await ctx.prisma.filingPacket.findUnique({
        where: { id: input.id },
      });

      if (!packet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Filing packet ${input.id} not found`,
        });
      }

      if (packet.status !== 'READY_FOR_ATTORNEY_REVIEW') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot approve: packet is in '${packet.status}' status, expected 'READY_FOR_ATTORNEY_REVIEW'`,
        });
      }

      const now = new Date();

      const updated = await ctx.prisma.filingPacket.update({
        where: { id: input.id },
        data: {
          status: 'ATTORNEY_APPROVED',
          approvedByUserId: ctx.userId,
          approvedAt: now,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'APPROVED',
        actorId: ctx.userId,
        entityType: 'FilingPacket',
        entityId: input.id,
        metadata: {
          action: 'attorneyApprove',
          note: input.note,
          approvedAt: now.toISOString(),
        },
      });

      return updated;
    }),

  /**
   * Attorney rejects a filing packet.
   * Only ATTORNEY role may call this.
   * Transitions to ATTORNEY_REJECTED.
   */
  attorneyReject: protectedProcedure
    .use(requireRole('ATTORNEY'))
    .use(requirePermission(PERMISSIONS.FILING_APPROVE_ATTORNEY))
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const packet = await ctx.prisma.filingPacket.findUnique({
        where: { id: input.id },
      });

      if (!packet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Filing packet ${input.id} not found`,
        });
      }

      if (packet.status !== 'READY_FOR_ATTORNEY_REVIEW') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot reject: packet is in '${packet.status}' status, expected 'READY_FOR_ATTORNEY_REVIEW'`,
        });
      }

      const updated = await ctx.prisma.filingPacket.update({
        where: { id: input.id },
        data: {
          status: 'ATTORNEY_REJECTED',
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'REJECTED',
        actorId: ctx.userId,
        entityType: 'FilingPacket',
        entityId: input.id,
        metadata: {
          action: 'attorneyReject',
          reason: input.reason,
        },
      });

      return updated;
    }),

  /**
   * Submit a filing packet to the court.
   * Only ATTORNEY role may call this.
   * Validates the packet is ATTORNEY_APPROVED before submission.
   * Creates a filing_submission record and dispatches a BullMQ job.
   */
  submitToCourt: protectedProcedure
    .use(requireRole('ATTORNEY'))
    .use(requirePermission(PERMISSIONS.FILING_SUBMIT_COURT))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const packet = await ctx.prisma.filingPacket.findUnique({
        where: { id: input.id },
      });

      if (!packet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Filing packet ${input.id} not found`,
        });
      }

      if (packet.status !== 'ATTORNEY_APPROVED') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot submit to court: packet is in '${packet.status}' status, expected 'ATTORNEY_APPROVED'`,
        });
      }

      const now = new Date();

      // Create filing submission record
      const submission = await ctx.prisma.filingSubmission.create({
        data: {
          packetId: input.id,
          submittedByUserId: ctx.userId,
          submittedAt: now,
          accepted: null, // pending court response
        },
      });

      // Transition packet to SUBMITTED_TO_COURT
      const updated = await ctx.prisma.filingPacket.update({
        where: { id: input.id },
        data: {
          status: 'SUBMITTED_TO_COURT',
        },
      });

      // Dispatch BullMQ job for actual eFileTexas integration (placeholder).
      // In production this would be:
      // await filingQueue.add('filing:submit', {
      //   packetId: input.id,
      //   submissionId: submission.id,
      //   triggeredBy: { actorType: 'user', actorId: ctx.userId },
      //   correlationId: crypto.randomUUID(),
      // });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'FILED',
        actorId: ctx.userId,
        entityType: 'FilingPacket',
        entityId: input.id,
        metadata: {
          action: 'submitToCourt',
          submissionId: submission.id,
          submittedAt: now.toISOString(),
        },
      });

      return { ...updated, submissionId: submission.id };
    }),
});
