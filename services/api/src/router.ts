/**
 * Root application router for the Ttaylor tRPC API.
 *
 * Composes all module-level routers into a single appRouter.
 * The AppRouter type is exported for client-side type inference.
 */
import { router } from './trpc';
import { mattersRouter } from './routers/matters';
import { documentsRouter } from './routers/documents';
import { intakeRouter } from './routers/intake';
import { auditRouter } from './routers/audit';
import { checklistsRouter } from './routers/checklists';
import { calendarRouter } from './routers/calendar';
import { contactsRouter } from './routers/contacts';
import { discoveryRouter } from './routers/discovery';
import { financialRouter } from './routers/financial';
import { ordersRouter } from './routers/orders';
import { dashboardRouter } from './routers/dashboard';
import { filingRouter } from './routers/filing';
import { portalRouter } from './routers/portal';
import { searchRouter } from './routers/search';
import { notesRouter } from './routers/notes';
import { usersRouter } from './routers/users';
import { templatesRouter } from './routers/templates';

export const appRouter = router({
  matters: mattersRouter,
  documents: documentsRouter,
  intake: intakeRouter,
  audit: auditRouter,
  checklists: checklistsRouter,
  calendar: calendarRouter,
  contacts: contactsRouter,
  discovery: discoveryRouter,
  financial: financialRouter,
  orders: ordersRouter,
  dashboard: dashboardRouter,
  filing: filingRouter,
  portal: portalRouter,
  search: searchRouter,
  notes: notesRouter,
  users: usersRouter,
  templates: templatesRouter,
});

export type AppRouter = typeof appRouter;
