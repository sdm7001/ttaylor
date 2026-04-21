# ADR-001: System Topology

**Status:** Accepted
**Date:** 2026-04-21
**Deciders:** Architect, Lead Developer
**Supersedes:** None

---

## Context

The Ttaylor Family Law Office operates out of Harris County, Houston, Texas, handling a full range of family law matters: divorce (contested and uncontested), SAPCR/custody, child support establishment and modification, adoption, grandparents' rights, mediation, and post-order enforcement. The firm employs attorneys, senior paralegals, paralegals, intake specialists, legal assistants, and billing clerks.

The platform must support:

1. **Multi-role staff access** -- attorneys, paralegals, intake specialists, and billing clerks each have distinct workflows, permissions, and UI needs. A single staff member may hold multiple roles.
2. **Client portal** -- clients need secure, limited access to their matter status, uploaded documents, and communication history. This portal must be completely isolated from staff operations.
3. **Attorney approval gates** -- Texas law requires attorney supervision of e-filing. No filing packet may be submitted without explicit attorney approval. This is a hard legal constraint, not a workflow preference.
4. **Document automation** -- the firm generates hundreds of standardized legal documents per month (petitions, decrees, orders, motions). Template-driven generation with merge fields from matter data is essential.
5. **Harris County e-filing** -- all filings go through eFileTexas/Odyssey. The platform must assemble filing packets (lead document, attachments, service contacts, filing codes) in the format required by the Harris County District Clerk.
6. **Deadline and calendar tracking** -- Texas Family Code imposes statutory deadlines (60-day waiting period for divorce, response deadlines, discovery windows). Missing a deadline is malpractice exposure.
7. **Audit trail** -- every action on a matter must be logged for compliance and attorney-client privilege protection.
8. **Reporting** -- attorneys need matter pipeline reports, financial summaries, staff productivity metrics, and aging reports. Relational queries with joins across matters, documents, financials, and assignments are the norm.

The firm is a small-to-medium practice (under 20 staff). Operational complexity of the deployment infrastructure must remain manageable by a single DevOps engineer or the development team itself.

---

## Decision

Adopt a **modular monolith** architecture with the following topology:

### Application Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Staff Web Application | Next.js 14+ (App Router) | Primary staff interface for all paralegal, attorney, and admin workflows |
| Client Portal | Next.js 14+ (App Router) | Separate application for client-facing access, deployed independently |
| API Layer | tRPC v11 | Type-safe RPC between frontend and server; procedures organized by domain module |
| Background Jobs | BullMQ + Redis | Async processing: document generation, e-filing submission, notification dispatch, deadline computation |

### Data Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary Database | PostgreSQL 16 | Relational store for all domain data; UUID primary keys, TIMESTAMPTZ timestamps |
| ORM | Prisma 6 | Schema management, migrations, type-safe query builder |
| Cache / Queue Broker | Redis 7 | BullMQ job queue backend, session cache, rate limiting |
| File Storage | S3-compatible (MinIO for dev, AWS S3 for production) | Document storage, filing packet PDFs, uploaded evidence |

### 15 Bounded Modules

The monolith is organized into domain modules. Each module owns its database tables, tRPC procedures, and business logic. Cross-module communication happens through well-defined TypeScript interfaces, never direct table access.

| # | Module | Owns | Description |
|---|--------|------|-------------|
| 1 | **Identity** | users, roles, permissions, user_roles, role_permissions, sessions | Authentication, authorization, RBAC, MFA |
| 2 | **Intake** | leads, intake_questionnaires, conflict_checks | Lead capture, qualification, conflict checking |
| 3 | **Contacts** | contacts, addresses, contact_phone_numbers | People directory: clients, opposing parties, judges, mediators |
| 4 | **Matters** | matters, matter_assignments, matter_contacts | Case lifecycle, staff assignments, contact associations |
| 5 | **Documents** | document_templates, documents, document_versions | Template engine, document generation, version history |
| 6 | **Filing** | filing_packets, filing_packet_documents, filing_submissions | Packet assembly, eFileTexas integration, submission tracking |
| 7 | **Checklists** | checklist_templates, checklist_instances, checklist_items | Workflow checklists tied to matter type and stage |
| 8 | **Calendar** | calendar_events, deadlines, hearing_records | Deadline tracking, court dates, statutory period computation |
| 9 | **Discovery** | discovery_requests, discovery_responses, discovery_items | Interrogatories, production requests, response tracking |
| 10 | **Financial** | fee_agreements, invoices, invoice_line_items, payments, trust_ledger | Billing, trust accounting, payment tracking |
| 11 | **Notes** | notes, note_attachments | Matter notes, internal communications, file memos |
| 12 | **Notifications** | notification_templates, notification_queue, notification_log | Email, SMS, in-app notifications to staff and clients |
| 13 | **Portal** | portal_access, portal_messages, portal_shared_documents | Client portal data isolation layer |
| 14 | **Audit** | audit_events | Immutable audit log for all permission-checked operations |
| 15 | **Reports** | (views and materialized views over other modules' tables) | Dashboards, pipeline reports, financial summaries |

### Deployment Topology

```
                    +------------------+
                    |   Nginx / Caddy  |
                    |   Reverse Proxy  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+         +---------v--------+
     | Staff Web App    |         | Client Portal    |
     | (Next.js)        |         | (Next.js)        |
     | Port 3000        |         | Port 3001        |
     +--------+---------+         +---------+--------+
              |                             |
              +-------------+---------------+
                            |
                   +--------v--------+
                   |   tRPC Router   |
                   |   (in-process)  |
                   +--------+--------+
                            |
              +-------------+-------------+
              |             |             |
     +--------v---+  +-----v------+  +---v--------+
     | PostgreSQL  |  |   Redis    |  |  S3 / MinIO|
     | Port 5432   |  | Port 6379  |  |  Port 9000 |
     +-------------+  +------------+  +------------+
```

The tRPC router runs in-process within the Next.js server-side runtime (not as a separate service). BullMQ workers run as a separate Node.js process sharing the same codebase.

---

## Consequences

### Positive

1. **Single deployment unit** -- the staff application, API layer, and background workers share one codebase and one deployment pipeline. No inter-service networking, no service discovery, no distributed tracing.
2. **Type safety end-to-end** -- tRPC + Prisma + TypeScript means the compiler catches mismatches between frontend calls, API procedures, and database queries at build time.
3. **Transactional integrity** -- because all modules share one PostgreSQL instance, cross-module operations (e.g., converting a lead to a matter while creating checklist instances and assigning staff) execute in a single database transaction.
4. **Simple local development** -- `docker compose up` starts PostgreSQL, Redis, and MinIO. `npm run dev` starts the app. No Kubernetes, no service mesh.
5. **Relational reporting** -- PostgreSQL enables complex joins across matters, documents, financials, and calendar events without data federation or ETL pipelines.
6. **Module boundaries enforce discipline** -- even within a monolith, each module's tables and procedures are namespaced, preventing spaghetti dependencies.

### Negative

1. **Scaling ceiling** -- the monolith scales vertically. If the practice grows to 100+ staff with thousands of concurrent users, the architecture would need revisiting. For a sub-20-person firm, this ceiling is years away.
2. **Shared failure domain** -- a bug in the Financial module's background job can crash the BullMQ worker process, delaying Notification queue processing. Mitigation: separate BullMQ worker processes per queue priority.
3. **Deploy coupling** -- a change to the Intake module requires redeploying the entire application. Mitigation: the deployment is a single Docker image with sub-10-second restarts; downtime is negligible.
4. **Module discipline is convention** -- there is no runtime enforcement preventing Module A from importing Module B's internal types. Mitigation: ESLint boundaries plugin + code review + `@ttaylor/*` package boundaries.

---

## Alternatives Considered

### Microservices

Each bounded module deployed as an independent service with its own database, communicating via gRPC or HTTP.

**Rejected because:**
- Operational complexity is disproportionate to firm size. A 15-person law office does not need Kubernetes, service mesh, distributed tracing, or circuit breakers.
- Cross-service transactions (lead-to-matter conversion, filing packet assembly spanning documents + contacts + matters) require saga patterns or two-phase commit, adding fragility where PostgreSQL transactions provide atomicity for free.
- The team maintaining this platform is small. Microservices require dedicated DevOps capacity that a legal technology project of this scale cannot justify.

### NoSQL (MongoDB / DynamoDB)

Document store for flexible schema, particularly around intake questionnaires and checklist templates.

**Rejected because:**
- The domain is fundamentally relational. Matters have many documents, documents belong to filing packets, filing packets reference contacts and court details, financials tie to matters and line items. These are join-heavy queries.
- Reporting requirements (aging reports, pipeline dashboards, financial summaries) depend on SQL aggregations across normalized tables.
- JSONB columns in PostgreSQL provide document-store flexibility where needed (intake questionnaire responses, checklist template definitions) without sacrificing relational integrity for the rest of the schema.
- Audit trail queries (show all actions on matter X by user Y between dates A and B) are naturally expressed as indexed SQL queries, not document scans.

---

## Implementation Notes

### Package Structure

The monolith uses a Turborepo workspace with internal packages:

- `@ttaylor/domain` -- shared types, enums, value objects (no runtime dependencies)
- `@ttaylor/ui` -- shared React component library
- `@ttaylor/workflows` -- state machine definitions and checklist engine
- `@ttaylor/documents` -- template engine and document lifecycle logic
- `@ttaylor/auth` -- RBAC helpers, permission constants, middleware
- `@ttaylor/shared` -- utilities, constants, date helpers

### Module Communication Rules

1. Modules may import from `@ttaylor/domain` freely (types only, no side effects).
2. Modules may call other modules only through their exported tRPC procedures or service interfaces, never by importing internal functions.
3. Database tables are owned by exactly one module. Other modules access that data through the owning module's service layer.
4. Background jobs are dispatched via BullMQ queues named by module: `documents:generate`, `filing:submit`, `notifications:send`.

### Database Conventions

Per the Schema Canon (SCHEMA_CANON.md):
- Table names: plural snake_case
- Column names: singular snake_case
- Primary keys: `id UUID DEFAULT gen_random_uuid()`
- Timestamps: `created_at` and `updated_at` on every table
- Soft deletes: `deleted_at TIMESTAMPTZ NULL` where appropriate
- Enums: stored as `TEXT` with CHECK constraints
- Indexes: `idx_{table}_{columns}`

### Environment Targets

| Environment | Database | File Storage | Purpose |
|-------------|----------|-------------|---------|
| Local dev | PostgreSQL via Docker Compose | MinIO | Developer workstation |
| Staging | Managed PostgreSQL (e.g., Supabase, RDS) | S3 | QA and client demos |
| Production | Managed PostgreSQL with daily backups | S3 with versioning | Live system |
