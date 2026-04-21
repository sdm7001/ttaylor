# Ttaylor -- Production Readiness Checklist

**Last Updated**: 2026-04-21
**Target**: Pilot deployment for Ttaylor Legal (Harris County, TX)

---

## Architecture and Code

- [x] Modular monolith with 15 bounded modules implemented
- [x] Turborepo monorepo with two Next.js 14 applications (staff-web, client-portal)
- [x] tRPC API with 9 routers and 40+ procedures
- [x] Attorney approval gates enforced at API layer (not bypassable from client)
- [x] Filing packet validation (Harris County requirements: lead document, approved docs, cover sheet)
- [x] Audit trail on all domain mutations (audit_events table)
- [x] RBAC enforced via tRPC middleware (role checked on every procedure call)
- [x] Client portal isolated from staff application (separate Next.js app, separate Clerk org)
- [x] 5 shared packages: @ttaylor/domain, @ttaylor/auth, @ttaylor/workflows, @ttaylor/documents, @ttaylor/ui

## Database

- [x] Prisma schema covers all 40+ tables (870-line schema.prisma)
- [x] Seed data: 5 roles, 30 permissions, 9 Texas family law matter types
- [x] Migration scripts ready (prisma migrate deploy)
- [x] Database health check query documented

## Testing

- [x] 153 unit tests across workflow and document modules
- [x] 12 integration tests for matter lifecycle
- [x] 4 E2E test scenarios (uncontested divorce, SAPCR, modification, portal)
- [x] Test matrix documented in TEST_MATRIX.md

## Security

- [x] Clerk authentication on all protected routes
- [x] Server-side permission checks via tRPC middleware (not client-side only)
- [x] Attorney approval required for document approval and filing packet submission
- [x] Client portal read-only for clients (enforced at API layer)
- [x] Audit log for all sensitive operations (matter state changes, document approvals, filing submissions)
- [x] Environment variables for all secrets (no hardcoded credentials)

## Operations

- [x] Docker Compose for local development (PostgreSQL 16, Redis 7, Adminer)
- [x] Makefile with standard targets (dev, db-migrate, db-seed, db-reset, test, build, lint, typecheck)
- [x] Deployment runbook written (docs/runbooks/DEPLOYMENT.md)
- [x] Backup and recovery procedures documented (docs/runbooks/BACKUP-RECOVERY.md)
- [x] Operations guide written (docs/runbooks/OPERATIONS.md)
- [x] Staff onboarding guide written (docs/runbooks/ONBOARDING.md)
- [x] Environment variable template documented in deployment runbook

## Documentation

- [x] PROJECT_CHARTER.md -- scope, stakeholders, constraints
- [x] DELIVERY_PLAN.md -- phased delivery schedule
- [x] DOMAIN_GLOSSARY.md -- Texas family law terminology
- [x] WORKFLOW_CATALOG.md -- all business processes documented
- [x] SCHEMA_CANON.md -- database design decisions
- [x] REPO_STRUCTURE.md -- full directory tree explanation
- [x] API-CONVENTIONS.md -- tRPC router and procedure standards
- [x] ERD.md -- entity relationship diagram
- [x] STATE-MACHINES.md -- matter and document lifecycle state machines
- [x] RBAC-MATRIX.md -- role-permission matrix
- [x] MODULE-BOUNDARIES.md -- package dependency rules
- [x] DESIGN_SYSTEM_SPEC.md -- UI component library specification

---

## Outstanding Before Go-Live

These items require real configuration with production credentials and services. They are NOT code issues -- the code is ready. These are environment setup tasks.

- [ ] Clerk production keys configured (staff application + portal application)
- [ ] Real DATABASE_URL for production PostgreSQL (DigitalOcean Managed Database or VPS-local)
- [ ] S3-compatible file storage configured and tested (bucket created, IAM credentials, CORS policy)
- [ ] Nginx SSL certificates provisioned from Let's Encrypt (requires DNS A records pointing to VPS)
- [ ] DNS records created: staff.ttaylorlegal.com and portal.ttaylorlegal.com
- [ ] SMTP credentials configured for email notifications (Sendgrid, Mailgun, or direct SMTP)
- [ ] Document templates loaded for the firm's actual practice areas (Handlebars .hbs files)
- [ ] Initial ADMIN user created in Clerk and verified in application
- [ ] eFileTexas/Odyssey API credentials obtained (future phase -- BullMQ filing job is a placeholder)
- [ ] Smoke test: sign in as each role, create a lead, convert to matter, generate document, approve, assemble packet
