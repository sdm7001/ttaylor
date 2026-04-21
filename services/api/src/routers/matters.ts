/**
 * Matters tRPC router.
 *
 * Handles CRUD and status transitions for legal matters.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { type MatterStatus } from '@prisma/client';
import { router, protectedProcedure, requirePermission, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';
import { PERMISSIONS } from '@ttaylor/auth';

// ---------------------------------------------------------------------------
// Status transition state machine
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, MatterStatus[]> = {
  LEAD_PENDING: ['CONFLICT_REVIEW'],
  CONFLICT_REVIEW: ['CONSULTATION_COMPLETED', 'LEAD_PENDING'],
  CONSULTATION_COMPLETED: ['RETAINED', 'LEAD_PENDING'],
  RETAINED: ['OPEN_ACTIVE'],
  OPEN_ACTIVE: ['AWAITING_FILING', 'AWAITING_SERVICE', 'IN_DISCOVERY', 'IN_MEDIATION', 'AWAITING_HEARING', 'CLOSED'],
  AWAITING_FILING: ['AWAITING_SERVICE', 'OPEN_ACTIVE'],
  AWAITING_SERVICE: ['IN_DISCOVERY', 'OPEN_ACTIVE'],
  IN_DISCOVERY: ['IN_MEDIATION', 'AWAITING_HEARING', 'OPEN_ACTIVE'],
  IN_MEDIATION: ['AWAITING_HEARING', 'AWAITING_FINAL_ORDER', 'OPEN_ACTIVE'],
  AWAITING_HEARING: ['AWAITING_FINAL_ORDER', 'OPEN_ACTIVE'],
  AWAITING_FINAL_ORDER: ['POST_ORDER_MONITORING', 'CLOSED'],
  POST_ORDER_MONITORING: ['CLOSED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
};

/** Transitions that require the caller to hold ATTORNEY role. */
const ATTORNEY_REQUIRED_STATUSES: MatterStatus[] = ['CLOSED', 'ARCHIVED'];

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const matterStatusValues = [
  'LEAD_PENDING', 'CONFLICT_REVIEW', 'CONSULTATION_COMPLETED', 'RETAINED',
  'OPEN_ACTIVE', 'AWAITING_FILING', 'AWAITING_SERVICE', 'IN_DISCOVERY',
  'IN_MEDIATION', 'AWAITING_HEARING', 'AWAITING_FINAL_ORDER',
  'POST_ORDER_MONITORING', 'CLOSED', 'ARCHIVED',
] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const mattersRouter = router({
  /**
   * List matters with optional status and assignment filters.
   * Cursor-based pagination.
   */
  list: protectedProcedure
    .use(requirePermission(PERMISSIONS.MATTERS_READ_ASSIGNED))
    .input(
      z.object({
        status: z.enum(matterStatusValues).optional(),
        assignedToMe: z.boolean().optional(),
        cursor: z.string().cuid().nullish(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, assignedToMe, cursor, limit } = input;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (assignedToMe) {
        where.assignments = {
          some: { userId: ctx.userId },
        };
      }

      const [items, total] = await Promise.all([
        ctx.prisma.matter.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            matterType: true,
            assignments: {
              include: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        }),
        ctx.prisma.matter.count({ where }),
      ]);

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor, total };
    }),

  /**
   * Get a single matter by ID with relations.
   */
  getById: protectedProcedure
    .use(requirePermission(PERMISSIONS.MATTERS_READ_ASSIGNED))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.id },
        include: {
          matterType: true,
          currentStage: true,
          assignments: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
          parties: {
            include: { contact: true },
          },
          documents: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          checklistInstances: {
            include: {
              template: true,
              items: { orderBy: { checklistTemplateItemId: 'asc' } },
            },
            take: 5,
          },
        },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.id} not found`,
        });
      }

      // If matter has a restrictive confidentialityLevel and caller is not assigned, deny
      if (matter.confidentialityLevel === 'RESTRICTED') {
        const isAssigned = matter.assignments.some((a) => a.userId === ctx.userId);
        if (!isAssigned) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You are not assigned to this restricted matter',
          });
        }
      }

      return matter;
    }),

  /**
   * Create a new matter. Requires ATTORNEY or PARALEGAL role.
   */
  create: protectedProcedure
    .use(requireRole('ATTORNEY', 'PARALEGAL'))
    .use(requirePermission(PERMISSIONS.MATTERS_CREATE))
    .input(
      z.object({
        matterTypeId: z.string().cuid(),
        clientContactId: z.string().cuid(),
        opposingContactId: z.string().cuid().optional(),
        causeNumber: z.string().max(100).optional(),
        court: z.string().max(200).optional(),
        judge: z.string().max(200).optional(),
        assignedAttorneyId: z.string().cuid(),
        assignedParalegals: z.array(z.string().cuid()).default([]),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Look up matter type for title generation
      const matterType = await ctx.prisma.matterType.findUnique({
        where: { id: input.matterTypeId },
      });

      if (!matterType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter type ${input.matterTypeId} not found`,
        });
      }

      // Look up client contact for title
      const client = await ctx.prisma.contact.findUnique({
        where: { id: input.clientContactId },
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Client contact ${input.clientContactId} not found`,
        });
      }

      const title = `${client.lastName}, ${client.firstName} - ${matterType.name}`;

      // Create matter with assignments and parties in a transaction
      const matter = await ctx.prisma.$transaction(async (tx) => {
        const created = await tx.matter.create({
          data: {
            matterTypeId: input.matterTypeId,
            title,
            status: 'RETAINED',
            causeNumber: input.causeNumber ?? null,
            assignedAttorneyId: input.assignedAttorneyId,
            assignedParalegalId: input.assignedParalegals[0] ?? null,
          },
        });

        // Create attorney assignment
        await tx.matterAssignment.create({
          data: {
            matterId: created.id,
            userId: input.assignedAttorneyId,
            assignmentRole: 'ATTORNEY',
            isPrimary: true,
          },
        });

        // Create paralegal assignments
        for (const paralegalId of input.assignedParalegals) {
          await tx.matterAssignment.create({
            data: {
              matterId: created.id,
              userId: paralegalId,
              assignmentRole: 'PARALEGAL',
              isPrimary: false,
            },
          });
        }

        // Create client party
        await tx.matterParty.create({
          data: {
            matterId: created.id,
            contactId: input.clientContactId,
            roleType: 'PETITIONER',
            representedFlag: true,
          },
        });

        // Create opposing party if provided
        if (input.opposingContactId) {
          await tx.matterParty.create({
            data: {
              matterId: created.id,
              contactId: input.opposingContactId,
              roleType: 'RESPONDENT',
              adverseFlag: true,
            },
          });
        }

        // Create default checklist instance from the first active template for this matter type
        const defaultTemplate = await tx.checklistTemplate.findFirst({
          where: {
            matterTypeId: input.matterTypeId,
            activeFlag: true,
          },
          include: { items: true },
          orderBy: { version: 'desc' },
        });

        if (defaultTemplate) {
          const instance = await tx.checklistInstance.create({
            data: {
              matterId: created.id,
              checklistTemplateId: defaultTemplate.id,
            },
          });

          for (const item of defaultTemplate.items) {
            await tx.checklistItemInstance.create({
              data: {
                checklistInstanceId: instance.id,
                checklistTemplateItemId: item.id,
                status: 'NOT_GENERATED',
              },
            });
          }
        }

        return created;
      });

      // Emit audit event
      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Matter',
        entityId: matter.id,
        metadata: {
          matterTypeId: input.matterTypeId,
          clientContactId: input.clientContactId,
          notes: input.notes,
        },
      });

      // Return the full matter with relations
      return ctx.prisma.matter.findUniqueOrThrow({
        where: { id: matter.id },
        include: {
          matterType: true,
          assignments: true,
          parties: { include: { contact: true } },
        },
      });
    }),

  /**
   * Transition a matter to a new status.
   * Validates the transition against the state machine.
   * Attorney-required transitions enforce caller role.
   */
  updateStatus: protectedProcedure
    .use(requirePermission(PERMISSIONS.MATTERS_UPDATE))
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(matterStatusValues),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.id },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.id} not found`,
        });
      }

      // Validate transition is allowed
      const allowed = VALID_TRANSITIONS[matter.status] ?? [];
      if (!allowed.includes(input.status as MatterStatus)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot transition from '${matter.status}' to '${input.status}'`,
        });
      }

      // Attorney gate for CLOSED and ARCHIVED
      if (ATTORNEY_REQUIRED_STATUSES.includes(input.status as MatterStatus)) {
        const isAttorney = ctx.roles.includes('ATTORNEY');
        if (!isAttorney) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Transitioning to '${input.status}' requires ATTORNEY role`,
          });
        }
      }

      const oldStatus = matter.status;
      const now = new Date();

      // Update matter status
      const updated = await ctx.prisma.matter.update({
        where: { id: input.id },
        data: {
          status: input.status as MatterStatus,
          ...(input.status === 'CLOSED' ? { closedAt: now } : {}),
          ...(input.status === 'ARCHIVED' ? { archivedAt: now } : {}),
        },
      });

      // Record the stage transition (we use the existing Task model or a
      // direct record; for Phase 4 we embed in audit metadata)
      await emitAuditEvent(ctx.prisma, {
        eventType: 'STAGE_CHANGED',
        actorId: ctx.userId,
        entityType: 'Matter',
        entityId: input.id,
        metadata: {
          oldStatus,
          newStatus: input.status,
          note: input.note,
        },
      });

      return updated;
    }),

  /**
   * Assign a user to a matter. Requires ATTORNEY or ADMIN role.
   */
  assign: protectedProcedure
    .use(requireRole('ATTORNEY', 'ADMIN'))
    .input(
      z.object({
        matterId: z.string().cuid(),
        userId: z.string().cuid(),
        role: z.string().min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check matter exists
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      // Upsert assignment -- if user is already assigned, update the role
      const existing = await ctx.prisma.matterAssignment.findFirst({
        where: {
          matterId: input.matterId,
          userId: input.userId,
        },
      });

      let assignment;
      if (existing) {
        assignment = await ctx.prisma.matterAssignment.update({
          where: { id: existing.id },
          data: { assignmentRole: input.role },
        });
      } else {
        assignment = await ctx.prisma.matterAssignment.create({
          data: {
            matterId: input.matterId,
            userId: input.userId,
            assignmentRole: input.role,
          },
        });
      }

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'MatterAssignment',
        entityId: assignment.id,
        metadata: {
          matterId: input.matterId,
          assignedUserId: input.userId,
          assignmentRole: input.role,
        },
      });

      return assignment;
    }),
});
