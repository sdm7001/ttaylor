/**
 * Financial tRPC router.
 *
 * Handles invoicing, payments, trust ledger, and financial summaries
 * for legal matters. Financial operations always emit audit events due
 * to their compliance sensitivity.
 */
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { router, protectedProcedure, requireRole } from '../trpc';
import { emitAuditEvent } from './audit';
import { PERMISSIONS } from '@ttaylor/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENTRY_TYPE_INVOICE = 'INVOICE';
const ENTRY_TYPE_PAYMENT = 'PAYMENT';
const ENTRY_TYPE_TRUST_DEPOSIT = 'TRUST_DEPOSIT';
const ENTRY_TYPE_TRUST_DISBURSEMENT = 'TRUST_DISBURSEMENT';

const TRUST_ENTRY_TYPES = [ENTRY_TYPE_TRUST_DEPOSIT, ENTRY_TYPE_TRUST_DISBURSEMENT];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const financialRouter = router({
  /**
   * Get financial summary for a matter.
   * Returns total billed, total paid, outstanding balance, trust balance,
   * and payment history summary.
   */
  getMatterSummary: protectedProcedure
    .input(z.object({ matterId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      const entries = await ctx.prisma.financialEntry.findMany({
        where: { matterId: input.matterId },
        orderBy: { occurredAt: 'desc' },
      });

      let totalBilled = new Prisma.Decimal(0);
      let totalPaid = new Prisma.Decimal(0);
      let trustBalance = new Prisma.Decimal(0);
      const payments: Array<{
        id: string;
        amount: Prisma.Decimal;
        entryType: string;
        occurredAt: Date;
        note: string | null;
      }> = [];

      for (const entry of entries) {
        switch (entry.entryType) {
          case ENTRY_TYPE_INVOICE:
            totalBilled = totalBilled.add(entry.amount);
            break;
          case ENTRY_TYPE_PAYMENT:
            totalPaid = totalPaid.add(entry.amount);
            payments.push({
              id: entry.id,
              amount: entry.amount,
              entryType: entry.entryType,
              occurredAt: entry.occurredAt,
              note: entry.note,
            });
            break;
          case ENTRY_TYPE_TRUST_DEPOSIT:
            trustBalance = trustBalance.add(entry.amount);
            break;
          case ENTRY_TYPE_TRUST_DISBURSEMENT:
            trustBalance = trustBalance.sub(entry.amount);
            totalPaid = totalPaid.add(entry.amount);
            payments.push({
              id: entry.id,
              amount: entry.amount,
              entryType: entry.entryType,
              occurredAt: entry.occurredAt,
              note: entry.note,
            });
            break;
        }
      }

      const outstandingBalance = totalBilled.sub(totalPaid);

      return {
        matterId: input.matterId,
        totalBilled,
        totalPaid,
        outstandingBalance,
        trustBalance,
        recentPayments: payments.slice(0, 10),
        entryCount: entries.length,
      };
    }),

  /**
   * Create an invoice with line items.
   * Requires PARALEGAL, ATTORNEY, or ADMIN role.
   * Each line item creates a separate financial_entry of type INVOICE.
   */
  createInvoice: protectedProcedure
    .use(requireRole('PARALEGAL', 'ATTORNEY', 'ADMIN'))
    .input(
      z.object({
        matterId: z.string().cuid(),
        lineItems: z
          .array(
            z.object({
              description: z.string().min(1).max(1000),
              hours: z.number().positive().optional(),
              rate: z.number().positive().optional(),
              amount: z.number().positive(),
              category: z.string().min(1).max(100),
            }),
          )
          .min(1)
          .max(100),
        dueDate: z.date(),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      const createdEntries = await ctx.prisma.$transaction(async (tx) => {
        const entries = [];

        for (const item of input.lineItems) {
          const description = item.hours && item.rate
            ? `${item.description} (${item.hours}h @ $${item.rate}/h)`
            : item.description;

          const entry = await tx.financialEntry.create({
            data: {
              matterId: input.matterId,
              entryType: ENTRY_TYPE_INVOICE,
              amount: new Prisma.Decimal(item.amount),
              occurredAt: input.dueDate,
              note: description,
              sourceReference: item.category,
            },
          });

          entries.push(entry);
        }

        return entries;
      });

      const totalAmount = input.lineItems.reduce((sum, item) => sum + item.amount, 0);

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'FinancialEntry',
        entityId: createdEntries[0].id,
        metadata: {
          matterId: input.matterId,
          action: 'invoice_created',
          lineItemCount: input.lineItems.length,
          totalAmount,
          dueDate: input.dueDate.toISOString(),
          notes: input.notes,
        },
      });

      return {
        entries: createdEntries,
        total: totalAmount,
        lineItemCount: input.lineItems.length,
      };
    }),

  /**
   * Record a payment against a matter.
   * Requires ADMIN or ATTORNEY role.
   * Financial operations always emit audit events.
   */
  recordPayment: protectedProcedure
    .use(requireRole('ADMIN', 'ATTORNEY'))
    .input(
      z.object({
        matterId: z.string().cuid(),
        amount: z.number().positive(),
        paymentMethod: z.string().min(1).max(100),
        reference: z.string().max(191).optional(),
        notes: z.string().max(5000).optional(),
        isTrustDisbursement: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      const entryType = input.isTrustDisbursement
        ? ENTRY_TYPE_TRUST_DISBURSEMENT
        : ENTRY_TYPE_PAYMENT;

      // If disbursing from trust, verify sufficient trust balance first
      if (input.isTrustDisbursement) {
        const trustEntries = await ctx.prisma.financialEntry.findMany({
          where: {
            matterId: input.matterId,
            entryType: { in: TRUST_ENTRY_TYPES },
          },
        });

        let trustBalance = new Prisma.Decimal(0);
        for (const te of trustEntries) {
          if (te.entryType === ENTRY_TYPE_TRUST_DEPOSIT) {
            trustBalance = trustBalance.add(te.amount);
          } else {
            trustBalance = trustBalance.sub(te.amount);
          }
        }

        if (trustBalance.lessThan(new Prisma.Decimal(input.amount))) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Insufficient trust balance. Available: $${trustBalance.toFixed(2)}, Requested: $${input.amount.toFixed(2)}`,
          });
        }
      }

      const noteText = [
        input.paymentMethod,
        input.reference ? `Ref: ${input.reference}` : null,
        input.notes,
      ]
        .filter(Boolean)
        .join(' | ');

      const entry = await ctx.prisma.financialEntry.create({
        data: {
          matterId: input.matterId,
          entryType,
          amount: new Prisma.Decimal(input.amount),
          occurredAt: new Date(),
          note: noteText || null,
          sourceReference: input.reference ?? null,
        },
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'CREATED',
        actorId: ctx.userId,
        entityType: 'FinancialEntry',
        entityId: entry.id,
        metadata: {
          matterId: input.matterId,
          action: input.isTrustDisbursement ? 'trust_disbursement' : 'payment_recorded',
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          reference: input.reference,
        },
      });

      return entry;
    }),

  /**
   * Get trust ledger for a matter.
   * Restricted to ATTORNEY or ADMIN.
   * Returns trust-related entries sorted by date with running balance.
   */
  getTrustLedger: protectedProcedure
    .use(requireRole('ATTORNEY', 'ADMIN'))
    .input(z.object({ matterId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.prisma.financialEntry.findMany({
        where: {
          matterId: input.matterId,
          entryType: { in: TRUST_ENTRY_TYPES },
        },
        orderBy: { occurredAt: 'asc' },
      });

      let runningBalance = new Prisma.Decimal(0);

      const ledger = entries.map((entry) => {
        if (entry.entryType === ENTRY_TYPE_TRUST_DEPOSIT) {
          runningBalance = runningBalance.add(entry.amount);
        } else {
          runningBalance = runningBalance.sub(entry.amount);
        }

        return {
          id: entry.id,
          entryType: entry.entryType,
          amount: entry.amount,
          occurredAt: entry.occurredAt,
          note: entry.note,
          sourceReference: entry.sourceReference,
          runningBalance: new Prisma.Decimal(runningBalance.toString()),
        };
      });

      return {
        matterId: input.matterId,
        entries: ledger,
        currentBalance: runningBalance,
      };
    }),

  /**
   * Export complete financial data for a matter.
   * Restricted to ATTORNEY or ADMIN.
   * Returns all entries formatted for CSV/PDF generation.
   */
  exportSummary: protectedProcedure
    .use(requireRole('ATTORNEY', 'ADMIN'))
    .input(z.object({ matterId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const matter = await ctx.prisma.matter.findUnique({
        where: { id: input.matterId },
        select: { id: true, title: true, causeNumber: true },
      });

      if (!matter) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Matter ${input.matterId} not found`,
        });
      }

      const entries = await ctx.prisma.financialEntry.findMany({
        where: { matterId: input.matterId },
        orderBy: { occurredAt: 'asc' },
      });

      let totalBilled = new Prisma.Decimal(0);
      let totalPaid = new Prisma.Decimal(0);
      let trustDeposits = new Prisma.Decimal(0);
      let trustDisbursements = new Prisma.Decimal(0);

      const rows = entries.map((entry) => {
        switch (entry.entryType) {
          case ENTRY_TYPE_INVOICE:
            totalBilled = totalBilled.add(entry.amount);
            break;
          case ENTRY_TYPE_PAYMENT:
            totalPaid = totalPaid.add(entry.amount);
            break;
          case ENTRY_TYPE_TRUST_DEPOSIT:
            trustDeposits = trustDeposits.add(entry.amount);
            break;
          case ENTRY_TYPE_TRUST_DISBURSEMENT:
            trustDisbursements = trustDisbursements.add(entry.amount);
            totalPaid = totalPaid.add(entry.amount);
            break;
        }

        return {
          id: entry.id,
          date: entry.occurredAt,
          type: entry.entryType,
          amount: entry.amount,
          note: entry.note,
          reference: entry.sourceReference,
          currency: entry.currency,
        };
      });

      await emitAuditEvent(ctx.prisma, {
        eventType: 'EXPORTED',
        actorId: ctx.userId,
        entityType: 'FinancialEntry',
        entityId: input.matterId,
        metadata: {
          action: 'financial_export',
          entryCount: entries.length,
        },
      });

      return {
        matter: {
          id: matter.id,
          title: matter.title,
          causeNumber: matter.causeNumber,
        },
        summary: {
          totalBilled,
          totalPaid,
          outstandingBalance: totalBilled.sub(totalPaid),
          trustDeposits,
          trustDisbursements,
          trustBalance: trustDeposits.sub(trustDisbursements),
        },
        rows,
        exportedAt: new Date(),
      };
    }),
});
