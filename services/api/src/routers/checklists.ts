/**
 * Checklist tRPC router.
 *
 * Manages checklist instances, item completion/waiving, and
 * template creation for matter-type workflows.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const checklistsRouter = router({
  /**
   * Get all checklist instances (with items and progress) for a matter.
   */
  getForMatter: protectedProcedure
    .input(z.object({ matterId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const instances = await ctx.prisma.checklistInstance.findMany({
        where: { matterId: input.matterId },
        include: {
          template: true,
          items: {
            include: {
              checklistTemplateItem: true,
            },
            orderBy: { checklistTemplateItemId: 'asc' },
          },
        },
      });

      // Compute progress stats per instance
      return instances.map((instance) => {
        const total = instance.items.length;
        const completed = instance.items.filter(
          (i) => i.status === 'COMPLETED' || i.status === 'WAIVED' || i.status === 'SKIPPED',
        ).length;
        const blocked = instance.items.filter((i) => i.status === 'BLOCKED').length;
        const percent = total === 0 ? 100 : Math.round((completed / total) * 100);

        return {
          ...instance,
          progress: { total, completed, blocked, percent },
        };
      });
    }),

  /**
   * Mark a checklist item as COMPLETED.
   *
   * Validates:
   * - Item exists
   * - Caller has the required role (if the template item specifies one)
   * - All dependency items are in COMPLETED/WAIVED status
   */
  completeItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string().cuid(),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.checklistItemInstance.findUnique({
        where: { id: input.itemId },
        include: {
          checklistTemplateItem: true,
          checklistInstance: {
            include: {
              items: {
                include: { checklistTemplateItem: true },
              },
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Checklist item ${input.itemId} not found`,
        });
      }

      // Cannot complete terminal items
      if (['COMPLETED', 'WAIVED', 'SKIPPED'].includes(item.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Item is already in terminal status '${item.status}'`,
        });
      }

      // Check required role from template
      const templateItem = item.checklistTemplateItem;
      if (templateItem?.defaultAssigneeRole) {
        const hasRole = ctx.roles.includes(templateItem.defaultAssigneeRole);
        if (!hasRole) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `This item requires role '${templateItem.defaultAssigneeRole}'`,
          });
        }
      }

      // Check attorney review gate
      if (templateItem?.stageGateId) {
        const isAttorney = ctx.roles.includes('ATTORNEY');
        if (!isAttorney) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This item has a stage gate and requires attorney approval',
          });
        }
      }

      // Check dependencies -- all items this depends on must be complete
      if (templateItem?.dependsOnItemId) {
        const depInstance = item.checklistInstance.items.find(
          (i) => i.checklistTemplateItemId === templateItem.dependsOnItemId,
        );
        if (depInstance && !['COMPLETED', 'WAIVED'].includes(depInstance.status)) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Dependency item is not yet completed',
          });
        }
      }

      const now = new Date();
      const updated = await ctx.prisma.checklistItemInstance.update({
        where: { id: input.itemId },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          completedBy: ctx.userId,
          notes: input.note ?? item.notes,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'ChecklistItemInstance',
        entityId: input.itemId,
        metadata: {
          action: 'COMPLETED',
          note: input.note,
          checklistInstanceId: item.checklistInstanceId,
        },
      });

      return updated;
    }),

  /**
   * Waive a checklist item. Attorney-only.
   *
   * Waiving is a documented legal decision that the item does not need
   * to be completed for this specific matter. Reason is required.
   */
  waiveItem: protectedProcedure
    .use(requireRole('ATTORNEY'))
    .input(
      z.object({
        itemId: z.string().cuid(),
        reason: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.checklistItemInstance.findUnique({
        where: { id: input.itemId },
      });

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Checklist item ${input.itemId} not found`,
        });
      }

      if (['COMPLETED', 'WAIVED', 'SKIPPED'].includes(item.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Item is already in terminal status '${item.status}'`,
        });
      }

      const now = new Date();
      const updated = await ctx.prisma.checklistItemInstance.update({
        where: { id: input.itemId },
        data: {
          status: 'WAIVED',
          completedAt: now,
          completedBy: ctx.userId,
          notes: `WAIVED: ${input.reason}`,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'ChecklistItemInstance',
        entityId: input.itemId,
        metadata: {
          action: 'WAIVED',
          reason: input.reason,
          checklistInstanceId: item.checklistInstanceId,
        },
      });

      return updated;
    }),

  /**
   * Create a new checklist template with items.
   * Restricted to ADMIN or ATTORNEY roles.
   */
  createTemplate: protectedProcedure
    .use(requireRole('ADMIN', 'ATTORNEY'))
    .input(
      z.object({
        name: z.string().min(1).max(200),
        matterTypeId: z.string().cuid(),
        description: z.string().max(2000).optional(),
        items: z.array(
          z.object({
            title: z.string().min(1).max(500),
            description: z.string().max(2000).optional(),
            sortOrder: z.number().int().min(0),
            isRequired: z.boolean().default(true),
            defaultAssigneeRole: z.string().max(50).optional(),
            dueDaysFromOpen: z.number().int().min(0).optional(),
            dependsOnItemId: z.string().cuid().optional(),
            stageGateId: z.string().cuid().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.$transaction(async (tx) => {
        const created = await tx.checklistTemplate.create({
          data: {
            name: input.name,
            matterTypeId: input.matterTypeId,
            description: input.description ?? null,
            version: 1,
            activeFlag: true,
          },
        });

        for (const item of input.items) {
          await tx.checklistTemplateItem.create({
            data: {
              checklistTemplateId: created.id,
              title: item.title,
              description: item.description ?? null,
              sortOrder: item.sortOrder,
              isRequired: item.isRequired,
              defaultAssigneeRole: item.defaultAssigneeRole ?? null,
              dueDaysFromOpen: item.dueDaysFromOpen ?? null,
              dependsOnItemId: item.dependsOnItemId ?? null,
              stageGateId: item.stageGateId ?? null,
            },
          });
        }

        return created;
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'ChecklistTemplate',
        entityId: template.id,
        metadata: {
          name: input.name,
          matterTypeId: input.matterTypeId,
          itemCount: input.items.length,
        },
      });

      return ctx.prisma.checklistTemplate.findUniqueOrThrow({
        where: { id: template.id },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
    }),
});
