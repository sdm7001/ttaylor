# Assumptions Register: Ttaylor Family Law Paralegal Operations Platform

**Document ID:** TTAYLOR-ASSUME-001
**Version:** 1.0
**Date:** 2026-04-20
**Status:** Active — reviewed at every phase gate

---

## How to Read This Register

Each assumption is a statement the project treats as true for planning and design purposes. If an assumption proves false, the **impact** column describes what changes. The **validation** column describes how and when the assumption will be confirmed.

---

## Assumptions

### ASSUME-001: Attorneys Are Primary Approvers for All Filing Packets

**Statement:** Only users with the Attorney role may approve filing packets for submission to the court. No paralegal, legal assistant, or automated process may approve a filing.

**Confidence:** High
**Impact if false:** RBAC model must be redesigned to support delegated approval authority. Filing workflow state machine gains additional approval paths.
**Validation:** Confirmed during BA requirements sessions with firm stakeholders. Codified in the attorney approval gate inventory (Phase 2).
**Owner:** BA

---

### ASSUME-002: Harris County E-Filing Uses Standard Texas eFiling System

**Statement:** Harris County family law filings are submitted through eFileTexas.gov (Tyler Technologies), which is the statewide standard. No Harris County-specific e-filing portal or alternative system is required.

**Confidence:** High
**Impact if false:** Filing packet model may need to accommodate a different submission system's requirements. Document naming and metadata conventions may differ.
**Validation:** Verified against Harris County District Clerk website and eFileTexas.gov service provider list.
**Owner:** BA

---

### ASSUME-003: All Staff Users Will Have MFA Enabled

**Statement:** Multi-factor authentication is mandatory for all staff accounts (attorneys, paralegals, legal assistants, administrators). There is no "MFA optional" mode.

**Confidence:** High
**Impact if false:** Auth system needs conditional MFA policies, adding complexity to the RBAC and session management layers.
**Validation:** Documented as a security requirement. Enforced in the auth implementation (Phase 4).
**Owner:** Security Lead

---

### ASSUME-004: Client Portal Is Web-Only (No Native Mobile App)

**Statement:** The client portal is a responsive web application accessed through a browser. No iOS or Android native application is in scope for v1.

**Confidence:** High
**Impact if false:** Adds native app development workstreams for two platforms, significantly expanding scope, team requirements, and timeline.
**Validation:** Confirmed in project scope definition. Responsive web design serves mobile access needs for v1.
**Owner:** PM

---

### ASSUME-005: English-Only Interface for v1

**Statement:** All user interfaces, document templates, help text, error messages, and user documentation are in English only. No internationalization or localization framework is required.

**Confidence:** High
**Impact if false:** Requires i18n framework implementation across frontend and backend, translation of all user-facing strings, and locale-aware formatting for dates and numbers.
**Validation:** Confirmed with firm stakeholders. Houston's multilingual population may drive future localization, but v1 is English-only.
**Owner:** PM

---

### ASSUME-006: PostgreSQL as the Primary Database

**Statement:** The platform uses PostgreSQL as its primary relational database, either self-hosted or as a managed cloud service (e.g., AWS RDS, Azure Database for PostgreSQL, DigitalOcean Managed Databases).

**Confidence:** High
**Impact if false:** Schema design, migration tooling, query patterns, and index strategies would need adaptation to the alternative database engine. Audit log immutability approach may differ.
**Validation:** Documented in technology stack ADR (Phase 2). PostgreSQL selected for its maturity, JSON support, row-level security capabilities, and ecosystem.
**Owner:** Architect + DBA

---

### ASSUME-007: No Legacy Data Migration in v1 Scope

**Statement:** The platform launches with empty data (plus seed data for testing/demo). Migration of existing matter data from prior systems (spreadsheets, Word documents, other software) is not in scope for v1.

**Confidence:** Medium
**Impact if false:** Adds a data migration workstream requiring: source system analysis, mapping, ETL development, data validation, and reconciliation. Likely adds several weeks to timeline.
**Validation:** Confirmed in project scope. If firm requests migration during development, it is handled as a scope change with separate estimation.
**Owner:** PM

---

### ASSUME-008: Document Templates Built by Project Team

**Statement:** All document templates (petitions, orders, discovery forms, filing cover sheets) are created by the project team during Phase 6 based on BA specifications. Templates are not imported from an existing template library or third-party system.

**Confidence:** High
**Impact if false:** Requires template import/conversion tooling and compatibility testing with external template formats (e.g., HotDocs, Pathagoras).
**Validation:** Confirmed in scope. BA provides template content requirements; Document Automation Lead builds templates in the platform's native format.
**Owner:** Document Automation Lead

---

### ASSUME-009: Separate Client Authentication from Staff Authentication

**Statement:** Client portal users and staff users authenticate through separate systems with independent credential stores. A client credential cannot access the staff application and vice versa.

**Confidence:** High
**Impact if false:** Shared auth system increases the attack surface — a client account compromise could potentially escalate to staff access. Security architecture must be redesigned.
**Validation:** Documented as a security architecture requirement. Implemented in Phase 4.
**Owner:** Security Lead

---

### ASSUME-010: Firm Uses Email for Client Communication

**Statement:** The primary communication channel between the firm and clients is email. The client portal's messaging feature supplements but does not replace email communication. No SMS, phone integration, or chat system is required.

**Confidence:** Medium
**Impact if false:** If SMS or other channels are expected, the notification system needs multi-channel delivery, and the messaging module needs to track conversations across channels.
**Validation:** Confirmed during BA requirements gathering. Client portal messages are a secure alternative to email for sensitive document exchange.
**Owner:** BA

---

### ASSUME-011: Cause Numbers Assigned by Court, Not Generated by Platform

**Statement:** Cause numbers (case numbers) are assigned by the Harris County District Clerk when a case is filed. The platform stores and references cause numbers but does not generate them. New matters created before filing have a platform-generated internal reference number.

**Confidence:** High
**Impact if false:** If the platform were expected to predict or generate cause numbers, it would need integration with court assignment systems, which is not feasible.
**Validation:** Standard Texas court procedure. Cause numbers are entered into the platform after the clerk assigns them upon filing.
**Owner:** BA

---

### ASSUME-012: Single Office / Single Jurisdiction

**Statement:** The platform is designed for a single firm office operating in Harris County, Texas. Multi-office, multi-jurisdiction, and multi-state support are not in scope for v1.

**Confidence:** High
**Impact if false:** Multi-jurisdiction support requires configurable filing rules, jurisdiction-specific templates, and potentially different deadline calculation rules. Significantly increases scope.
**Validation:** Confirmed in project charter. Harris County is the sole jurisdiction for v1.
**Owner:** PM

---

### ASSUME-013: Standard Business Hours for Deadline Calculations

**Statement:** Business day calculations for statutory deadlines use the standard Texas court calendar: Monday through Friday, excluding state holidays and federal holidays observed by Texas courts. No firm-specific holiday overrides are needed.

**Confidence:** High
**Impact if false:** If the firm observes additional closures or Harris County courts have non-standard schedules, the holiday calendar needs to be configurable.
**Validation:** Texas Government Code defines court holidays. Deadline calculation service uses a maintained holiday list that can be updated annually.
**Owner:** Backend Lead + BA

---

### ASSUME-014: Modern Browser Support Only

**Statement:** The platform targets modern evergreen browsers: Chrome, Firefox, Safari, and Edge (latest two major versions). Internet Explorer is not supported. No browser-specific workarounds for legacy browsers are in scope.

**Confidence:** High
**Impact if false:** Legacy browser support would require polyfills, progressive enhancement strategies, and expanded QA testing across browser versions.
**Validation:** Standard for new web application development. Documented in frontend technical specifications.
**Owner:** Frontend Lead

---

### ASSUME-015: File Storage Uses Object Storage with Encryption

**Statement:** Uploaded documents and generated files are stored in an object storage system (e.g., S3-compatible storage) with server-side encryption at rest. Files are not stored in the database or on local filesystem.

**Confidence:** High
**Impact if false:** Alternative storage strategies (database BLOB, NFS) have different performance, backup, and access control characteristics that would affect the file storage service design.
**Validation:** Documented in technology stack ADR (Phase 2).
**Owner:** Architect

---

### ASSUME-016: No Real-Time Collaboration on Documents

**Statement:** The platform does not support simultaneous multi-user editing of documents (like Google Docs). Document editing is single-user: one person generates or uploads a document, others view or download it.

**Confidence:** High
**Impact if false:** Real-time collaboration requires operational transform or CRDT infrastructure, WebSocket connections, conflict resolution, and a fundamentally different document editing architecture.
**Validation:** Family law document workflows are sequential (paralegal drafts, attorney reviews) rather than collaborative. Single-user editing matches the actual workflow.
**Owner:** Architect

---

### ASSUME-017: Firm Has Fewer Than 50 Staff Users

**Statement:** The platform is designed for a small-to-midsize firm with fewer than 50 staff user accounts. User management does not require LDAP/Active Directory integration, SCIM provisioning, or enterprise SSO in v1.

**Confidence:** High
**Impact if false:** Enterprise identity management adds integration complexity with external IdPs, SAML/OIDC configuration, and potentially different session management approaches.
**Validation:** Confirmed with firm profile. Manual user management (admin creates accounts) is sufficient for v1.
**Owner:** Security Lead

---

### ASSUME-018: Texas Family Code Remains Stable During Development

**Statement:** The relevant provisions of the Texas Family Code (child support guidelines in Chapter 154, conservatorship in Chapter 153, divorce in Chapter 6) will not undergo significant legislative revision during the development period.

**Confidence:** Medium
**Impact if false:** Legislative changes to support calculation formulas, custody presumptions, or filing requirements would require recalculation logic updates, template revisions, and additional QA cycles.
**Validation:** Texas Legislature meets biennially (odd years). Monitor legislative session activity if development overlaps with a session. BA tracks relevant bills.
**Owner:** BA

---

## Review Schedule

This assumptions register is reviewed at every phase gate. Assumptions that prove false are documented with their actual status and the resulting project impact.

---

*End of Assumptions Register*
