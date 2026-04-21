# Repository Structure — Ttaylor Family Law Paralegal Platform

**Version**: 1.0.0
**Status**: Phase 1 — Foundation
**Last Updated**: 2026-04-20

This document defines the complete repository layout, naming conventions, branching strategy, and development standards.

---

## Directory Tree

```
ttaylor/
├── SCHEMA_CANON.md                 # Canonical database schema specification (source of truth)
├── TEST_MATRIX.md                  # Master test coverage matrix
├── DESIGN_SYSTEM_SPEC.md           # Design system specification
├── REPO_STRUCTURE.md               # This file
├── package.json                    # Root workspace configuration (pnpm workspaces)
├── pnpm-workspace.yaml             # Workspace member declarations
├── turbo.json                      # Turborepo pipeline configuration
├── tsconfig.base.json              # Shared TypeScript config
├── .eslintrc.js                    # Root ESLint config
├── .prettierrc                     # Prettier config
├── .gitignore
├── .env.example                    # Environment variable template (never commit .env)
│
├── apps/
│   ├── staff-web/                  # Next.js 14+ staff application
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   │   ├── fonts/              # Inter and JetBrains Mono font files
│   │   │   └── images/             # Static images, firm logo
│   │   └── src/
│   │       ├── app/                # Next.js App Router
│   │       │   ├── layout.tsx      # Root layout (sidebar, top bar, providers)
│   │       │   ├── page.tsx        # Root redirect to /dashboard
│   │       │   ├── (auth)/         # Route group: authentication pages
│   │       │   │   ├── login/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── mfa/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── layout.tsx  # Auth layout (no sidebar)
│   │       │   ├── (dashboard)/    # Route group: authenticated staff pages
│   │       │   │   ├── layout.tsx  # Dashboard layout (sidebar + top bar)
│   │       │   │   ├── dashboard/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── matters/
│   │       │   │   │   ├── page.tsx           # Matter list
│   │       │   │   │   ├── new/
│   │       │   │   │   │   └── page.tsx       # Create matter
│   │       │   │   │   └── [matterId]/
│   │       │   │   │       ├── page.tsx       # Matter detail (overview tab)
│   │       │   │   │       ├── documents/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── filing/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── discovery/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── calendar/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── financial/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── communications/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── orders/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       └── history/
│   │       │   │   │           └── page.tsx
│   │       │   │   ├── leads/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── [leadId]/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── contacts/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── [contactId]/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── tasks/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── calendar/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── documents/
│   │       │   │   │   └── page.tsx          # Firm-wide document search
│   │       │   │   ├── reports/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── admin/
│   │       │   │       ├── users/
│   │       │   │       │   └── page.tsx
│   │       │   │       ├── roles/
│   │       │   │       │   └── page.tsx
│   │       │   │       ├── templates/
│   │       │   │       │   └── page.tsx      # Document template management
│   │       │   │       └── settings/
│   │       │   │           └── page.tsx
│   │       │   └── api/                      # Next.js API routes (staff)
│   │       │       ├── auth/
│   │       │       │   ├── login/route.ts
│   │       │       │   ├── logout/route.ts
│   │       │       │   ├── mfa/route.ts
│   │       │       │   └── session/route.ts
│   │       │       ├── leads/
│   │       │       │   └── route.ts
│   │       │       ├── matters/
│   │       │       │   ├── route.ts
│   │       │       │   └── [matterId]/
│   │       │       │       ├── route.ts
│   │       │       │       ├── documents/route.ts
│   │       │       │       ├── filing-packets/route.ts
│   │       │       │       ├── discovery/route.ts
│   │       │       │       ├── calendar/route.ts
│   │       │       │       ├── financial/route.ts
│   │       │       │       ├── communications/route.ts
│   │       │       │       └── orders/route.ts
│   │       │       ├── contacts/
│   │       │       │   └── route.ts
│   │       │       ├── tasks/
│   │       │       │   └── route.ts
│   │       │       ├── documents/
│   │       │       │   ├── route.ts
│   │       │       │   └── [documentId]/
│   │       │       │       ├── route.ts
│   │       │       │       ├── versions/route.ts
│   │       │       │       └── approvals/route.ts
│   │       │       ├── filing-packets/
│   │       │       │   └── [packetId]/
│   │       │       │       └── route.ts
│   │       │       ├── admin/
│   │       │       │   ├── users/route.ts
│   │       │       │   └── roles/route.ts
│   │       │       └── files/
│   │       │           └── signed-url/route.ts
│   │       ├── components/                   # Staff-specific UI components
│   │       │   ├── matters/                  # Matter-related components
│   │       │   │   ├── MatterCard.tsx
│   │       │   │   ├── MatterHeader.tsx
│   │       │   │   ├── MatterStageTimeline.tsx
│   │       │   │   ├── MatterList.tsx
│   │       │   │   └── MatterForm.tsx
│   │       │   ├── documents/
│   │       │   │   ├── DocumentViewer.tsx
│   │       │   │   ├── DocumentApprovalPanel.tsx
│   │       │   │   └── DocumentVersionHistory.tsx
│   │       │   ├── filing/
│   │       │   │   ├── FilingPacketAssembly.tsx
│   │       │   │   ├── FilingPacketValidation.tsx
│   │       │   │   └── FilingEventTimeline.tsx
│   │       │   ├── checklists/
│   │       │   │   ├── ChecklistView.tsx
│   │       │   │   └── ChecklistItemRow.tsx
│   │       │   ├── calendar/
│   │       │   │   └── CalendarView.tsx
│   │       │   ├── dashboard/
│   │       │   │   ├── MetricCard.tsx
│   │       │   │   ├── RecentActivity.tsx
│   │       │   │   ├── MyTasks.tsx
│   │       │   │   └── PendingApprovals.tsx
│   │       │   └── layout/
│   │       │       ├── Sidebar.tsx
│   │       │       ├── TopBar.tsx
│   │       │       └── Breadcrumb.tsx
│   │       ├── hooks/                        # Staff-specific React hooks
│   │       │   ├── useMatter.ts
│   │       │   ├── useDocuments.ts
│   │       │   ├── useSession.ts
│   │       │   └── usePermissions.ts
│   │       ├── lib/                          # Staff-specific utilities
│   │       │   ├── api-client.ts             # Typed fetch wrapper
│   │       │   ├── auth.ts                   # Auth helpers (server-side)
│   │       │   └── prisma.ts                 # Prisma client singleton
│   │       └── styles/
│   │           └── globals.css               # Tailwind imports, CSS custom properties
│   │
│   └── client-portal/                        # Next.js 14+ client portal
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── public/
│       └── src/
│           ├── app/
│           │   ├── layout.tsx                # Portal root layout (no sidebar, top-nav only)
│           │   ├── (auth)/
│           │   │   ├── login/page.tsx
│           │   │   ├── setup/page.tsx        # First-time password setup from invitation
│           │   │   └── layout.tsx
│           │   ├── (portal)/
│           │   │   ├── layout.tsx            # Authenticated portal layout
│           │   │   ├── page.tsx              # Portal dashboard
│           │   │   ├── documents/
│           │   │   │   ├── page.tsx          # View and upload documents
│           │   │   │   └── [documentId]/
│           │   │   │       └── page.tsx
│           │   │   ├── messages/
│           │   │   │   └── page.tsx          # Communication with staff
│           │   │   └── calendar/
│           │   │       └── page.tsx          # View upcoming events
│           │   └── api/
│           │       ├── auth/
│           │       │   ├── login/route.ts
│           │       │   └── logout/route.ts
│           │       ├── documents/
│           │       │   └── route.ts          # Upload and list (scoped to client's matter)
│           │       └── messages/
│           │           └── route.ts
│           ├── components/
│           │   ├── PortalNav.tsx
│           │   ├── DocumentCard.tsx
│           │   ├── MessageThread.tsx
│           │   └── UploadForm.tsx
│           ├── hooks/
│           │   └── usePortalSession.ts
│           └── lib/
│               ├── portal-api-client.ts
│               └── portal-auth.ts
│
├── packages/
│   ├── ui/                                   # Shared component library
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                      # Public exports
│   │   │   ├── tokens/
│   │   │   │   ├── colors.ts                 # Color token constants
│   │   │   │   ├── typography.ts             # Font size/weight tokens
│   │   │   │   ├── spacing.ts               # Spacing scale tokens
│   │   │   │   └── shadows.ts               # Shadow tokens
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Badge.tsx                 # Status badges per DESIGN_SYSTEM_SPEC
│   │   │   │   ├── DataTable.tsx             # Sortable, selectable data table
│   │   │   │   ├── Modal.tsx                 # Base modal with focus trap
│   │   │   │   ├── ConfirmModal.tsx          # Destructive/approval confirmation modal
│   │   │   │   ├── Input.tsx                 # Base text input
│   │   │   │   ├── Select.tsx               # Dropdown select
│   │   │   │   ├── DatePicker.tsx           # Date picker with legal-specific presets
│   │   │   │   ├── CurrencyInput.tsx        # Formatted currency input
│   │   │   │   ├── CauseNumberInput.tsx     # Cause number with format validation
│   │   │   │   ├── CountySelector.tsx       # Texas county dropdown (254 counties)
│   │   │   │   ├── Timeline.tsx             # Vertical event timeline
│   │   │   │   ├── StageProgress.tsx        # Horizontal stage indicator
│   │   │   │   ├── Tabs.tsx                 # Tab navigation
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── Skeleton.tsx             # Loading skeleton
│   │   │   │   ├── Toast.tsx                # Notification toast
│   │   │   │   └── EmptyState.tsx           # Empty state illustration + CTA
│   │   │   └── utilities/
│   │   │       ├── cn.ts                     # Tailwind class merge utility
│   │   │       ├── focus-trap.ts            # Focus trap hook
│   │   │       └── format.ts               # Number, date, currency formatters
│   │   └── tailwind-preset.ts               # Shared Tailwind preset (colors, fonts, spacing)
│   │
│   ├── domain/                               # Shared domain types and logic
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/
│   │       │   ├── matter.ts                # Matter, MatterType, MatterStage types
│   │       │   ├── document.ts              # Document, DocumentVersion, DocumentApproval types
│   │       │   ├── contact.ts               # Contact, Address, Child, EmploymentRecord types
│   │       │   ├── filing.ts                # FilingPacket, FilingPacketItem, FilingEvent types
│   │       │   ├── discovery.ts             # DiscoveryRequest, DiscoveryResponse types
│   │       │   ├── communication.ts         # Thread, Message types
│   │       │   ├── financial.ts             # FinancialEntry, SettlementProposal types
│   │       │   ├── user.ts                  # User, Role, Permission types
│   │       │   └── common.ts                # Shared types (Pagination, SortOrder, etc.)
│   │       ├── enums/
│   │       │   ├── matter-status.ts         # MatterStatus enum
│   │       │   ├── document-status.ts       # DocumentStatus enum
│   │       │   ├── filing-status.ts         # FilingPacketStatus enum
│   │       │   ├── party-role.ts            # PartyRole enum
│   │       │   ├── contact-type.ts          # ContactType enum
│   │       │   └── assignment-role.ts       # AssignmentRole enum
│   │       ├── state-machines/
│   │       │   ├── matter-lifecycle.ts      # Matter status transitions (state machine)
│   │       │   ├── document-lifecycle.ts    # Document status transitions
│   │       │   └── filing-lifecycle.ts      # Filing packet status transitions
│   │       └── validation/
│   │           ├── matter.ts                # Matter creation/update validators (Zod schemas)
│   │           ├── contact.ts               # Contact validators
│   │           ├── document.ts              # Document validators
│   │           ├── filing.ts                # Filing packet validators (Harris County rules, etc.)
│   │           └── financial.ts             # Financial entry validators
│   │
│   ├── workflows/                            # Workflow engine
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── checklist-runner.ts          # Generates checklist instances from templates
│   │       ├── stage-gate-evaluator.ts      # Evaluates whether a stage transition is allowed
│   │       ├── dependency-resolver.ts       # Resolves checklist item dependencies
│   │       ├── deadline-calculator.ts       # Calculates statutory deadlines (e.g., Texas response periods)
│   │       ├── reminder-scheduler.ts        # Schedules reminders based on deadline/event config
│   │       └── conflict-checker.ts          # Conflict of interest checking logic
│   │
│   ├── documents/                            # Document template engine
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── template-engine.ts           # DOCX template parsing and merge field replacement
│   │       ├── merge-field-processor.ts     # Resolves merge field keys to matter data
│   │       ├── merge-field-registry.ts      # Registry of all available merge fields with data sources
│   │       ├── pdf-generator.ts             # DOCX-to-PDF conversion
│   │       └── template-validator.ts        # Validates template structure and merge field completeness
│   │
│   ├── auth/                                 # Auth utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── rbac.ts                      # Role-based access control policy evaluation
│   │       ├── permissions.ts               # Permission checking (user -> roles -> permissions)
│   │       ├── session.ts                   # Session creation, validation, expiry
│   │       ├── mfa.ts                       # TOTP generation and verification
│   │       ├── password.ts                  # Password hashing (bcrypt) and validation
│   │       └── types.ts                     # Session, AuthContext, TokenPayload types
│   │
│   └── shared/                               # Common utilities
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── errors.ts                    # Typed error classes (NotFoundError, ForbiddenError, etc.)
│           ├── pagination.ts                # Pagination request/response helpers
│           ├── sorting.ts                   # Sort parameter parsing
│           ├── date-utils.ts                # Date arithmetic, business day calculation
│           ├── texas-counties.ts            # 254 Texas counties with metadata (region, district courts)
│           └── audit-logger.ts              # Audit event creation helper
│
├── services/
│   └── api/                                  # Standalone API service (placeholder for v1)
│       ├── README.md                         # Documents when/why to extract from Next.js API routes
│       └── package.json
│
├── database/
│   ├── schema/
│   │   └── schema.prisma                    # Prisma schema (must match SCHEMA_CANON.md)
│   ├── migrations/                          # Prisma migration files (auto-generated)
│   │   └── .gitkeep
│   └── seeds/
│       ├── index.ts                         # Seed runner entry point
│       ├── roles-and-permissions.ts         # Seeds roles, permissions, role_permissions
│       ├── matter-types-and-stages.ts       # Seeds matter_types and matter_stages
│       ├── checklist-templates.ts           # Seeds checklist_templates and items per matter type
│       ├── document-templates.ts            # Seeds document templates
│       ├── demo-users.ts                    # Demo staff users for development
│       ├── scenario-uncontested-divorce.ts  # Full uncontested divorce scenario with all related data
│       ├── scenario-sapcr.ts               # Full SAPCR scenario
│       ├── scenario-modification.ts        # Modification scenario
│       └── scenario-adoption.ts            # Adoption scenario
│
├── tests/
│   ├── unit/
│   │   ├── vitest.config.ts
│   │   ├── domain/
│   │   │   ├── matter-lifecycle.test.ts    # State machine transition tests
│   │   │   ├── document-lifecycle.test.ts
│   │   │   ├── filing-lifecycle.test.ts
│   │   │   └── validation.test.ts          # Zod schema validation tests
│   │   ├── workflows/
│   │   │   ├── checklist-runner.test.ts
│   │   │   ├── stage-gate-evaluator.test.ts
│   │   │   ├── deadline-calculator.test.ts
│   │   │   └── conflict-checker.test.ts
│   │   ├── documents/
│   │   │   ├── merge-field-processor.test.ts
│   │   │   └── template-validator.test.ts
│   │   └── auth/
│   │       ├── rbac.test.ts
│   │       ├── permissions.test.ts
│   │       └── mfa.test.ts
│   │
│   ├── integration/
│   │   ├── vitest.config.ts                # Uses test database
│   │   ├── setup.ts                        # Database setup/teardown per suite
│   │   ├── matters/
│   │   │   ├── create-matter.test.ts
│   │   │   ├── stage-transitions.test.ts
│   │   │   └── matter-assignments.test.ts
│   │   ├── documents/
│   │   │   ├── document-workflow.test.ts
│   │   │   └── approval-workflow.test.ts
│   │   ├── filing/
│   │   │   ├── packet-assembly.test.ts
│   │   │   ├── packet-validation.test.ts
│   │   │   └── attorney-approval.test.ts
│   │   ├── intake/
│   │   │   ├── lead-to-matter.test.ts
│   │   │   └── conflict-check.test.ts
│   │   ├── auth/
│   │   │   ├── session-management.test.ts
│   │   │   └── permission-enforcement.test.ts
│   │   └── portal/
│   │       ├── access-scoping.test.ts
│   │       └── client-upload.test.ts
│   │
│   └── e2e/
│       ├── playwright.config.ts
│       ├── fixtures/
│       │   ├── auth.fixture.ts             # Login helper fixtures
│       │   └── seed.fixture.ts             # Database seeding for E2E
│       ├── scenarios/
│       │   ├── uncontested-divorce.spec.ts
│       │   ├── sapcr.spec.ts
│       │   ├── modification.spec.ts
│       │   └── adoption.spec.ts
│       ├── pages/
│       │   ├── login.spec.ts
│       │   ├── dashboard.spec.ts
│       │   ├── matter-detail.spec.ts
│       │   └── portal-dashboard.spec.ts
│       └── accessibility/
│           ├── axe-scan.spec.ts            # Automated axe-core scanning
│           └── keyboard-nav.spec.ts        # Keyboard navigation verification
│
├── docs/
│   ├── requirements/
│   │   ├── business-requirements.md        # High-level business requirements
│   │   ├── workflow-maps/                  # Visual workflow maps per matter type
│   │   │   ├── uncontested-divorce.md
│   │   │   ├── sapcr.md
│   │   │   ├── modification.md
│   │   │   └── adoption.md
│   │   └── acceptance-criteria/            # Detailed acceptance criteria per feature
│   │       ├── intake.md
│   │       ├── matter-management.md
│   │       ├── document-workflow.md
│   │       ├── filing.md
│   │       └── client-portal.md
│   │
│   ├── architecture/
│   │   ├── system-overview.md              # High-level architecture diagram and description
│   │   ├── module-boundaries.md            # Package dependency rules, import restrictions
│   │   ├── data-flow.md                    # How data flows through the system
│   │   ├── auth-architecture.md            # Authentication and authorization design
│   │   └── file-storage.md                 # S3 integration, signed URLs, virus scanning
│   │
│   ├── decisions/                          # Architecture Decision Records
│   │   ├── ADR-001-monorepo-with-turborepo.md
│   │   ├── ADR-002-nextjs-app-router.md
│   │   ├── ADR-003-prisma-orm.md
│   │   ├── ADR-004-separate-portal-app.md
│   │   ├── ADR-005-state-machines-for-lifecycles.md
│   │   ├── ADR-006-s3-file-storage.md
│   │   └── ADR-007-audit-events-append-only.md
│   │
│   ├── runbooks/
│   │   ├── deployment.md                   # Step-by-step deployment procedure
│   │   ├── database-migration.md           # How to run migrations safely
│   │   ├── incident-response.md            # Incident handling procedures
│   │   ├── backup-restore.md               # Database backup and restore procedures
│   │   └── onboarding.md                   # Developer onboarding guide
│   │
│   └── qa/
│       ├── test-plan.md                    # Overall QA strategy
│       ├── regression-checklist.md         # Manual regression checklist for releases
│       └── results/                        # Test run results (CI artifacts linked here)
│           └── .gitkeep
│
├── ops/
│   ├── docker-compose.yml                  # Local development: PostgreSQL, Redis, MinIO (S3-compatible)
│   ├── docker-compose.test.yml             # Test environment with isolated database
│   ├── Dockerfile.staff-web                # Production Dockerfile for staff app
│   ├── Dockerfile.client-portal            # Production Dockerfile for client portal
│   ├── .env.development                    # Development environment variables (safe defaults)
│   ├── .env.test                           # Test environment variables
│   ├── .env.production.template            # Production env template (no secrets)
│   ├── nginx/
│   │   └── default.conf                    # Nginx config for production reverse proxy
│   └── ci/
│       ├── .github/
│       │   └── workflows/
│       │       ├── ci.yml                  # PR checks: lint, type-check, unit tests, integration tests
│       │       ├── e2e.yml                 # Nightly E2E test run
│       │       ├── deploy-staging.yml      # Deploy to staging on merge to main
│       │       └── deploy-production.yml   # Deploy to production on release tag
│       └── scripts/
│           ├── setup-test-db.sh            # Create and migrate test database
│           ├── run-seeds.sh                # Run seed scripts
│           └── health-check.sh             # Post-deploy health check
│
└── prompts/
    └── agents/                             # Agent prompt definitions
        ├── README.md                       # Agent architecture overview
        ├── intake-agent.md                 # Intake and lead qualification
        ├── conflict-check-agent.md         # Conflict of interest checking
        ├── document-drafter-agent.md       # Document generation from templates
        ├── document-reviewer-agent.md      # Document review assistance
        ├── filing-assembler-agent.md       # Filing packet assembly and validation
        ├── deadline-tracker-agent.md       # Deadline monitoring and reminders
        ├── discovery-manager-agent.md      # Discovery request/response tracking
        ├── financial-tracker-agent.md      # Financial entry management
        ├── client-communicator-agent.md    # Client portal communication
        ├── compliance-monitor-agent.md     # Order compliance tracking
        ├── matter-coordinator-agent.md     # Overall matter workflow orchestration
        └── qa-auditor-agent.md             # Quality assurance and audit
```

---

## Naming Conventions

### Files and Directories

| Pattern | Convention | Example |
|---------|-----------|---------|
| Directories | kebab-case | `filing-packets/`, `client-portal/` |
| React components | PascalCase.tsx | `MatterCard.tsx`, `FilingPacketAssembly.tsx` |
| Hooks | camelCase with `use` prefix | `useMatter.ts`, `usePermissions.ts` |
| Utilities/helpers | kebab-case.ts | `api-client.ts`, `date-utils.ts` |
| Types/interfaces | kebab-case.ts, PascalCase exports | `matter.ts` exports `Matter`, `MatterType` |
| Enums | kebab-case.ts, PascalCase exports | `matter-status.ts` exports `MatterStatus` |
| Test files | `{source-file}.test.ts` or `{feature}.spec.ts` | `rbac.test.ts`, `uncontested-divorce.spec.ts` |
| Database seeds | kebab-case.ts | `roles-and-permissions.ts` |
| ADRs | `ADR-NNN-slug.md` | `ADR-001-monorepo-with-turborepo.md` |
| Runbooks | kebab-case.md | `incident-response.md` |

### Code

| Pattern | Convention | Example |
|---------|-----------|---------|
| Variables and functions | camelCase | `getUserPermissions()`, `matterStatus` |
| Types and interfaces | PascalCase | `Matter`, `DocumentApproval`, `FilingPacket` |
| Enums | PascalCase enum, UPPER_SNAKE values | `MatterStatus.ACTIVE`, `FilingStatus.PENDING_REVIEW` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `SESSION_TTL_SECONDS` |
| Database columns (in Prisma) | camelCase in code, snake_case in DB | Prisma `@@map` directives handle mapping |
| API routes | kebab-case URL paths | `/api/filing-packets/[packetId]` |
| Event types (audit) | dot-separated | `matter.created`, `document.approved`, `filing.submitted` |

### Imports

Packages use the `@ttaylor/` namespace:
- `@ttaylor/ui` — Component library
- `@ttaylor/domain` — Domain types and validation
- `@ttaylor/workflows` — Workflow engine
- `@ttaylor/documents` — Document template engine
- `@ttaylor/auth` — Auth utilities
- `@ttaylor/shared` — Common utilities

---

## Branch Strategy

### Branches

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready code. Deploys to staging on merge, production on release tag. | Required: PR review, CI pass, no direct commits |
| `feature/*` | Feature development branches | Named: `feature/intake-workflow`, `feature/filing-packets` |
| `fix/*` | Bug fix branches | Named: `fix/conflict-check-false-positive` |
| `release/*` | Release preparation | Named: `release/1.0.0` |
| `hotfix/*` | Emergency production fixes | Named: `hotfix/session-expiry-bug` |

### Branch Lifecycle

1. Create branch from `main`: `feature/matter-stage-transitions`
2. Develop with commits following message format
3. Open PR against `main`
4. PR passes CI + review
5. Squash merge into `main`
6. Delete feature branch

---

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, config |
| `style` | Formatting, whitespace (no logic change) |
| `perf` | Performance improvement |

### Scopes

| Scope | Usage |
|-------|-------|
| `staff` | Staff web application |
| `portal` | Client portal |
| `ui` | Shared component library |
| `domain` | Domain types and validation |
| `workflows` | Workflow engine |
| `documents` | Document template engine |
| `auth` | Authentication/authorization |
| `db` | Database schema, migrations, seeds |
| `api` | API routes |
| `ops` | Infrastructure, CI/CD |
| `docs` | Documentation |

### Examples

```
feat(staff): add matter stage transition UI with gating validation
fix(workflows): stage gate evaluator now checks all gated items, not just first
refactor(domain): extract filing lifecycle state machine from inline logic
test(integration): add conflict check workflow coverage
docs(decisions): ADR-005 state machines for lifecycles
chore(ops): update docker-compose PostgreSQL to 16.2
```

---

## PR Review Requirements

### Required for Merge

- At least 1 approving review from a team member
- All CI checks pass (lint, type-check, unit tests, integration tests)
- No unresolved review comments
- PR description includes: what changed, why, how to test

### Review Checklist

Reviewers should verify:

1. **Schema changes**: Does the PR update SCHEMA_CANON.md if it modifies the database?
2. **Test coverage**: Are new features covered by tests per TEST_MATRIX.md?
3. **Design compliance**: Do UI changes follow DESIGN_SYSTEM_SPEC.md?
4. **Type safety**: Are new types added to `@ttaylor/domain`?
5. **State machines**: Do lifecycle changes go through the state machine, not raw status updates?
6. **Audit trail**: Do significant actions create audit_events?
7. **Permissions**: Are new endpoints protected with appropriate permission checks?
8. **Accessibility**: Do new UI components meet WCAG 2.1 AA?

---

## Documentation Update Requirements

When a PR includes any of the following, the corresponding documentation must be updated in the same PR:

| Change | Required Documentation Update |
|--------|-------------------------------|
| New database table or column | SCHEMA_CANON.md |
| New testable feature | TEST_MATRIX.md |
| New UI component or pattern | DESIGN_SYSTEM_SPEC.md |
| New directory or package | REPO_STRUCTURE.md |
| Architecture decision | New ADR in docs/decisions/ |
| New API endpoint | API route documentation |
| New workflow rule | docs/requirements/workflow-maps/ |
| Breaking change | Migration guide in PR description |

---

## Development Setup

```bash
# Clone and install
git clone <repo-url>
cd ttaylor
pnpm install

# Start local services (PostgreSQL, Redis, MinIO)
docker compose -f ops/docker-compose.yml up -d

# Set up database
cp .env.example .env
pnpm db:migrate    # Run Prisma migrations
pnpm db:seed       # Seed reference data + demo scenarios

# Start development
pnpm dev           # Starts both staff-web and client-portal

# Run tests
pnpm test:unit     # Unit tests (fast, no DB)
pnpm test:int      # Integration tests (requires test DB)
pnpm test:e2e      # E2E tests (requires running apps)
pnpm lint          # ESLint + Prettier check
pnpm typecheck     # TypeScript compilation check
```
