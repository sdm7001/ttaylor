/**
 * Templates tRPC router.
 *
 * Manages document templates (Handlebars / plaintext bodies) used by the
 * document generation pipeline. Templates have category, matter-type, and
 * engine metadata alongside a full text `content` body.
 *
 * Coexists with the legacy `documents.listTemplates` procedure, which is
 * kept for backward compatibility with the generate-document dialog.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, requirePermission, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';
import { PERMISSIONS } from '@ttaylor/auth';

// ---------------------------------------------------------------------------
// Zod enums / shared input pieces
// ---------------------------------------------------------------------------

const templateCategoryValues = [
  'DIVORCE',
  'CHILD_CUSTODY',
  'PROPERTY',
  'SUPPORT',
  'GENERAL',
] as const;

const templateEngineValues = ['handlebars', 'plaintext'] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const templatesRouter = router({
  /**
   * List templates, optionally filtered by category and/or name search.
   */
  list: protectedProcedure
    .use(requirePermission(PERMISSIONS.TEMPLATES_READ))
    .input(
      z.object({
        category: z.enum(templateCategoryValues).optional(),
        search: z.string().trim().max(200).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const category = input?.category;
      const search = input?.search;

      const where: Record<string, unknown> = {};
      if (category) where.category = category;
      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }

      const [items, total] = await Promise.all([
        ctx.prisma.template.findMany({
          where,
          orderBy: [{ activeFlag: 'desc' }, { name: 'asc' }],
        }),
        ctx.prisma.template.count({ where }),
      ]);

      return { items, total };
    }),

  /**
   * Fetch a single template by id.
   */
  getById: protectedProcedure
    .use(requirePermission(PERMISSIONS.TEMPLATES_READ))
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.template.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Template ${input.id} not found`,
        });
      }

      return template;
    }),

  /**
   * Create a new template.
   */
  create: protectedProcedure
    .use(requirePermission(PERMISSIONS.TEMPLATES_CREATE))
    .input(
      z.object({
        name: z.string().min(1).max(191),
        code: z.string().min(1).max(100),
        category: z.enum(templateCategoryValues),
        content: z.string().max(500_000).optional(),
        matterTypeId: z.string().cuid().optional(),
        templateEngine: z.enum(templateEngineValues).default('handlebars'),
        version: z.number().int().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const template = await ctx.prisma.template.create({
        data: {
          name: input.name,
          code: input.code,
          category: input.category,
          content: input.content ?? null,
          matterTypeId: input.matterTypeId ?? null,
          templateEngine: input.templateEngine,
          version: input.version,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Template',
        entityId: template.id,
        metadata: {
          action: 'TEMPLATE_CREATED',
          code: template.code,
          category: template.category,
        },
      });

      return template;
    }),

  /**
   * Update an existing template.
   */
  update: protectedProcedure
    .use(requirePermission(PERMISSIONS.TEMPLATES_UPDATE))
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).max(191).optional(),
        code: z.string().min(1).max(100).optional(),
        category: z.enum(templateCategoryValues).optional(),
        content: z.string().max(500_000).optional(),
        activeFlag: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.template.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Template ${input.id} not found`,
        });
      }

      const { id, ...patch } = input;

      const updated = await ctx.prisma.template.update({
        where: { id },
        data: patch,
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'Template',
        entityId: updated.id,
        metadata: {
          action: 'TEMPLATE_UPDATED',
          changedFields: Object.keys(patch),
        },
      });

      return updated;
    }),

  /**
   * Soft-delete a template by setting `activeFlag = false`.
   * Restricted to ATTORNEY or ADMIN roles.
   */
  delete: protectedProcedure
    .use(requirePermission(PERMISSIONS.TEMPLATES_DELETE))
    .use(requireRole('ATTORNEY', 'ADMIN'))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.template.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Template ${input.id} not found`,
        });
      }

      const updated = await ctx.prisma.template.update({
        where: { id: input.id },
        data: { activeFlag: false },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'DELETED',
        actorId: ctx.userId,
        entityType: 'Template',
        entityId: updated.id,
        metadata: {
          action: 'TEMPLATE_DELETED',
          softDelete: true,
        },
      });

      return updated;
    }),
});
