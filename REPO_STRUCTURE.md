# Repository Structure -- Ttaylor Family Law Paralegal Platform

**Version:** 1.0.0
**Status:** Phase 1 -- Foundation
**Last Updated:** 2026-04-21

---

## Overview

The repository is organized as a **Turborepo monorepo** with two Next.js applications, six shared packages, one service layer, one database directory, and supporting directories for tests, documentation, operations, and AI agent prompts.

---

## Directory Tree

```
ttaylor/
|
|-- apps/
|   |-- staff-web/                 Next.js 14+ staff application (App Router)
|   |   |-- app/                   App Router pages and layouts
|   |   |   |-- (auth)/            Auth-related routes (sign-in, sign-up)
|   |   |   |-- (dashboard)/      Dashboard and analytics pages
|   |   |   |-- admin/             User management, templates, settings
|   |   |   |-- finance/           Invoices, payments, trust ledger
|   |   |   |-- filing/            Filing queue and packet detail
|   |   |   |-- leads/             Intake/lead management
|   |   |   |-- matters/           Matter list, detail, tabbed sub-views
|   |   |   |-- reports/           Report views
|   |   |   |-- layout.tsx         Root layout with sidebar navigation
|   |   |   |-- page.tsx           Dashboard home
|   |   |-- components/            Staff-app-specific components
|   |   |-- hooks/                 Staff-app-specific React hooks
|   |   |-- lib/                   Staff-app utilities (trpc client, etc.)
|   |   |-- public/                Static assets (favicon, logos)
|   |   |-- next.config.ts         Next.js configuration
|   |   |-- tailwind.config.ts     Tailwind CSS configuration
|   |   |-- tsconfig.json          TypeScript configuration (extends root)
|   |   |-- package.json
|   |
|   |-- client-portal/             Next.js 14+ client-facing portal
|   |   |-- app/                   App Router pages and layouts
|   |   |   |-- (auth)/            Portal auth routes (sign-in, magic link)
|   |   |   |-- portal/            Portal dashboard, matter view, messages
|   |   |   |-- layout.tsx         Portal root layout
|   |   |   |-- page.tsx           Portal landing / login redirect
|   |   |-- components/            Portal-specific components
|   |   |-- hooks/                 Portal-specific React hooks
|   |   |-- lib/                   Portal utilities (trpc client, etc.)
|   |   |-- public/                Portal static assets
|   |   |-- next.config.ts
|   |   |-- tailwind.config.ts
|   |   |-- tsconfig.json
|   |   |-- package.json
|
|-- packages/
|   |-- ui/                        Shared UI component library (@ttaylor/ui)
|   |   |-- src/
|   |   |   |-- components/        Reusable components (Button, Card, Badge, etc.)
|   |   |   |   |-- button.tsx
|   |   |   |   |-- card.tsx
|   |   |   |   |-- badge.tsx
|   |   |   |   |-- data-table.tsx
|   |   |   |   |-- dialog.tsx
|   |   |   |   |-- form/          Form components (input, select, textarea, etc.)
|   |   |   |   |-- empty-state.tsx
|   |   |   |   |-- loading-state.tsx
|   |   |   |   |-- page-header.tsx
|   |   |   |   |-- sidebar-nav.tsx
|   |   |   |   |-- status-pill.tsx
|   |   |   |-- styles/            Design tokens as CSS custom properties
|   |   |   |   |-- tokens.css     Color, spacing, typography, shadow tokens
|   |   |   |   |-- globals.css    Reset and base styles
|   |   |   |-- index.ts           Public barrel export
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |
|   |-- domain/                    Domain types and value objects (@ttaylor/domain)
|   |   |-- src/
|   |   |   |-- enums/             All status enums (MatterStatus, DocumentStatus, etc.)
|   |   |   |   |-- matter-status.ts
|   |   |   |   |-- document-status.ts
|   |   |   |   |-- filing-packet-status.ts
|   |   |   |   |-- lead-status.ts
|   |   |   |   |-- contact-type.ts
|   |   |   |-- types/             TypeScript interfaces and type definitions
|   |   |   |   |-- matter.ts
|   |   |   |   |-- document.ts
|   |   |   |   |-- filing-packet.ts
|   |   |   |   |-- contact.ts
|   |   |   |   |-- user.ts
|   |   |   |   |-- lead.ts
|   |   |   |   |-- calendar-event.ts
|   |   |   |   |-- financial.ts
|   |   |   |-- value-objects/     Immutable value objects (CauseNumber, BarNumber, etc.)
|   |   |   |   |-- cause-number.ts
|   |   |   |   |-- bar-number.ts
|   |   |   |   |-- filing-code.ts
|   |   |   |-- index.ts           Public barrel export
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |
|   |-- workflows/                 Workflow state machines and checklist engine (@ttaylor/workflows)
|   |   |-- src/
|   |   |   |-- state-machines/    XState or custom state machine definitions
|   |   |   |   |-- matter-lifecycle.ts
|   |   |   |   |-- document-lifecycle.ts
|   |   |   |   |-- filing-packet-lifecycle.ts
|   |   |   |   |-- lead-lifecycle.ts
|   |   |   |-- checklist-engine/  Checklist template instantiation and tracking
|   |   |   |   |-- engine.ts
|   |   |   |   |-- templates/     JSON checklist definitions per matter type
|   |   |   |-- index.ts
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |
|   |-- documents/                 Template engine and document lifecycle (@ttaylor/documents)
|   |   |-- src/
|   |   |   |-- template-engine/   Handlebars compilation and merge field resolution
|   |   |   |   |-- compiler.ts
|   |   |   |   |-- merge-context.ts
|   |   |   |   |-- helpers/       Custom Handlebars helpers (date formatting, etc.)
|   |   |   |-- pdf-renderer/      HTML-to-PDF rendering (Puppeteer or equivalent)
|   |   |   |   |-- renderer.ts
|   |   |   |   |-- page-styles.ts
|   |   |   |-- version-manager/   Document version creation and integrity checks
|   |   |   |   |-- versioner.ts
|   |   |   |   |-- hash.ts        SHA-256 hashing for file integrity
|   |   |   |-- index.ts
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |
|   |-- auth/                      RBAC helpers and permission constants (@ttaylor/auth)
|   |   |-- src/
|   |   |   |-- permissions.ts     Permission key constants (matter:create, etc.)
|   |   |   |-- roles.ts           Role slug constants and default grants
|   |   |   |-- middleware/        tRPC middleware (requirePermission, requireAttorney)
|   |   |   |   |-- require-permission.ts
|   |   |   |   |-- require-attorney.ts
|   |   |   |   |-- audit-logger.ts
|   |   |   |-- clerk/             Clerk integration helpers (webhook sync, JWT parsing)
|   |   |   |   |-- webhook-handler.ts
|   |   |   |   |-- session-claims.ts
|   |   |   |-- index.ts
|   |   |-- package.json
|   |   |-- tsconfig.json
|   |
|   |-- shared/                    Utilities, constants, shared helpers (@ttaylor/shared)
|   |   |-- src/
|   |   |   |-- date-utils.ts      Date formatting, statutory period calculation
|   |   |   |-- string-utils.ts    Name formatting, cause number parsing
|   |   |   |-- validation.ts      Zod schemas shared across packages
|   |   |   |-- constants.ts       Application-wide constants
|   |   |   |-- errors.ts          Custom error classes
|   |   |   |-- index.ts
|   |   |-- package.json
|   |   |-- tsconfig.json
|
|-- services/
|   |-- api/                       tRPC router definitions
|   |   |-- src/
|   |   |   |-- root.ts            Root tRPC router (merges all module routers)
|   |   |   |-- trpc.ts            tRPC instance, context, base procedures
|   |   |   |-- context.ts         Request context creation (user, permissions, audit)
|   |   |   |-- routers/           Per-module router definitions
|   |   |   |   |-- matter.router.ts
|   |   |   |   |-- document.router.ts
|   |   |   |   |-- filing.router.ts
|   |   |   |   |-- lead.router.ts
|   |   |   |   |-- contact.router.ts
|   |   |   |   |-- calendar.router.ts
|   |   |   |   |-- discovery.router.ts
|   |   |   |   |-- financial.router.ts
|   |   |   |   |-- note.router.ts
|   |   |   |   |-- checklist.router.ts
|   |   |   |   |-- notification.router.ts
|   |   |   |   |-- portal.router.ts
|   |   |   |   |-- user.router.ts
|   |   |   |   |-- report.router.ts
|   |   |   |   |-- audit.router.ts
|   |   |   |-- services/          Business logic layer (called by routers)
|   |   |   |   |-- matter.service.ts
|   |   |   |   |-- document.service.ts
|   |   |   |   |-- filing.service.ts
|   |   |   |   |-- (one per module)
|   |   |   |-- jobs/              BullMQ job processors
|   |   |   |   |-- document-generation.job.ts
|   |   |   |   |-- filing-submission.job.ts
|   |   |   |   |-- notification-dispatch.job.ts
|   |   |   |   |-- deadline-computation.job.ts
|   |   |   |   |-- worker.ts      BullMQ worker entry point
|   |   |-- package.json
|   |   |-- tsconfig.json
|
|-- database/
|   |-- schema/                    Prisma schema files
|   |   |-- schema.prisma          Main Prisma schema (all models)
|   |   |-- enums.prisma           Enum definitions (if using multi-file schema)
|   |-- migrations/                Prisma migration files (timestamp-prefixed)
|   |   |-- 20260421000000_initial_schema/
|   |   |   |-- migration.sql
|   |-- seeds/                     Seed data scripts
|   |   |-- index.ts               Seed entry point
|   |   |-- roles-and-permissions.ts   Canonical role/permission seed
|   |   |-- reference-tables.ts    Harris County courts, filing codes, case categories
|   |   |-- sample-data.ts         Development-only sample matters, contacts, documents
|
|-- tests/
|   |-- unit/                      Unit tests (no external dependencies)
|   |   |-- domain/                Tests for enums, value objects, type guards
|   |   |-- workflows/             Tests for state machine transitions
|   |   |-- documents/             Tests for template compilation, merge fields
|   |   |-- auth/                  Tests for permission checking logic
|   |   |-- shared/                Tests for utility functions
|   |-- integration/               Integration tests (real database)
|   |   |-- api/                   tRPC router tests with test database
|   |   |-- services/              Service layer tests with real Prisma client
|   |   |-- jobs/                  BullMQ job processor tests
|   |   |-- setup.ts               Test database setup/teardown, transaction rollback
|   |-- e2e/                       Playwright end-to-end tests
|   |   |-- staff/                 Staff application E2E tests
|   |   |   |-- matter-crud.spec.ts
|   |   |   |-- document-workflow.spec.ts
|   |   |   |-- filing-packet.spec.ts
|   |   |   |-- lead-intake.spec.ts
|   |   |-- portal/                Client portal E2E tests
|   |   |   |-- portal-login.spec.ts
|   |   |   |-- portal-documents.spec.ts
|   |   |-- fixtures/              Test data fixtures
|   |   |-- playwright.config.ts   Playwright configuration
|
|-- docs/
|   |-- requirements/              Business requirements documents
|   |   |-- functional-requirements.md
|   |   |-- non-functional-requirements.md
|   |-- architecture/              Architecture diagrams and overviews
|   |   |-- system-context.md
|   |   |-- module-boundaries.md
|   |   |-- data-flow.md
|   |-- decisions/                 Architectural Decision Records
|   |   |-- ADR-001-system-topology.md
|   |   |-- ADR-002-auth-and-rbac.md
|   |   |-- ADR-003-document-and-filing-workflow.md
|   |-- runbooks/                  Operational runbooks
|   |   |-- deployment.md
|   |   |-- database-backup.md
|   |   |-- incident-response.md
|   |-- qa/                        QA plans and test records
|   |   |-- test-plan.md
|   |   |-- test-results/
|
|-- ops/                           DevOps and deployment
|   |-- docker/
|   |   |-- Dockerfile.staff       Staff web app Dockerfile
|   |   |-- Dockerfile.portal      Client portal Dockerfile
|   |   |-- Dockerfile.worker      BullMQ worker Dockerfile
|   |-- docker-compose.yml         Local dev stack (PostgreSQL, Redis, MinIO)
|   |-- docker-compose.prod.yml    Production compose (if self-hosted)
|   |-- ci/                        CI/CD pipeline definitions
|   |   |-- github-actions/        GitHub Actions workflow files
|   |   |   |-- ci.yml             Lint, type-check, test on PR
|   |   |   |-- deploy-staging.yml Deploy to staging on merge to main
|   |   |   |-- deploy-prod.yml    Deploy to production on release tag
|   |-- scripts/                   Deployment and maintenance scripts
|   |   |-- db-migrate.sh          Run Prisma migrations in production
|   |   |-- db-seed.sh             Run seed scripts
|   |   |-- healthcheck.sh         Application health check
|
|-- prompts/
|   |-- agents/                    AI agent prompt files
|   |   |-- architect.md           Architecture agent system prompt
|   |   |-- coder.md               Implementation agent system prompt
|   |   |-- reviewer.md            Code review agent system prompt
|   |   |-- tester.md              Test authoring agent system prompt
|
|-- turbo.json                     Turborepo pipeline configuration
|-- package.json                   Root package.json (workspace definition)
|-- tsconfig.json                  Root TypeScript configuration (shared compiler options)
|-- .eslintrc.js                   Root ESLint configuration (shared rules)
|-- .prettierrc                    Prettier configuration
|-- .gitignore                     Git ignore rules
|-- .env.example                   Environment variable template
|-- DESIGN_SYSTEM_SPEC.md          Design system specification
|-- REPO_STRUCTURE.md              This file
|-- PROJECT_CHARTER.md             Project charter and scope
|-- SCHEMA_CANON.md                Database schema source of truth
|-- WORKFLOW_CATALOG.md            All 14 workflow type definitions
|-- DOMAIN_GLOSSARY.md             Legal and platform terminology
|-- DECISIONS.md                   Decision log index
|-- DELIVERY_PLAN.md               Phase delivery plan
|-- STATUS.md                      Current project status
|-- RISKS.md                       Risk register
|-- TEST_MATRIX.md                 Test coverage matrix
|-- ASSUMPTIONS.md                 Project assumptions
|-- TEAM_CHARTER.md                Team working agreements
```

---

## Naming Conventions

### Files and Directories

| Rule | Example |
|------|---------|
| All file names: **kebab-case** | `matter-lifecycle.ts`, `filing-packet-status.ts` |
| TypeScript source files: `.ts` extension | `cause-number.ts`, `engine.ts` |
| React component files: `.tsx` extension | `button.tsx`, `data-table.tsx` |
| Test files: `.test.ts` or `.test.tsx` suffix | `matter-lifecycle.test.ts`, `button.test.tsx` |
| E2E test files: `.spec.ts` suffix | `matter-crud.spec.ts` |
| Prisma migration directories: timestamp-prefixed | `20260421000000_initial_schema/` |
| Seed scripts: descriptive kebab-case | `roles-and-permissions.ts` |
| Documentation: UPPER-KEBAB-CASE for top-level, kebab-case for nested | `SCHEMA_CANON.md`, `system-context.md` |

### TypeScript

| Rule | Example |
|------|---------|
| Types/Interfaces: PascalCase | `Matter`, `FilingPacket`, `DocumentVersion` |
| Enums: PascalCase with UPPER_SNAKE values | `MatterStatus.ACTIVE`, `DocumentStatus.UNDER_REVIEW` |
| Functions: camelCase | `createMatter()`, `approveFiling()` |
| Constants: UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE` |
| Boolean variables: `is`/`has`/`can` prefix | `isAttorney`, `hasChildren`, `canApprove` |
| tRPC routers: `{module}.router.ts` | `matter.router.ts` |
| tRPC procedures: `{verb}{Noun}` | `createMatter`, `getMatterById`, `listMatters` |

### Database (per Schema Canon)

| Rule | Example |
|------|---------|
| Table names: plural snake_case | `matters`, `filing_packets` |
| Column names: singular snake_case | `first_name`, `created_at` |
| Primary keys: `id UUID` | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys: `{table_singular}_id` | `matter_id`, `user_id` |
| Indexes: `idx_{table}_{columns}` | `idx_matters_status`, `idx_documents_matter_id` |

---

## Import Alias Conventions

All shared packages are referenced via the `@ttaylor/` namespace. These aliases are configured in each application's `tsconfig.json` and Turborepo's workspace resolution.

| Alias | Package | Example Import |
|-------|---------|----------------|
| `@ttaylor/ui` | `packages/ui` | `import { Button, Card, DataTable } from '@ttaylor/ui'` |
| `@ttaylor/domain` | `packages/domain` | `import { MatterStatus, type Matter } from '@ttaylor/domain'` |
| `@ttaylor/workflows` | `packages/workflows` | `import { matterLifecycle } from '@ttaylor/workflows'` |
| `@ttaylor/documents` | `packages/documents` | `import { compileTemplate, renderPdf } from '@ttaylor/documents'` |
| `@ttaylor/auth` | `packages/auth` | `import { requirePermission, PERMISSIONS } from '@ttaylor/auth'` |
| `@ttaylor/shared` | `packages/shared` | `import { formatDate, parseBarNumber } from '@ttaylor/shared'` |

**Within applications**, local imports use relative paths:

```typescript
// In apps/staff-web/app/matters/page.tsx
import { MatterListView } from '../../components/matter-list-view';
```

**Cross-package imports are forbidden.** `@ttaylor/ui` cannot import from `@ttaylor/auth`. `@ttaylor/domain` cannot import from `@ttaylor/workflows`. If two packages need to share logic, it goes in `@ttaylor/shared` or `@ttaylor/domain`.

**Package dependency graph (allowed directions only):**

```
apps/staff-web ------> @ttaylor/ui
apps/staff-web ------> @ttaylor/domain
apps/staff-web ------> @ttaylor/auth
apps/staff-web ------> @ttaylor/shared
apps/client-portal --> @ttaylor/ui
apps/client-portal --> @ttaylor/domain
apps/client-portal --> @ttaylor/shared
services/api --------> @ttaylor/domain
services/api --------> @ttaylor/auth
services/api --------> @ttaylor/workflows
services/api --------> @ttaylor/documents
services/api --------> @ttaylor/shared
@ttaylor/ui ---------> @ttaylor/domain    (for type imports only)
@ttaylor/workflows --> @ttaylor/domain
@ttaylor/documents --> @ttaylor/domain
@ttaylor/documents --> @ttaylor/shared
@ttaylor/auth -------> @ttaylor/domain
@ttaylor/auth -------> @ttaylor/shared
@ttaylor/shared -----> (no internal deps)
@ttaylor/domain -----> (no internal deps)
```

This dependency graph is enforced by ESLint boundaries plugin in CI. Any import that violates this graph fails the lint check.

---

## Turborepo Pipeline

```jsonc
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test:unit": {
      "dependsOn": ["^build"]
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "env": ["DATABASE_URL"]
    },
    "test:e2e": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Local Development Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d

# 3. Run database migrations
npx prisma migrate dev --schema=database/schema/schema.prisma

# 4. Seed reference data and sample data
npx tsx database/seeds/index.ts

# 5. Start dev servers (staff-web on :3000, client-portal on :3001)
npm run dev
```
