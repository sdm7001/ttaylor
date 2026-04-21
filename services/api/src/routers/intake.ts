/**
 * Intake tRPC router.
 *
 * Handles lead creation, listing, conflict checks, and conversion to matters.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, requirePermission, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';
import { PERMISSIONS } from '@ttaylor/auth';

// ---------------------------------------------------------------------------
// Zod enums
// ---------------------------------------------------------------------------

const leadStatusValues = [
  'NEW', 'INTAKE_PENDING', 'CONFLICT_CHECK', 'CONSULTATION_SCHEDULED',
  'CONSULTATION_COMPLETED', 'RETAINED', 'DECLINED', 'CLOSED',
] as const;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const intakeRouter = router({
  /**
   * Create a new lead. Requires RECEPTIONIST or higher.
   */
  createLead: protectedProcedure
    .use(requirePermission(PERMISSIONS.INTAKE_CREATE_LEAD))
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email().max(191).optional(),
        phone: z.string().max(30).optional(),
        practiceArea: z.string().min(1).max(100),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create a contact record for the prospective client
      const contact = await ctx.prisma.contact.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phoneMobile: input.phone,
        },
      });

      // Create the lead
      const lead = await ctx.prisma.lead.create({
        data: {
          status: 'NEW',
          prospectiveClientContactId: contact.id,
          assignedUserId: ctx.userId,
          notesSummary: input.notes,
          source: input.practiceArea, // Practice area stored in source for Phase 4
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Lead',
        entityId: lead.id,
        metadata: {
          contactId: contact.id,
          practiceArea: input.practiceArea,
        },
      });

      return lead;
    }),

  /**
   * List leads with optional status filter and pagination.
   */
  getLeads: protectedProcedure
    .use(requirePermission(PERMISSIONS.INTAKE_CREATE_LEAD))
    .input(
      z.object({
        status: z.enum(leadStatusValues).optional(),
        cursor: z.string().cuid().nullish(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, cursor, limit } = input;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        ctx.prisma.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
        ctx.prisma.lead.count({ where }),
      ]);

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor, total };
    }),

  /**
   * Convert a lead into a matter.
   * Requires PARALEGAL or higher.
   */
  convertToMatter: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY'))
    .use(requirePermission(PERMISSIONS.INTAKE_CONVERT_MATTER))
    .input(
      z.object({
        leadId: z.string().cuid(),
        matterTypeId: z.string().cuid(),
        assignedAttorneyId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.leadId },
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Lead ${input.leadId} not found`,
        });
      }

      if (lead.status === 'RETAINED' || lead.status === 'DECLINED' || lead.status === 'CLOSED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Lead is in terminal status '${lead.status}' and cannot be converted`,
        });
      }

      // Look up matter type
      const matterType = await ctx.prisma.matterType.findUnique({
        where: { id: input.matterTypeId },
      });
      if (!matterType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter type ${input.matterTypeId} not found`,
        });
      }

      // Build title from lead contact
      let title = `${matterType.name}`;
      if (lead.prospectiveClientContactId) {
        const contact = await ctx.prisma.contact.findUnique({
          where: { id: lead.prospectiveClientContactId },
        });
        if (contact) {
          title = `${contact.lastName}, ${contact.firstName} - ${matterType.name}`;
        }
      }

      // Create the matter
      const matter = await ctx.prisma.$transaction(async (tx) => {
        const created = await tx.matter.create({
          data: {
            leadId: input.leadId,
            matterTypeId: input.matterTypeId,
            title,
            status: 'RETAINED',
            assignedAttorneyId: input.assignedAttorneyId,
            county: lead.county,
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

        // Link the lead contact as petitioner
        if (lead.prospectiveClientContactId) {
          await tx.matterParty.create({
            data: {
              matterId: created.id,
              contactId: lead.prospectiveClientContactId,
              roleType: 'PETITIONER',
              representedFlag: true,
            },
          });
        }

        // Update lead status
        await tx.lead.update({
          where: { id: input.leadId },
          data: { status: 'RETAINED' },
        });

        return created;
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'Matter',
        entityId: matter.id,
        metadata: {
          convertedFromLeadId: input.leadId,
          matterTypeId: input.matterTypeId,
        },
      });

      return { matterId: matter.id };
    }),

  /**
   * Run a conflict check against a lead.
   *
   * Searches existing contacts for name or email matches that appear
   * as parties on active matters. Creates a ConflictCheck record.
   */
  runConflictCheck: protectedProcedure
    .use(requirePermission(PERMISSIONS.INTAKE_CONFLICT_CHECK))
    .input(
      z.object({
        leadId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.leadId },
      });

      if (!lead) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Lead ${input.leadId} not found`,
        });
      }

      // Get the prospective client contact for name/email matching
      let searchName = '';
      let searchEmail = '';
      if (lead.prospectiveClientContactId) {
        const contact = await ctx.prisma.contact.findUnique({
          where: { id: lead.prospectiveClientContactId },
        });
        if (contact) {
          searchName = `${contact.firstName} ${contact.lastName}`.trim();
          searchEmail = contact.email ?? '';
        }
      }

      // Search for matching contacts on active matters (opposing parties)
      const conflictMatches = await ctx.prisma.matterParty.findMany({
        where: {
          adverseFlag: true,
          matter: {
            status: {
              notIn: ['CLOSED', 'ARCHIVED'],
            },
          },
          contact: {
            OR: [
              ...(searchName
                ? [
                    {
                      firstName: { contains: searchName.split(' ')[0], mode: 'insensitive' as const },
                      lastName: { contains: searchName.split(' ').slice(1).join(' ') || '', mode: 'insensitive' as const },
                    },
                  ]
                : []),
              ...(searchEmail
                ? [{ email: { equals: searchEmail, mode: 'insensitive' as const } }]
                : []),
            ],
          },
        },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          matter: { select: { id: true, title: true, status: true, causeNumber: true } },
        },
      });

      // Create conflict check record
      const conflictCheck = await ctx.prisma.conflictCheck.create({
        data: {
          leadId: input.leadId,
          requestedByUserId: ctx.userId,
          status: conflictMatches.length > 0 ? 'conflicts_found' : 'clear',
          searchSnapshotJson: {
            searchName,
            searchEmail,
            matchCount: conflictMatches.length,
            matches: conflictMatches.map((m) => ({
              contactId: m.contact.id,
              contactName: `${m.contact.firstName} ${m.contact.lastName}`,
              matterId: m.matter.id,
              matterTitle: m.matter.title,
              matterStatus: m.matter.status,
            })),
          },
          performedAt: new Date(),
        },
      });

      // Update lead status to CONFLICT_CHECK
      await ctx.prisma.lead.update({
        where: { id: input.leadId },
        data: { status: 'CONFLICT_CHECK' },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CONFLICT_CLEARED',
        actorId: ctx.userId,
        entityType: 'Lead',
        entityId: input.leadId,
        metadata: {
          conflictCheckId: conflictCheck.id,
          matchCount: conflictMatches.length,
          status: conflictCheck.status,
        },
      });

      return {
        id: conflictCheck.id,
        status: conflictCheck.status,
        matchCount: conflictMatches.length,
        matches: conflictMatches.map((m) => ({
          contactId: m.contact.id,
          contactName: `${m.contact.firstName} ${m.contact.lastName}`,
          contactEmail: m.contact.email,
          matterId: m.matter.id,
          matterTitle: m.matter.title,
          matterStatus: m.matter.status,
          causeNumber: m.matter.causeNumber,
        })),
      };
    }),
});
