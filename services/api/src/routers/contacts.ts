/**
 * Contacts tRPC router.
 *
 * Manages client and party contact records, including
 * search, CRUD, and linking contacts to matters as parties.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const contactTypeValues = [
  'CLIENT',
  'OPPOSING_PARTY',
  'ATTORNEY',
  'WITNESS',
  'EXPERT',
  'MEDIATOR',
  'COURT_STAFF',
  'OTHER',
] as const;

const partyRoleValues = [
  'PETITIONER',
  'RESPONDENT',
  'INTERVENOR',
  'CHILD',
  'WITNESS',
  'EXPERT',
  'MEDIATOR',
  'AMICUS',
  'AD_LITEM',
] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const contactsRouter = router({
  /**
   * List contacts with optional full-text search and cursor pagination.
   * Searches across name, email, and phone fields.
   */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().max(200).optional(),
        cursor: z.string().cuid().nullish(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, cursor, limit } = input;

      const where: Record<string, unknown> = {};
      if (search && search.trim()) {
        const term = search.trim();
        where.OR = [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.prisma.contact.findMany({
          where,
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
          include: {
            _count: { select: { matterParties: true } },
          },
        }),
        ctx.prisma.contact.count({ where }),
      ]);

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor, total };
    }),

  /**
   * Get a single contact by ID with their addresses, phone numbers,
   * and the matters they are involved in.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findUnique({
        where: { id: input.id },
        include: {
          addresses: true,
          matterParties: {
            include: {
              matter: {
                select: { id: true, title: true, status: true, causeNumber: true },
              },
            },
          },
        },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Contact ${input.id} not found`,
        });
      }

      return contact;
    }),

  /**
   * Create a new contact record.
   */
  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(200),
        lastName: z.string().min(1).max(200),
        email: z.string().email().max(320).optional(),
        phone: z.string().max(30).optional(),
        contactType: z.enum(contactTypeValues),
        organizationName: z.string().max(300).optional(),
        notes: z.string().max(5000).optional(),
        // Optional primary address
        address: z
          .object({
            street1: z.string().min(1).max(300),
            street2: z.string().max(300).optional(),
            city: z.string().min(1).max(200),
            state: z.string().min(2).max(50),
            zip: z.string().min(5).max(20),
            county: z.string().max(200).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.$transaction(async (tx) => {
        const created = await tx.contact.create({
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email ?? null,
            phone: input.phone ?? null,
            contactType: input.contactType,
            organizationName: input.organizationName ?? null,
            notes: input.notes ?? null,
          },
        });

        // Create primary address if provided
        if (input.address) {
          await tx.address.create({
            data: {
              contactId: created.id,
              street1: input.address.street1,
              street2: input.address.street2 ?? null,
              city: input.address.city,
              state: input.address.state,
              zip: input.address.zip,
              county: input.address.county ?? null,
              isPrimary: true,
            },
          });
        }

        return created;
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Contact',
        entityId: contact.id,
        metadata: {
          firstName: input.firstName,
          lastName: input.lastName,
          contactType: input.contactType,
        },
      });

      return ctx.prisma.contact.findUniqueOrThrow({
        where: { id: contact.id },
        include: { addresses: true },
      });
    }),

  /**
   * Update an existing contact.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        firstName: z.string().min(1).max(200).optional(),
        lastName: z.string().min(1).max(200).optional(),
        email: z.string().email().max(320).nullish(),
        phone: z.string().max(30).nullish(),
        contactType: z.enum(contactTypeValues).optional(),
        organizationName: z.string().max(300).nullish(),
        notes: z.string().max(5000).nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const existing = await ctx.prisma.contact.findUnique({ where: { id } });
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Contact ${id} not found`,
        });
      }

      // Build update data -- only include fields that were explicitly provided
      const data: Record<string, unknown> = {};
      if (updates.firstName !== undefined) data.firstName = updates.firstName;
      if (updates.lastName !== undefined) data.lastName = updates.lastName;
      if (updates.email !== undefined) data.email = updates.email;
      if (updates.phone !== undefined) data.phone = updates.phone;
      if (updates.contactType !== undefined) data.contactType = updates.contactType;
      if (updates.organizationName !== undefined) data.organizationName = updates.organizationName;
      if (updates.notes !== undefined) data.notes = updates.notes;

      const updated = await ctx.prisma.contact.update({
        where: { id },
        data,
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'UPDATED',
        actorId: ctx.userId,
        entityType: 'Contact',
        entityId: id,
        metadata: { updatedFields: Object.keys(data) },
      });

      return updated;
    }),

  /**
   * Link a contact to a matter as a party.
   * Requires PARALEGAL or higher role.
   */
  addToMatter: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY', 'ADMIN'))
    .input(
      z.object({
        contactId: z.string().cuid(),
        matterId: z.string().cuid(),
        role: z.enum(partyRoleValues),
        adverseFlag: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify both contact and matter exist
      const [contact, matter] = await Promise.all([
        ctx.prisma.contact.findUnique({ where: { id: input.contactId } }),
        ctx.prisma.matter.findUnique({ where: { id: input.matterId } }),
      ]);

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Contact ${input.contactId} not found`,
        });
      }

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      // Check if this contact is already linked to this matter
      const existing = await ctx.prisma.matterParty.findFirst({
        where: {
          contactId: input.contactId,
          matterId: input.matterId,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Contact is already linked to this matter',
        });
      }

      const party = await ctx.prisma.matterParty.create({
        data: {
          contactId: input.contactId,
          matterId: input.matterId,
          roleType: input.role,
          adverseFlag: input.adverseFlag,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'MatterParty',
        entityId: party.id,
        metadata: {
          contactId: input.contactId,
          matterId: input.matterId,
          role: input.role,
          adverseFlag: input.adverseFlag,
        },
      });

      return ctx.prisma.matterParty.findUniqueOrThrow({
        where: { id: party.id },
        include: { contact: true, matter: { select: { id: true, title: true } } },
      });
    }),
});
