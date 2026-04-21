# Project Charter: Ttaylor Family Law Paralegal Operations Platform

**Document ID:** TTAYLOR-CHARTER-001
**Version:** 1.0
**Date:** 2026-04-20
**Status:** Approved for Phase 1

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Ttaylor Family Law Paralegal Operations Platform |
| **Client** | Ttaylor Family Law Office, Harris County, Houston, Texas |
| **Project Type** | Production-grade legal operations web platform |
| **Primary Users** | Paralegals, legal assistants, attorneys, clients |

---

## 2. Purpose and Vision

This platform automates the support-layer legal work that sits beneath the attorney role in a family law practice. It handles the operational backbone of paralegal tasks — intake, document preparation, filing packet assembly, deadline tracking, discovery management, and client communication — while preserving attorney review authority and filing decision-making at every legally significant juncture.

The platform does not replace legal judgment. It systematizes the repeatable, high-volume paralegal workflows that consume the majority of staff hours in a busy Harris County family law office, freeing attorneys to focus on strategy, negotiation, and courtroom advocacy.

---

## 3. Practice Areas Served

The platform supports the full range of family law matters handled by the firm:

1. **Divorce** — Original Petition for Divorce, contested and uncontested, community property division, spousal maintenance
2. **SAPCR / Custody** — Suit Affecting the Parent-Child Relationship, conservatorship, possession and access schedules
3. **Child Support** — Establishment, calculation worksheets, income verification, wage withholding orders
4. **Modification** — Modifications of prior orders (custody, support, possession schedules) based on material and substantial change
5. **Adoption** — Stepparent adoption, adult adoption, termination of parental rights prerequisites
6. **Grandparents' Rights** — Standing determinations, possession and access petitions under Texas Family Code Chapter 153
7. **Mediation and Arbitration** — Pre-mediation preparation, mediated settlement agreement drafting, arbitration scheduling
8. **Post-Order Enforcement** — Motions for enforcement, contempt preparation, arrearage calculations, compliance tracking

---

## 4. Scope

### 4.1 In-Scope: 15 Core Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Identity and Access Management** | Role-based access control (Attorney, Paralegal, Legal Assistant, Client), MFA, session management, audit trail of all access events |
| 2 | **Intake and New Matter Creation** | Client intake forms, conflict pre-screening, matter type classification, initial document collection, attorney assignment |
| 3 | **Conflict Resolution Engine** | Party name and SSN cross-referencing against all active and closed matters, adverse party detection, conflict waiver workflows |
| 4 | **Matter Management** | Central matter dashboard with status tracking, matter lifecycle states, linked contacts, documents, deadlines, and notes |
| 5 | **Contacts and Parties** | Contact registry for clients, opposing parties, opposing counsel, judges, mediators, CPS caseworkers, amicus attorneys, and other participants |
| 6 | **Checklist Engine** | Practice-area-specific task checklists with dependency ordering, assignment, due dates, and completion tracking tied to matter state |
| 7 | **Document Automation** | Template-driven document generation for petitions, orders, discovery requests, and filing cover sheets with merge-field population from matter data |
| 8 | **Filing and Court Workflow** | Filing packet assembly per Harris County requirements, attorney review and approval gates, filing status tracking, service of process logging |
| 9 | **Calendar and Deadlines** | Court dates, statutory deadlines (e.g., 60-day waiting period for divorce), task due dates, hearing scheduling, conflict detection across matters |
| 10 | **Discovery Management** | Discovery request and response tracking, production deadlines, privilege log support, document exchange logging |
| 11 | **Client Portal** | Secure client-facing portal for document upload, message exchange with staff, appointment scheduling, matter status visibility |
| 12 | **Financial and Support Calculations** | Child support guideline calculator per Texas Family Code, community property inventory worksheets, spousal maintenance estimation |
| 13 | **Orders and Compliance Tracking** | Final order clause tracking, compliance verification against ordered terms, modification trigger identification |
| 14 | **Reporting and Analytics** | Matter volume reports, aging analysis, staff workload distribution, filing compliance rates, client portal engagement metrics |
| 15 | **Audit and Activity Logging** | Immutable audit trail for all legally significant actions, user activity logs, document version history, access logs for compliance |

### 4.2 Out of Scope (v1)

| Item | Rationale |
|------|-----------|
| **Direct e-filing API integration** | Texas eFiling (eFileTexas.gov) API integration deferred to v2; v1 produces compliant filing packets for manual upload |
| **Billing and invoicing system** | Firm uses separate billing software; integration deferred |
| **Time tracking** | Not in paralegal ops scope; covered by existing firm tools |
| **Accounting and trust account management** | Requires IOLTA compliance outside platform scope |
| **Mobile native applications** | Web-responsive design serves mobile needs in v1 |

---

## 5. Stakeholders

| Role | Responsibilities | Platform Access Level |
|------|-----------------|----------------------|
| **Attorneys** | Final review and approval of all filings, legal strategy decisions, client relationship ownership | Full access, approval authority |
| **Paralegals** | Matter management, document preparation, filing packet assembly, discovery coordination, client communication | Full operational access, no filing approval |
| **Legal Assistants** | Intake processing, calendar management, contact maintenance, document organization | Operational access, limited to assigned matters |
| **Clients** | Document upload, secure messaging, appointment requests, matter status review | Client portal only, own-matter access |
| **Firm Administrator** | User management, system configuration, reporting | Administrative access |

---

## 6. Success Criteria

The platform will be considered successful when it demonstrably supports:

1. **Complete matter lifecycle coverage** — A matter can be created at intake and tracked through every stage to post-order compliance without leaving the platform for operational tasks.

2. **Attorney approval gates on all legally significant actions** — No document is marked as filed, no filing packet is finalized, and no client-facing legal document is sent without explicit attorney approval recorded in the audit trail.

3. **Harris County filing packet compliance** — Every filing packet produced by the platform contains the correct cover sheet, proposed order, certificate of service, and supporting documents required by Harris County District Clerk filing rules.

4. **Conflict detection accuracy** — The conflict resolution engine correctly identifies all adverse party matches across active and closed matters with zero false negatives in testing.

5. **Deadline integrity** — All statutory deadlines (waiting periods, discovery response windows, appeal deadlines) are calculated correctly per Texas Family Code and Texas Rules of Civil Procedure, with advance warning notifications.

6. **Audit completeness** — Every legally significant action (document generation, approval, filing, client communication) is recorded in an immutable audit log with timestamp, actor, and action detail.

7. **Client portal security** — Client portal authentication is independent from staff authentication, enforces MFA, and restricts access strictly to the authenticated client's own matter data.

8. **Staff adoption readiness** — The platform ships with seed data, user documentation, and a demo script sufficient for staff training without developer assistance.

---

## 7. Constraints

| Constraint | Impact |
|------------|--------|
| **Texas e-filing requirements** | All document formats, naming conventions, and filing packet structures must comply with Texas eFiling Manager standards even though direct API integration is deferred |
| **Harris County family filing packet rules** | Filing packets must match Harris County District Clerk requirements for family law filings, including local standing orders and required attachments |
| **Attorney-only authority at legal decision points** | The system must enforce that only users with the Attorney role can approve filings, sign off on proposed orders, and authorize client-facing legal documents |
| **Texas Family Code compliance** | Child support calculations, possession schedules, and statutory deadlines must conform to current Texas Family Code provisions |
| **Confidentiality requirements** | All client data is attorney-client privileged; the platform must enforce access controls that prevent unauthorized disclosure |
| **No legacy system dependencies** | The platform is built greenfield; no integration with existing firm software is required in v1 |

---

## 8. Delivery Model: 8-Phase Approach

| Phase | Name | Focus |
|-------|------|-------|
| 1 | Program Initialization | Repository skeleton, charter documents, risk register, assumptions, source-of-truth index |
| 2 | Domain and Architecture Finalization | Domain glossary, ERD, state machines, module boundaries, architecture decision records |
| 3 | Design System and UX Blueprint | Design tokens, component library spec, navigation model, screen specifications |
| 4 | Platform Foundation Build | Auth/RBAC, database migrations, app shell, API scaffolding, audit infrastructure |
| 5 | Core Workflow Implementation | Intake, conflict check, matter management, checklist engine, calendar, contacts |
| 6 | Legal Operations Modules | Document automation, filing packets, discovery, client portal, orders, financial support |
| 7 | Hardening and Enterprise QA | Regression suite, performance testing, accessibility, security audit, seed data |
| 8 | Release Packaging | Deployment guide, environment configuration, backup/recovery, production readiness, handoff |

Each phase has defined exit criteria documented in the Delivery Plan. No phase begins until the prior phase exit criteria are met and reviewed.

---

## 9. Governing Principles

1. **Attorney authority is inviolable.** The platform never bypasses, automates away, or weakens the attorney's decision-making role at legally significant points.

2. **Audit everything.** If it matters legally, it is logged immutably. There is no "off the record" action in this system.

3. **Harris County first.** While the architecture should be generalizable, every default, template, and workflow is built for Harris County family law practice as the primary target.

4. **Paralegal empowerment, not replacement.** The platform makes paralegals faster and more accurate. It does not reduce their role to button-clicking.

5. **Security by design.** Client confidentiality is not a feature added later. It is a structural property of the platform from the schema layer up.

6. **Progressive delivery.** Each phase produces usable artifacts. The platform does not require all 8 phases to deliver value — each phase builds on the last and can be demonstrated independently.

---

## 10. Document References

| Document | Purpose |
|----------|---------|
| `TEAM_CHARTER.md` | Agent roles, responsibilities, and communication rules |
| `DELIVERY_PLAN.md` | 8-phase delivery plan with outputs and exit criteria |
| `RISKS.md` | Risk register with mitigation strategies |
| `ASSUMPTIONS.md` | Assumptions register with validation criteria |

---

*End of Project Charter*
