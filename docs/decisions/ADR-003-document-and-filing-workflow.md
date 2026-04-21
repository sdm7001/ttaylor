# ADR-003: Document Automation and Filing Packet Workflow

**Status:** Accepted
**Date:** 2026-04-21
**Deciders:** Architect, Document Lead
**Supersedes:** None

---

## Context

The Ttaylor Family Law Office generates, reviews, and files hundreds of legal documents each month across 14 workflow types (see WORKFLOW_CATALOG.md). Every document follows a lifecycle from initial generation through attorney approval to court filing. Harris County family law filings go through eFileTexas, the state's mandatory electronic filing system, which imposes specific structural requirements on filing submissions.

Key constraints:

1. **Attorney approval is a legal requirement, not a workflow preference.** Texas Disciplinary Rules require that an attorney review and approve every document before it is filed with the court. No paralegal, no matter how senior, may authorize a filing submission. The platform must enforce this as a hard gate.

2. **Filing packets are compound objects.** A single court filing is not one document -- it is an envelope containing a lead document (e.g., Original Petition for Divorce), zero or more attachments (exhibits, proposed orders, certificates of service), filing codes (eFileTexas category codes), service contacts (parties to be served electronically), and court metadata (cause number, court number, case category). The platform must model this packet structure as a first-class entity.

3. **Document versioning is mandatory.** Legal documents go through multiple drafts. A paralegal generates version 1, the attorney requests changes, the paralegal generates version 2, the attorney approves version 3. Every version must be preserved -- courts and bar complaints may require production of the entire revision history.

4. **Template-driven generation.** The firm uses standardized document templates for each practice area. A divorce petition template contains merge fields for petitioner name, respondent name, county of residence, grounds for divorce, and children's information. The platform must merge matter data into templates to produce first drafts, with the ability to manually edit the generated output.

5. **Harris County filing conventions.** Harris County District Clerk filings follow specific conventions for document naming, filing codes (mapped from Texas OCA codes), and party designation. The platform must produce filing packets that conform to these conventions without requiring staff to remember the mapping.

---

## Decision

### Document Lifecycle State Machine

Every document in the system follows a strict state machine:

```
                  +---------+
                  |  DRAFT  |
                  +----+----+
                       |
            paralegal submits for review
                       |
                       v
              +--------+--------+
              |  UNDER_REVIEW   |
              +--------+--------+
                       |
              +--------+--------+
              |                 |
     attorney approves    attorney requests changes
              |                 |
              v                 v
   +----------+------+    +----+----+
   | ATTORNEY_APPROVED|    |  DRAFT  |  (returns to draft with
   +----------+------+    +---------+   revision note attached)
              |
    included in filing packet
    and packet submitted
              |
       +------+------+
       |             |
   accepted      rejected by court
       |             |
       v             v
   +---+---+    +----+----+
   | FILED  |    | REJECTED |
   +-------+    +---------+
```

**State definitions:**

| State | Description | Who Can Transition |
|-------|-------------|-------------------|
| `DRAFT` | Document is being authored or revised. Editable by paralegals and attorneys. | Paralegal, Senior Paralegal, Attorney |
| `UNDER_REVIEW` | Submitted for attorney review. Read-only for non-attorneys. | Paralegal submits; Attorney reviews |
| `ATTORNEY_APPROVED` | Attorney has approved this version for filing. Immutable -- no further edits without creating a new version. | Attorney (requires `document:approve` permission AND `is_attorney` flag) |
| `FILED` | Document has been accepted by the court via eFileTexas. Archived and immutable. | System (set automatically on eFileTexas acceptance) |
| `REJECTED` | Court rejected the filing. Staff must review the rejection reason, create a corrected version, and re-enter the lifecycle. | System (set automatically on eFileTexas rejection) |

**Transition rules:**

- `DRAFT -> UNDER_REVIEW`: Requires the document to have content (non-empty body or attached file). The submitting user is recorded.
- `UNDER_REVIEW -> ATTORNEY_APPROVED`: Requires `document:approve` permission AND `users.is_attorney = true`. The approving attorney's user ID and timestamp are recorded on the document version.
- `UNDER_REVIEW -> DRAFT`: Attorney sends back with revision notes. A new `document_versions` record is created with the attorney's comments. The document status reverts to DRAFT.
- `ATTORNEY_APPROVED -> FILED`: Only the system may set this state, triggered by an eFileTexas acceptance callback or manual confirmation of court acceptance.
- `ATTORNEY_APPROVED -> REJECTED`: Only the system may set this state, triggered by an eFileTexas rejection callback or manual entry of court rejection.

### Filing Packet Lifecycle State Machine

Filing packets are the unit of submission to eFileTexas. A packet groups one or more approved documents into an envelope structure that maps to eFileTexas's submission format.

```
   +------------+
   | ASSEMBLING |  (paralegal adding documents to the packet)
   +-----+------+
         |
   all required documents attached + lead doc identified
         |
         v
   +-----+----------+
   | READY_FOR_REVIEW|  (packet is complete, awaiting attorney)
   +-----+----------+
         |
   attorney reviews packet contents
         |
    +----+----+
    |         |
  approves  sends back
    |         |
    v         v
+---+--------++   +-----+------+
|ATTY_APPROVED|   | ASSEMBLING |  (with revision notes)
+---+---------+   +------------+
    |
  submit to eFileTexas
    |
    v
+---+------+
| SUBMITTED|  (awaiting court response)
+---+------+
    |
  +--+--------+
  |           |
court accepts  court rejects
  |           |
  v           v
+-+------+ +--+------+
|ACCEPTED| |REJECTED |
+--------+ +---------+
```

**State definitions:**

| State | Description |
|-------|-------------|
| `ASSEMBLING` | Paralegal is building the packet: selecting lead document, attaching supporting documents, setting filing codes and service contacts. |
| `READY_FOR_REVIEW` | All required components are present. The packet is locked for editing and presented to an attorney for review. |
| `ATTORNEY_APPROVED` | Attorney has reviewed and approved the complete packet for submission. |
| `SUBMITTED` | Packet has been transmitted to eFileTexas. Awaiting acceptance or rejection from the court clerk. |
| `ACCEPTED` | Court clerk accepted the filing. Cause number and filing confirmation number are recorded. All documents in the packet transition to `FILED`. |
| `REJECTED` | Court clerk rejected the filing. Rejection reason is recorded. Staff must create a new packet or correct and resubmit. |

**Blocking gate:** A filing packet cannot transition from `READY_FOR_REVIEW` to `ATTORNEY_APPROVED` unless every document in the packet has `ATTORNEY_APPROVED` status. If any document is still `DRAFT` or `UNDER_REVIEW`, the packet approval is blocked and the UI shows which documents are not yet approved.

### Template Engine

Document generation uses **Handlebars** as the template engine.

**Template structure:**
- Templates are stored in the `document_templates` table with a `body` column containing Handlebars markup.
- Merge fields reference matter data using dot notation: `{{petitioner.full_name}}`, `{{respondent.address.street}}`, `{{matter.cause_number}}`, `{{children.[0].name}}`.
- Conditional sections use Handlebars block helpers: `{{#if has_children}}...{{/if}}`, `{{#each children}}...{{/each}}`.
- Templates are versioned. Editing a template creates a new `template_version` record. Documents record which template version was used for generation.

**Merge field resolution:**
When a document is generated, the system collects data from across modules:
- **Matter module**: matter type, status, cause number, court assignment
- **Contacts module**: all parties (petitioner, respondent, children, attorneys of record), resolved through `matter_contacts` with their role
- **Financial module**: support calculations, arrearages (for enforcement motions)
- **Calendar module**: hearing dates, deadlines

This data is assembled into a flat merge context object and passed to the Handlebars compiler.

### Document Versioning

Every mutation to a document's content creates a new `document_versions` record:

| Column | Purpose |
|--------|---------|
| `id` | Unique version identifier |
| `document_id` | Parent document |
| `version_number` | Sequential integer (1, 2, 3...) |
| `content` | Full document content at this version (stored as HTML or plain text) |
| `file_path` | S3 path to the generated PDF for this version |
| `file_hash` | SHA-256 hash of the PDF content for integrity verification |
| `change_summary` | Human-readable description of what changed |
| `created_by` | User who created this version |
| `created_at` | Timestamp of version creation |

The `documents` table's `current_version_id` points to the latest version. Previous versions are immutable and always accessible.

### Filing Packet Structure

A filing packet maps to an eFileTexas envelope:

```
Filing Packet (envelope)
  |
  +-- Lead Document (exactly one)
  |     |-- document_id -> documents table
  |     |-- filing_code (e.g., "OPD" for Original Petition for Divorce)
  |     |-- document_type_code (Harris County OCA code)
  |
  +-- Attachments (zero or more)
  |     |-- document_id -> documents table
  |     |-- filing_code
  |     |-- attachment_sequence (ordering within the packet)
  |
  +-- Service Contacts (parties to receive electronic service)
  |     |-- contact_id -> contacts table
  |     |-- service_type ("electronic" or "conventional")
  |     |-- email (for electronic service)
  |
  +-- Court Metadata
  |     |-- court_number (Harris County court, e.g., "309th")
  |     |-- cause_number (if existing case; null for new filings)
  |     |-- case_category_code (eFileTexas category)
  |     |-- case_type_code (eFileTexas type within category)
  |     |-- party_designations (petitioner/respondent mapping)
  |
  +-- Submission Record
        |-- submitted_at
        |-- submitted_by (user who clicked submit)
        |-- efiling_envelope_id (from eFileTexas response)
        |-- efiling_status
        |-- rejection_reason (if rejected)
        |-- accepted_at
        |-- court_filing_number (from acceptance response)
```

---

## Consequences

### Positive

1. **Attorney approval is architecturally enforced.** The state machine makes it impossible to submit a filing packet without attorney approval on both the individual documents and the assembled packet. This is not a UI check that can be bypassed -- the tRPC procedure physically cannot transition the state without the `document:approve` permission and the `is_attorney` flag.

2. **Complete audit trail.** Every state transition records who, when, and why. Document versions preserve the full history. The firm can produce a complete chain of custody for any filed document.

3. **Template reusability.** Once a divorce petition template is authored with proper merge fields, generating the next petition requires only selecting the template and the matter. First-draft generation takes seconds instead of the 30-60 minutes of manual drafting.

4. **Harris County alignment.** The filing packet structure directly maps to eFileTexas envelope structure, minimizing translation logic at submission time. Filing codes, case categories, and party designations are modeled as first-class fields.

5. **Version integrity.** SHA-256 hashing of generated PDFs provides tamper evidence. If a court or opposing counsel questions whether a filed document was altered, the hash chain proves integrity.

### Negative

1. **Template authoring complexity.** Handlebars templates with complex conditionals (e.g., different property division language based on whether community property exists) require staff or developer involvement to author. Mitigation: provide a template editor UI with merge field autocomplete and a preview mode that renders against sample data.

2. **Rigid state machine.** Edge cases may arise where the linear lifecycle does not fit (e.g., a court accepts a filing but requests a corrected order separately). Mitigation: the `REJECTED` state allows re-entry to the lifecycle. Truly exceptional cases can be handled by admin override with enhanced audit logging.

3. **eFileTexas integration dependency.** The filing submission and status tracking depend on eFileTexas API availability. If eFileTexas is down, packets remain in `ATTORNEY_APPROVED` until the service recovers. Mitigation: BullMQ retry with exponential backoff; staff can manually record filing outcomes for paper filings or system outages.

4. **Storage growth.** Storing every version of every document (including full PDF content in S3) will accumulate significant storage over years. Mitigation: S3 lifecycle policies to transition old versions to Glacier/cold storage after the matter is closed and the retention period expires.

---

## Alternatives Considered

### DocuSign for Attorney Approval

Use DocuSign's e-signature workflow to route documents to attorneys for approval.

**Rejected because:**
- Attorney approval in this context is an internal workflow gate, not a legal signature. The attorney is not signing the document -- they are approving it for filing. Adding an external e-signature round-trip for every document review adds latency and cost without legal benefit.
- DocuSign introduces an external dependency into a critical-path workflow. If DocuSign is down, no documents can be approved. The internal state machine has no such dependency.
- The approval action needs to be tightly integrated with the filing packet lifecycle. A DocuSign callback would need to update the internal state machine, adding integration complexity for no functional gain.

### Microsoft Word Merge for Document Generation

Use .docx templates with Word merge fields, generating output via a library like docx-templates or officegen.

**Rejected because:**
- Word merge produces .docx files that require post-processing conversion to PDF for filing. The conversion step (via LibreOffice or a cloud service) adds complexity and potential formatting drift.
- Handlebars templates operate on HTML/text content that is rendered directly to PDF via a purpose-built renderer (e.g., Puppeteer or a PDF generation library), giving precise control over formatting, page breaks, and court-required margins.
- Word merge has no built-in version control. The template is a binary .docx file that is difficult to diff, review, or store in version control. Handlebars templates are plain text, diffable, and stored in the database with full version history.
- Conditional logic in Word merge fields is limited and fragile. Handlebars provides clean `{{#if}}`, `{{#each}}`, and custom helper support for the complex conditional sections required in family law documents (e.g., different language for sole vs. joint managing conservatorship).

### Flat Document Model (No Filing Packets)

Track individual documents and their filing status without a grouping packet entity.

**Rejected because:**
- eFileTexas submissions are envelopes, not individual documents. A single filing submission contains a lead document, attachments, service contacts, and metadata. Without a packet entity to group these, the submission logic would need to ad-hoc assemble the envelope from loose documents at submission time, with no persistent record of the intended grouping.
- Attorney approval of a filing is approval of the complete package, not individual documents in isolation. The packet entity provides the object the attorney reviews and approves as a unit.
- Filing packets enable queue management. Staff can see all packets in various stages (assembling, ready for review, submitted, accepted) in a filing queue view, providing operational visibility that loose documents cannot.

---

## Implementation Notes

### Template Merge Field Catalog

Standard merge fields available in all templates:

| Namespace | Fields | Source |
|-----------|--------|--------|
| `matter` | `cause_number`, `court_number`, `court_name`, `case_type`, `status`, `opened_at` | Matters module |
| `petitioner` | `full_name`, `first_name`, `last_name`, `address.*`, `phone`, `email`, `date_of_birth`, `ssn_last_four`, `drivers_license` | Contacts module (via matter_contacts where role = 'client') |
| `respondent` | Same as petitioner | Contacts module (via matter_contacts where role = 'opposing_party') |
| `children[]` | `full_name`, `first_name`, `last_name`, `date_of_birth`, `gender`, `current_residence` | Contacts module (via matter_contacts where role = 'child') |
| `attorney` | `full_name`, `bar_number`, `firm_name`, `address.*`, `phone`, `email` | Users module (assigned attorney on matter) |
| `filing` | `filing_date`, `filing_code`, `document_type` | Filing module (populated at packet assembly) |
| `financial` | `monthly_support`, `total_arrearage`, `wage_withholding_amount` | Financial module (for support-related documents) |

### eFileTexas Integration Readiness

The filing packet structure is designed to map directly to the eFileTexas SOAP/REST API envelope format. The actual API integration is deferred to a later phase, but the data model captures all fields required by the eFileTexas submission specification:

- `case_category` maps to eFileTexas CaseCategoryCode
- `case_type` maps to eFileTexas CaseTypeCode
- `filing_code` maps to eFileTexas FilingCode per document
- `party_designations` map to eFileTexas PartyType codes
- `service_contacts` with email addresses map to eFileTexas ServiceContact elements

Until the API integration is built, filing packets in `ATTORNEY_APPROVED` status are marked as "ready for manual filing" and staff can record the outcome manually by transitioning to `ACCEPTED` or `REJECTED` with the cause number and filing confirmation entered by hand.

### BullMQ Job Queues for Documents and Filing

| Queue | Job Type | Description |
|-------|----------|-------------|
| `documents:generate` | `generate-from-template` | Merge matter data into template, produce HTML, render to PDF, store in S3, create version record |
| `documents:generate` | `regenerate-version` | Re-render an existing version (e.g., after template fix) |
| `filing:submit` | `submit-to-efiling` | Transmit filing packet to eFileTexas API (future phase) |
| `filing:submit` | `check-submission-status` | Poll eFileTexas for submission acceptance/rejection (future phase) |
| `filing:submit` | `process-acceptance` | On acceptance: update packet status, update all document statuses to FILED, record cause number |

### Court and Filing Code Reference Tables

Harris County filing codes and court assignments are stored in reference tables (seeded, not user-editable):

- `ref_filing_codes` -- eFileTexas filing code catalog with description and applicable case categories
- `ref_case_categories` -- eFileTexas case category codes (family, civil, probate, etc.)
- `ref_case_types` -- eFileTexas case type codes within each category
- `ref_courts` -- Harris County family courts with court number, judge name, and coordinator contact

These reference tables are updated periodically as the Harris County District Clerk publishes changes.
