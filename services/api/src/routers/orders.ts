/**
 * Orders and compliance tRPC router.
 *
 * Handles court orders and their associated compliance items.
 * Compliance tracking is critical in family law -- violations can
 * result in contempt findings, so status updates trigger notifications.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const complianceStatusValues = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'VIOLATED',
  'EXCUSED',
] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const ordersRouter = router({
  /**
   * List orders for a matter with optional status filter.
   */
  listOrders: protectedProcedure
    .input(
      z.object({
        matterId: z.string().cuid(),
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { matterId: input.matterId };
      if (input.status) where.status = input.status;

      const orders = await ctx.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          complianceItems: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return orders;
    }),

  /**
   * Create a court order. Requires ATTORNEY role.
   */
  createOrder: protectedProcedure
    .use(requireRole('ATTORNEY'))
    .input(
      z.object({
        matterId: z.string().cuid(),
        orderType: z.string().min(1).max(100),
        title: z.string().min(1).max(255),
        enteredAt: z.date(),
        judge: z.string().max(200).optional(),
        summary: z.string().min(1).max(5000),
        documentId: z.string().cuid().optional(),
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

      const order = await ctx.prisma.order.create({
        data: {
          matterId: input.matterId,
          orderType: input.orderType,
          signedAt: input.enteredAt,
          effectiveAt: input.enteredAt,
          fileDocumentId: input.documentId ?? null,
          summaryNote: input.summary,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Order',
        entityId: order.id,
        metadata: {
          matterId: input.matterId,
          orderType: input.orderType,
          title: input.title,
          judge: input.judge,
          enteredAt: input.enteredAt.toISOString(),
        },
      });

      return order;
    }),

  /**
   * Create a compliance item linked to an order.
   * Optionally sets a deadline.
   */
  createComplianceItem: protectedProcedure
    .input(
      z.object({
        orderId: z.string().cuid(),
        description: z.string().min(1).max(2000),
        dueDate: z.date().optional(),
        responsibleParty: z.string().min(1).max(255),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify parent order exists
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Order ${input.orderId} not found`,
        });
      }

      const complianceItem = await ctx.prisma.complianceItem.create({
        data: {
          orderId: input.orderId,
          itemType: 'COMPLIANCE',
          title: input.description,
          dueAt: input.dueDate ?? null,
          status: 'PENDING',
          ownerUserId: null, // Responsible party tracked in title/notes for now
          completionNote: input.notes
            ? `Responsible: ${input.responsibleParty} | ${input.notes}`
            : `Responsible: ${input.responsibleParty}`,
        },
      });

      // If a due date is specified, create a corresponding deadline record
      // in the calendar system for visibility
      if (input.dueDate) {
        try {
          await ctx.prisma.deadline.create({
            data: {
              matterId: order.matterId,
              title: `Compliance: ${input.description.slice(0, 100)}`,
              dueAt: input.dueDate,
              notes: `Order compliance item. Responsible: ${input.responsibleParty}`,
            },
          });
        } catch {
          // Deadline creation is non-critical -- log but don't fail
          console.warn('Failed to create deadline for compliance item:', complianceItem.id);
        }
      }

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'ComplianceItem',
        entityId: complianceItem.id,
        metadata: {
          orderId: input.orderId,
          matterId: order.matterId,
          description: input.description,
          responsibleParty: input.responsibleParty,
          dueDate: input.dueDate?.toISOString(),
        },
      });

      return complianceItem;
    }),

  /**
   * Update compliance item status.
   * If VIOLATED, triggers notification to assigned attorney.
   */
  updateCompliance: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(complianceStatusValues),
        note: z.string().max(2000).optional(),
        completedAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.complianceItem.findUnique({
        where: { id: input.id },
        include: {
          order: {
            include: {
              matter: {
                select: {
                  id: true,
                  title: true,
                  assignedAttorneyId: true,
                },
              },
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Compliance item ${input.id} not found`,
        });
      }

      const oldStatus = item.status;

      // Build update data
      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      if (input.note) {
        updateData.completionNote = item.completionNote
          ? `${item.completionNote}\n[${input.status}] ${input.note}`
          : `[${input.status}] ${input.note}`;
      }

      if (input.status === 'COMPLETED' && input.completedAt) {
        // Store completion date in the note since schema doesn't have a completedAt field
        const completedNote = `Completed: ${input.completedAt.toISOString()}`;
        updateData.completionNote = updateData.completionNote
          ? `${updateData.completionNote}\n${completedNote}`
          : completedNote;
      }

      const updated = await ctx.prisma.complianceItem.update({
        where: { id: input.id },
        data: updateData,
      });

      // If VIOLATED, emit a high-priority audit event with attorney notification metadata
      if (input.status === 'VIOLATED') {
        await emitAuditEvent(ctx.prisma, {
          eventType: 'UPDATED',
          actorId: ctx.userId,
          entityType: 'ComplianceItem',
          entityId: input.id,
          metadata: {
            oldStatus,
            newStatus: 'VIOLATED',
            note: input.note,
            matterId: item.order.matterId,
            matterTitle: item.order.matter.title,
            notifyAttorneyId: item.order.matter.assignedAttorneyId,
            severity: 'HIGH',
            action: 'compliance_violation',
          },
        });
      } else {
        await emitAuditEvent(ctx.prisma, {
          eventType: 'UPDATED',
          actorId: ctx.userId,
          entityType: 'ComplianceItem',
          entityId: input.id,
          metadata: {
            oldStatus,
            newStatus: input.status,
            note: input.note,
          },
        });
      }

      return updated;
    }),

  /**
   * List compliance items with optional filters.
   * Can filter by matter, order, status, or upcoming due dates.
   */
  listComplianceItems: protectedProcedure
    .input(
      z.object({
        matterId: z.string().cuid().optional(),
        orderId: z.string().cuid().optional(),
        status: z.string().optional(),
        upcomingDays: z.number().int().min(1).max(365).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.orderId) {
        where.orderId = input.orderId;
      }

      if (input.status) {
        where.status = input.status;
      }

      // Filter by matter through the order relation
      if (input.matterId) {
        where.order = { matterId: input.matterId };
      }

      // Filter to items due within the next N days
      if (input.upcomingDays) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + input.upcomingDays * 24 * 60 * 60 * 1000);
        where.dueAt = {
          gte: now,
          lte: futureDate,
        };
      }

      const items = await ctx.prisma.complianceItem.findMany({
        where,
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          order: {
            include: {
              matter: {
                select: {
                  id: true,
                  title: true,
                  causeNumber: true,
                },
              },
            },
          },
        },
      });

      return items;
    }),
});
