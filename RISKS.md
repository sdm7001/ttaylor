# Risk Register: Ttaylor Family Law Paralegal Operations Platform

**Document ID:** TTAYLOR-RISK-001
**Version:** 1.0
**Date:** 2026-04-20
**Status:** Active — reviewed at every phase gate

---

## Risk Rating Key

| Rating | Likelihood | Impact |
|--------|-----------|--------|
| **H** (High) | >60% probability | Blocks delivery or causes significant rework |
| **M** (Medium) | 30-60% probability | Causes delays or partial rework |
| **L** (Low) | <30% probability | Minor inconvenience, easily absorbed |

---

## Risk Register

### RISK-001: Legal Workflow Complexity Exceeds Initial Estimates

**Description:** Family law practice areas contain edge cases, exceptions, and jurisdiction-specific rules that are not captured in initial requirements gathering. State machine definitions may prove incomplete as implementation reveals workflows that diverge from the "standard" path (e.g., contested vs. uncontested divorce have dramatically different paths; CPS involvement in SAPCR cases adds entire branches).

**Likelihood:** H
**Impact:** H

**Mitigation Strategy:**
- BA conducts deep-dive sessions per practice area before Phase 2 closes, documenting not just the happy path but known exception paths
- State machines are designed with explicit "exception" transition states rather than assuming linear progression
- Phase 5 and 6 include BA review checkpoints where implemented workflows are validated against real-world scenarios
- Architecture supports workflow versioning so state machines can be updated without data migration

**Owner:** Business Analyst

---

### RISK-002: Harris County Filing Rule Changes

**Description:** Harris County District Clerk filing requirements, local standing orders, or local rules may change during the project or between delivery and deployment. Filing packet validation rules that were correct at design time may become incorrect.

**Likelihood:** M
**Impact:** H

**Mitigation Strategy:**
- Harris County filing rules are documented with source citations and effective dates in `docs/domain/HARRIS_COUNTY_FILING_RULES.md`
- Filing packet validation rules are data-driven (configurable) rather than hardcoded, allowing updates without code changes
- BA monitors Harris County local rules page for updates during the project
- Filing packet model includes a version/effective-date field so rule changes can be tracked

**Owner:** Business Analyst + Document Automation Lead

---

### RISK-003: Attorney Approval Bottleneck

**Description:** If attorneys are slow to review and approve filing packets, documents, or other legally significant actions, the system's workflow can stall. Heavy approval queues create a perceived usability problem ("the system is slow") that is actually a human process problem.

**Likelihood:** H
**Impact:** M

**Mitigation Strategy:**
- Attorney approval dashboard prominently surfaces pending approvals with age indicators
- Notification system sends reminders for aging approval items
- Design allows attorneys to approve from a summary view without navigating into each document separately
- Batch approval is supported where legally appropriate (e.g., approving multiple routine discovery responses at once)
- Reporting module tracks approval turnaround time to make bottlenecks visible

**Owner:** Design Director + Backend Lead

---

### RISK-004: Data Migration from Existing Systems

**Description:** The firm may have matter data, documents, contacts, and calendar entries in existing systems (spreadsheets, Word documents, email, other software) that they expect to migrate into the new platform. Unplanned migration work can consume significant time and introduce data quality issues.

**Likelihood:** M
**Impact:** H

**Mitigation Strategy:**
- v1 scope explicitly excludes legacy data migration (documented in PROJECT_CHARTER.md and ASSUMPTIONS.md)
- If migration is requested, it is handled as a separate workstream with its own timeline and risk assessment
- Import utilities are designed for seed data loading in Phase 7, which provides a foundation for future migration tooling
- Manual data entry guides are included in user documentation for firms transitioning without automated migration

**Owner:** PM

---

### RISK-005: Scope Creep into Billing and Time Tracking

**Description:** Stakeholders may request billing, invoicing, or time tracking features during development because these are adjacent to matter management. Absorbing these requests without scope change management would significantly expand the project.

**Likelihood:** H
**Impact:** M

**Mitigation Strategy:**
- Billing and time tracking are explicitly listed as out of scope in the Project Charter
- PM maintains a "deferred features" backlog for requests that fall outside v1 scope
- Architecture design in Phase 2 ensures the matter model can support future billing integration without refactoring core tables
- Scope change requests follow a documented process: impact assessment, timeline impact, and explicit approval before acceptance

**Owner:** PM

---

### RISK-006: Security Incident Involving Confidential Client Data

**Description:** Attorney-client privileged data is the most sensitive category of information the platform handles. A security breach — whether through authentication bypass, authorization flaw, file access vulnerability, or injection attack — would be catastrophic for the firm and its clients.

**Likelihood:** L
**Impact:** H

**Mitigation Strategy:**
- Security Lead is involved from Phase 2 (architecture) through Phase 8 (release), not added late
- RBAC is enforced at three layers: API middleware, service logic, and database row-level policies
- Client portal uses a separate authentication system from staff app with independent credential stores
- All file access goes through an authorization check — no direct file URL access
- Security audit in Phase 7 includes injection testing, authorization bypass testing, and session handling review
- Data-at-rest encryption for the database and document storage
- Audit log captures all access events for forensic review

**Owner:** Security Lead

---

### RISK-007: Client Portal Authentication Complexity

**Description:** Building a secure, user-friendly authentication system for clients (who are not tech professionals) is harder than staff authentication. Clients forget passwords, share devices, and may not understand MFA. A portal that is too hard to use will not be adopted; a portal that is too easy to access will not be secure.

**Likelihood:** M
**Impact:** M

**Mitigation Strategy:**
- Client portal authentication design is a standalone workstream in Phase 4 with dedicated Security Lead review
- MFA uses email-based codes (clients already have email) rather than requiring authenticator apps
- Password reset flow is designed with security questions and identity verification appropriate for legal clients
- Session duration is balanced: long enough to be usable, short enough to limit exposure on shared devices
- Design Director designs the auth flows with non-technical users in mind, including clear error messages and help text

**Owner:** Security Lead + Design Director

---

### RISK-008: Document Template Versioning Drift

**Description:** Legal document templates change over time (updated court forms, revised standing orders, new statutory requirements). If template versioning is not handled correctly, the platform may generate documents using outdated templates, or previously generated documents may become unfindable when the template they were generated from is updated.

**Likelihood:** M
**Impact:** H

**Mitigation Strategy:**
- Document template system includes explicit versioning: every template has a version number and effective date
- Generated documents record the template ID and version used at generation time
- Template updates create new versions rather than modifying existing versions (append-only template history)
- Template retirement workflow marks old versions as inactive without deleting them
- Generated document retrieval always works regardless of current template version

**Owner:** Document Automation Lead

---

### RISK-009: Third-Party E-Filing API Availability and Stability

**Description:** Although direct e-filing API integration is deferred to v2, the platform's filing packet structure must be compatible with eventual integration. If the Texas eFiling API (eFileTexas.gov / Tyler Technologies) changes its specifications or access requirements, v2 integration work may require significant rework of the filing packet model.

**Likelihood:** L
**Impact:** M

**Mitigation Strategy:**
- Phase 2 architecture work includes review of current Texas eFiling API documentation to inform filing packet model design
- Filing packet model is designed to be API-compatible even though v1 uses manual upload
- Document naming conventions and metadata fields align with eFiling system requirements
- Architecture allows the filing workflow to plug in an API submission step without restructuring the approval flow

**Owner:** Architect + Document Automation Lead

---

### RISK-010: Staff Training and Adoption Resistance

**Description:** Paralegals and legal assistants who are accustomed to their current workflows (even if those workflows are manual and inefficient) may resist adopting a new platform. Poor adoption means the platform delivers no value regardless of its technical quality.

**Likelihood:** M
**Impact:** H

**Mitigation Strategy:**
- Phase 7 produces seed data that creates a realistic demo environment for training
- Phase 8 includes a demo script that walks through common workflows
- User documentation is written for legal staff, not developers — using legal terminology and task-oriented organization
- UI design prioritizes familiarity: standard patterns (tables, forms, dashboards) rather than novel interactions
- Checklist engine mirrors how paralegals already think about tasks, reducing the conceptual gap

**Owner:** PM + Design Director

---

### RISK-011: Performance Degradation Under Large Matter Volumes

**Description:** A busy family law practice may accumulate thousands of matters over time. Conflict checking (which cross-references against all matters), calendar views (which aggregate across matters), and reporting queries may degrade as data volume grows.

**Likelihood:** M
**Impact:** M

**Mitigation Strategy:**
- DBA designs indexes specifically for conflict check queries, calendar range queries, and reporting aggregations
- Phase 7 performance testing uses realistic data volumes (500+ active matters, 5,000+ total matters, 50+ concurrent users)
- Conflict check engine uses optimized search (indexed party names and identifiers) rather than full table scans
- Calendar queries use date-range-bounded queries with appropriate indexes
- Architecture supports read replicas if query load outgrows single-database performance

**Owner:** DBA + Backend Lead

---

### RISK-012: QA Coverage Gaps in Legal Logic

**Description:** Standard test coverage metrics (line coverage, branch coverage) may miss the most important category of bugs: incorrect legal logic. A function can have 100% code coverage while still calculating child support incorrectly or missing a statutory deadline.

**Likelihood:** M
**Impact:** H

**Mitigation Strategy:**
- BA provides scenario-based test cases for every legal calculation and deadline rule, not just edge-case-free happy paths
- QA builds test cases from the Texas Family Code sections that define each calculation (e.g., child support guidelines in TFC Chapter 154)
- Conflict detection test suite includes adversarial cases: similar names, partial matches, maiden/married name variations
- Filing packet validation tests are built from Harris County filing requirement checklists
- Phase 7 hardening specifically targets legal logic verification as a distinct test category beyond standard coverage

**Owner:** QA + BA

---

### RISK-013: Calendar and Deadline Calculation Errors

**Description:** Statutory deadlines in Texas family law involve business-day calculations, holiday exclusions, and rules that differ based on service method (e.g., service by publication extends response deadlines). An incorrect deadline calculation could cause a client to miss a filing window, with potentially severe legal consequences.

**Likelihood:** L
**Impact:** H

**Mitigation Strategy:**
- Deadline calculation logic is isolated into a dedicated service with comprehensive unit tests
- BA documents every deadline rule with Texas Rules of Civil Procedure citation
- Test suite includes edge cases: deadlines falling on weekends, holidays, year-end transitions
- All calculated deadlines show their basis (rule reference and calculation inputs) in the UI so staff can verify
- Calendar module displays a warning when a deadline is within 5 business days and the associated task is incomplete

**Owner:** Backend Lead + BA

---

### RISK-014: Cross-Module Integration Failures

**Description:** With 15 modules that share data (a matter links to contacts, documents, deadlines, checklists, and financials), integration points are numerous. Bugs at module boundaries — where one module's output becomes another's input — are harder to detect than bugs within a single module.

**Likelihood:** M
**Impact:** M

**Mitigation Strategy:**
- Architect defines explicit API contracts between modules in Phase 2 — no module reads another module's database tables directly
- Integration tests in Phase 5 and 6 specifically test cross-module workflows end-to-end
- QA maintains a cross-module test matrix identifying every integration point and its test coverage
- CI pipeline runs integration tests on every merge, not just unit tests

**Owner:** Architect + QA

---

## Review Schedule

This risk register is reviewed and updated at every phase gate review. New risks identified during development are added immediately rather than waiting for the next scheduled review.

---

*End of Risk Register*
