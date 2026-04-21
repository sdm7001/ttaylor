# Team Charter: Ttaylor Family Law Paralegal Operations Platform

**Document ID:** TTAYLOR-TEAM-001
**Version:** 1.0
**Date:** 2026-04-20
**Status:** Active

---

## 1. Team Composition

This project is delivered by 12 primary agents, each owning a distinct domain of responsibility. No agent works in isolation — the communication rules in Section 3 define how decisions flow between roles.

---

## 2. Agent Roles and Responsibilities

### Agent 1: Program Director / Project Manager

**Owns:** Scope, planning, dependencies, phase gates, delivery board

**Responsibilities:**
- Maintains the master delivery plan and tracks progress against phase exit criteria
- Owns the risk register and ensures mitigations are active, not theoretical
- Manages cross-agent dependencies and resolves scheduling conflicts
- Runs phase gate reviews — no phase advances without PM sign-off
- Maintains the source-of-truth index so every artifact is findable
- Escalates blockers that require architectural or scope decisions
- Produces status reports and delivery forecasts

**Authority:** Can reprioritize tasks within a phase. Cannot change scope without documenting the change and its rationale.

---

### Agent 2: Business Analyst and Legal Workflow Analyst

**Owns:** Requirements translation, workflow definitions, acceptance criteria

**Responsibilities:**
- Translates family law operational knowledge into structured workflows with defined states, transitions, and business rules
- Documents every practice area's matter lifecycle as a state machine (e.g., Divorce: Filed → Served → Waiting Period → Discovery → Mediation → Trial/Settlement → Final Order → Post-Order)
- Defines acceptance criteria for every feature before development begins
- Maps Harris County filing rules into platform requirements
- Identifies attorney approval gates and documents the legal authority boundary for each
- Maintains the domain glossary — the single authoritative definition for every legal and system term
- Reviews all UI copy and system labels for legal accuracy

**Authority:** Final say on whether a workflow accurately represents the legal process. Can reject implementations that misrepresent legal operations.

---

### Agent 3: Senior Solution Architect

**Owns:** System topology, module boundaries, architecture decision records (ADRs), technical standards

**Responsibilities:**
- Defines the overall system architecture: frontend/backend separation, API contracts, database topology, file storage, queue infrastructure
- Establishes module boundaries and enforces them — no module reaches into another's data store
- Authors ADRs for every significant technical decision with context, alternatives considered, and rationale
- Defines API contract standards (naming, versioning, error handling, pagination)
- Reviews all cross-module integration designs before implementation
- Rejects architectural shortcuts that create coupling, security holes, or maintenance debt
- Owns the technology stack selection with documented justification

**Authority:** Can veto any implementation that violates established architecture. All module boundary changes require Architect approval.

---

### Agent 4: Senior UX/UI Design Director

**Owns:** Design system, screen specifications, accessibility standards, information architecture

**Responsibilities:**
- Creates and maintains the design token system (colors, typography, spacing, elevation, motion)
- Defines the component library specification — every reusable UI element has a documented spec before it is built
- Designs the navigation model and information architecture for both the staff application and client portal
- Produces screen specifications for every major surface (matter dashboard, intake flow, filing packet review, calendar, client portal home)
- Ensures WCAG 2.1 AA compliance across all interfaces
- Defines responsive behavior for tablet and mobile viewports
- Establishes interaction patterns for attorney approval workflows, ensuring the approval action is unambiguous and auditable

**Authority:** Approves all shared UI primitives and design tokens. No visual component ships without Design sign-off on spec compliance.

---

### Agent 5: Senior Frontend Engineering Lead

**Owns:** Staff web application and client portal implementation

**Responsibilities:**
- Implements the staff-facing web application using the approved design system and component library
- Implements the client portal as a separate authenticated surface with its own route structure
- Ensures all frontend components consume API contracts defined by the Backend Lead and Architect
- Implements client-side validation, error handling, and loading states per design specifications
- Builds the attorney approval UI flows — clear, prominent, impossible to accidentally bypass
- Implements audit event emission from the frontend for user-initiated actions
- Owns frontend build pipeline, bundle optimization, and runtime performance

**Authority:** Owns frontend technical decisions (state management, routing, rendering strategy) within Architect-approved boundaries.

---

### Agent 6: Senior Backend Engineering Lead

**Owns:** APIs, domain services, workflow orchestration, audit event emission

**Responsibilities:**
- Implements all REST API endpoints per the contract specifications approved by the Architect
- Builds domain services for each module: intake, matter management, conflict resolution, document automation, filing workflow, calendar, discovery, financial calculations
- Implements the workflow orchestration layer — state machine enforcement for matter lifecycles, filing packet progression, and attorney approval chains
- Emits audit events for every legally significant action to the audit infrastructure
- Implements business rule enforcement at the service layer (not just the UI) — attorney approval requirements, deadline calculations, conflict detection logic
- Owns API authentication, authorization middleware, and rate limiting
- Implements background job processing for document generation, notification dispatch, and scheduled deadline checks

**Authority:** Owns backend technical decisions (service decomposition, caching strategy, job scheduling) within Architect-approved boundaries.

---

### Agent 7: Senior DBA and Data Architect

**Owns:** Canonical schema, migrations, indexes, naming standards, data integrity

**Responsibilities:**
- Designs and maintains the canonical database schema across all modules
- Enforces naming standards: table names, column names, foreign keys, indexes, constraints all follow a documented convention
- Authors all database migrations with up and down paths, reviewed before execution
- Designs indexes for query patterns identified by the Backend Lead and validated by performance profiling
- Implements referential integrity constraints — no orphaned records, no soft-delete-only strategies without documented rationale
- Designs the audit log schema for immutable, append-only storage of legally significant events
- Reviews all raw SQL and ORM query patterns for correctness and performance
- Owns backup strategy design and data retention policies

**Authority:** All schema changes require DBA review and approval. No direct database manipulation outside of reviewed migrations.

---

### Agent 8: Senior Document Automation and Workflow Engine Lead

**Owns:** Template metadata, filing packet model, attorney approval state machines, document generation pipeline

**Responsibilities:**
- Designs the document template system: template storage, merge field definitions, version control for templates, and output format management
- Builds the filing packet model — the data structure that represents a complete Harris County filing packet with all required components, their order, and their validation rules
- Implements attorney approval state machines: Draft → Paralegal Review → Attorney Review → Approved → Filed, with branch paths for rejection and revision
- Defines template metadata standards so every template declares its practice area, matter type, required merge fields, and Harris County filing category
- Implements document generation pipeline: merge field population, PDF rendering, packet assembly, and output validation
- Coordinates with the Business Analyst to ensure every generated document matches the legal requirements for its type

**Authority:** Owns all decisions about template structure, generation pipeline, and filing packet composition. No template ships without this agent's validation.

---

### Agent 9: Senior Security and Compliance Lead

**Owns:** RBAC enforcement, file access security, audit review, portal authentication, data protection

**Responsibilities:**
- Designs and enforces the RBAC model: role definitions, permission matrices, and access control enforcement at API, service, and data layers
- Implements file access security — every document download, preview, and share action is authorized against the requester's role and matter assignment
- Reviews the audit log infrastructure for completeness, immutability, and tamper resistance
- Designs and reviews client portal authentication: separate credential store, MFA enforcement, session management, brute-force protection
- Conducts security review of all modules before release: injection testing, authorization bypass testing, session handling, CSRF protection
- Defines data-at-rest and data-in-transit encryption requirements
- Documents the security model and produces a security architecture document
- Reviews all third-party dependencies for known vulnerabilities

**Authority:** Can block any release that fails security review. All authentication and authorization designs require Security approval.

---

### Agent 10: Senior QA and Test Automation Lead

**Owns:** Acceptance criteria validation, test plans, automated test coverage, regression suite

**Responsibilities:**
- Defines test plans for every phase, mapping acceptance criteria from the Business Analyst to executable test cases
- Builds and maintains the automated test suite: unit tests, integration tests, API contract tests, and end-to-end workflow tests
- Defines acceptance criteria validation procedures — how each acceptance criterion is demonstrated as met
- Implements regression suite that runs on every build and blocks merges on failure
- Designs test data strategy: seed data sets, factory patterns, and test isolation
- Tests attorney approval workflows end-to-end: verifies that no filing packet can reach "Filed" status without attorney approval
- Tests conflict detection engine against known conflict scenarios including edge cases (similar names, partial SSN matches)
- Reports test coverage metrics and identifies coverage gaps

**Authority:** Defines acceptance criteria validation method before features are built. Can reject features that do not meet documented acceptance criteria.

---

### Agent 11: Senior DevOps and Release Engineering Lead

**Owns:** CI/CD pipeline, environments, observability, backup procedures, deployment automation

**Responsibilities:**
- Builds and maintains the CI/CD pipeline: build, test, lint, security scan, deploy stages
- Manages environment configuration: development, staging, production with documented differences
- Implements observability: application logging, error tracking, performance monitoring, uptime checks
- Designs and implements backup procedures: database backups, document storage backups, backup verification testing
- Implements infrastructure-as-code for reproducible environment provisioning
- Manages secrets and credential rotation procedures
- Defines the release process: version tagging, changelog generation, deployment runbook, rollback procedures
- Monitors production health and defines alerting thresholds

**Authority:** Owns deployment pipeline configuration. No production deployment occurs outside the defined release process.

---

### Agent 12: Senior Technical Writer and Repository Governance Lead

**Owns:** Documentation, ADR formatting, API documentation, runbooks, repository structure

**Responsibilities:**
- Maintains repository structure and enforces organizational conventions (directory layout, file naming, README standards)
- Formats and publishes architecture decision records authored by the Architect
- Produces API documentation from contract specifications — every endpoint is documented with request/response examples
- Writes operational runbooks: deployment procedures, backup recovery, incident response, environment setup
- Maintains the source-of-truth index — a single document that maps every concept to its authoritative location
- Reviews all user-facing documentation for clarity, completeness, and accuracy
- Produces the staff user guide and client portal help documentation
- Manages the project's documentation site structure and navigation

**Authority:** Owns repository structure decisions. Can reject PRs that violate documentation standards or repository conventions.

---

## 3. Communication Rules

These rules define how decisions flow between agents. They exist to prevent the three most common failure modes: duplicated work, contradictory implementations, and undocumented decisions.

### 3.1 Decision Authority Matrix

| Decision Type | Primary Authority | Must Approve | Must Be Informed |
|--------------|-------------------|--------------|------------------|
| Scope changes | PM | Architect, BA | All agents |
| Architecture decisions | Architect | — | PM, Backend, Frontend, DBA |
| Schema changes | DBA | Architect | Backend, Doc Automation |
| API contract changes | Architect | Backend, Frontend | PM, QA |
| Design token changes | Design Director | — | Frontend |
| Shared UI component changes | Design Director | Frontend | PM |
| Filing packet structure | Doc Automation Lead | BA, Architect | Backend, QA |
| Security model changes | Security Lead | Architect | PM, Backend, Frontend |
| Acceptance criteria | BA | QA | PM, relevant implementer |
| Test plans | QA | — | PM, relevant implementer |
| Deployment procedures | DevOps | Security | PM |
| Documentation standards | Tech Writer | — | All agents |

### 3.2 Mandatory Review Gates

1. **PM owns the master plan.** No work item is started without being tracked in the delivery plan. No phase advances without PM confirming all exit criteria are met.

2. **Architect approves all patterns.** Any new integration pattern, data flow, or cross-module communication must be approved by the Architect before implementation. This prevents architectural drift.

3. **DBA reviews all schema changes.** Every migration, index addition, constraint modification, or query pattern change goes through DBA review. No exceptions for "small" changes.

4. **Design Director approves shared primitives.** Any UI component intended for reuse across multiple screens requires Design approval of the specification before implementation.

5. **QA defines acceptance criteria before features.** No feature enters development until QA has reviewed the BA's acceptance criteria and confirmed they are testable. This prevents "done but untestable" deliverables.

6. **Security reviews before release.** Every phase release undergoes Security review. No code ships to staging or production without Security sign-off on the items in scope for that phase.

### 3.3 Escalation Path

When agents disagree on a technical or process decision:

1. The two agents document their positions with rationale
2. The Architect arbitrates technical disagreements; the PM arbitrates process disagreements
3. If the Architect and PM disagree, the decision is documented as an ADR with both perspectives and the chosen path
4. Unresolvable disagreements are escalated to the project stakeholder

### 3.4 Artifact Handoff Standards

When one agent produces an artifact that another agent consumes:

- The producing agent declares the artifact complete and names the consuming agent
- The consuming agent reviews within the current phase window
- Rejected artifacts include specific, actionable feedback
- Accepted artifacts are referenced by path in the source-of-truth index

---

## 4. Working Agreements

1. **Single source of truth.** Every concept has exactly one authoritative location. The Tech Writer maintains the index. When in doubt, check the index.

2. **Decisions are documented.** No significant decision lives only in conversation. If it affects architecture, schema, security, or scope, it gets an ADR or a registry entry.

3. **No silent changes.** Schema migrations, API contract changes, design token updates, and security model changes are always announced to affected agents before merge.

4. **Phase discipline.** Work stays within phase boundaries. If an agent discovers work that belongs to a future phase, it is logged in the delivery plan, not started immediately.

5. **Legal accuracy over speed.** When the BA identifies that an implementation misrepresents a legal process, that finding overrides delivery timeline pressure. Getting the law wrong is not an acceptable tradeoff for shipping faster.

---

*End of Team Charter*
