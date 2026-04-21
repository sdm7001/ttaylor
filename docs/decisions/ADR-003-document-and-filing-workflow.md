# ADR-003: Document Automation and Filing Workflow

**Status**: Accepted
**Date**: 2026-04-20
**Decision Makers**: Architecture team
**Supersedes**: None
**Related**: ADR-001 (System Topology), ADR-002 (Authentication and RBAC)

---

## Context

The platform must generate, manage, and electronically file legal documents in Harris County, Texas family courts through the eFileTexas system. This involves three interrelated challenges:

### 1. Document Automation
Family law documents are highly structured and repetitive. A Final Decree of Divorce follows a standard format but varies in content based on the specific facts of each case (children, property, support). Paralegals currently draft these documents manually in Word, copying from prior matters and modifying for the current case. This is error-prone, slow, and creates version control chaos.

### 2. Filing Packet Construction
Harris County e-filing through eFileTexas requires documents to be submitted as structured filing packets. Each packet has a lead document, ordered attachments, and metadata (filing code, document type, case number, party information). Harris County has specific guidance on how documents must be grouped — for example, an affidavit that verifies a petition must be combined with the petition as a single PDF, not filed as a separate attachment. Errors in packet construction result in filing rejections, which delay the case and frustrate clients.

### 3. Attorney Review Workflow
Texas law and professional ethics require attorney supervision of paralegal work product. Every document filed with a court must be reviewed and approved by an attorney before submission. Currently, this happens informally — a paralegal emails a draft to the attorney, the attorney reviews it in Word, and the paralegal incorporates changes. There is no systematic record of who approved what and when, creating compliance risk.

### Options Considered

**Option A: Documents as loose files with ad-hoc filing**
- Documents stored as individual files. Filing packets assembled manually at submission time.
- Pros: Simple implementation.
- Cons: No control over filing packet construction. No attorney approval workflow. No version tracking. Filing errors are likely and hard to diagnose.

**Option B: Documents with explicit state machine; filing packets as first-class objects**
- Documents follow a defined lifecycle with explicit state transitions. Filing packets are structured objects that enforce Harris County filing rules. Attorney approval is a required workflow gate with audit records.
- Pros: Prevents ad-hoc filing mistakes. Enforces attorney review. Provides complete audit trail. Models the actual legal workflow accurately.
- Cons: More implementation complexity. Requires understanding of Harris County filing rules (which change periodically).

---

## Decision

### Document State Machine

Every document in the system follows an explicit state machine. State transitions are enforced by the document module — no document can skip a state or transition backward without an explicit override (which is audit-logged).

```
┌─────────┐    ┌───────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Draft   │───▶│ Generated │───▶│ Internal Review  │───▶│ Attorney Review  │
└─────────┘    └───────────┘    └─────────────────┘    └─────────────────┘
                                                               │
                                                               ▼
┌─────────┐    ┌────────┐                              ┌──────────┐
│  Filed   │◀───│ Signed │◀─────────────────────────────│ Approved │
└─────────┘    └────────┘                              └──────────┘
```

#### State Definitions

| State | Description | Who Can Transition | Next States |
|-------|-------------|-------------------|-------------|
| **Draft** | Document is being manually composed or edited. Not yet generated from a template. Used for bespoke documents that don't have templates. | Paralegal, Attorney | Generated, Internal Review |
| **Generated** | Document has been generated from a template with merge fields populated from matter data. Content reflects current matter state but has not been reviewed. | System (automatic on generation) | Internal Review |
| **Internal Review** | Document is being reviewed by the paralegal or another staff member for accuracy, completeness, and formatting before attorney review. Errors caught here avoid wasting attorney time. | Paralegal | Attorney Review, Draft (if revisions needed) |
| **Attorney Review** | Document is queued for attorney review. The assigned attorney must review the document and either approve it or return it with comments. This is a **blocking gate** — nothing proceeds until the attorney acts. | Attorney | Approved, Internal Review (returned with comments) |
| **Approved** | Attorney has reviewed and approved the document. Approval is recorded with the attorney's user ID, timestamp, and optional note. Document content is frozen at this point — any subsequent edit creates a new version that must re-enter the workflow. | Attorney (approval action) | Signed |
| **Signed** | Document has been executed (signed by the necessary parties). For court orders, this means the judge has signed. For agreements, this means all parties have signed. Signature may be wet-ink (scanned) or electronic. | Paralegal (records signature) | Filed |
| **Filed** | Document has been submitted to the court through eFileTexas and accepted by the clerk. Filing confirmation (envelope ID, timestamp, acceptance status) is recorded. | System (automatic on filing acceptance) | Terminal state |

#### State Transition Rules

- **No skipping states**: A document cannot go from Draft directly to Approved. Every document must pass through Attorney Review.
- **Backward transitions create audit entries**: Returning a document from Attorney Review to Internal Review logs the attorney's comments and the reason for return.
- **Content freezing on approval**: Once a document enters the Approved state, its content is immutable. Any edit creates a new document version that starts at Draft and must complete the full workflow. The prior approved version is preserved for audit.
- **Attorney Review is non-delegable**: Only users with the `documents:attorney_review` permission (Attorney role) can transition a document from Attorney Review to Approved. This cannot be delegated to paralegals or legal assistants regardless of firm preference — it is a professional obligation.

---

### Filing Packet Model

Filing packets are **first-class objects** in the platform, not ad-hoc groupings of documents. A filing packet represents a single filing submission to eFileTexas and contains all the information needed for successful e-filing.

#### Filing Packet Structure

```
Filing Packet
├── Metadata
│   ├── Cause Number
│   ├── Court (District Court / County Court at Law + number)
│   ├── Filing Code (eFileTexas document type code)
│   ├── Filing Party (which party is filing)
│   ├── Filing Attorney (attorney of record)
│   ├── Confidentiality Designation (public / confidential / sealed)
│   └── Service Recipients (parties to be served via e-service)
├── Lead Document (exactly one)
│   ├── Document reference (linked to document in document module)
│   ├── Document title (as it should appear on the filing)
│   └── Document type code
├── Attachments (zero or more, ordered)
│   ├── Attachment 1
│   │   ├── Document reference
│   │   ├── Attachment title
│   │   └── Attachment type code
│   ├── Attachment 2
│   │   └── ...
│   └── Attachment N
└── Envelope (parent container)
    ├── Envelope ID (assigned by eFileTexas on submission)
    ├── Payment method
    └── Submission status
```

#### Harris County Filing Rules (Encoded in Platform)

The platform enforces the following Harris County-specific filing rules:

1. **Affidavit + Principal Document Rule**: When an affidavit accompanies a principal document (e.g., a verification on a petition, an affidavit of inability to pay accompanying a petition), the affidavit and principal document must be combined into a single PDF and filed as one document — not as separate lead document and attachment. The platform's packet builder enforces this by detecting affidavit-principal document pairs and automatically combining them before submission.

2. **Proposed Order Rule**: A proposed order accompanying a motion must be filed as an attachment to the motion, not as a separate filing packet. The platform's packet builder automatically slots proposed orders as attachments when a motion is the lead document.

3. **Exhibit Grouping**: Exhibits referenced in a motion or petition should be filed as attachments to the filing packet containing the referencing document, in the order referenced. The platform allows drag-and-drop ordering of attachments and validates that all referenced exhibits are included.

4. **Filing Code Mapping**: Each document type in the platform maps to a specific eFileTexas filing code. The platform maintains a mapping table that is updated when eFileTexas filing codes change. The filing code determines the filing fee and clerk routing.

5. **Confidentiality Designation**: Certain document types (financial information statements, social studies, sealed records) must be filed with a confidentiality designation. The platform automatically applies the correct designation based on document type and matter restriction level.

6. **Page Size and Format**: eFileTexas requires PDF format, letter size (8.5" x 11"), with no security restrictions (no password protection). The platform's document generation pipeline produces compliant PDFs. Scanned documents are validated for page size and orientation before inclusion in a packet.

#### Filing Packet Lifecycle

```
┌──────────┐    ┌─────────────┐    ┌──────────────────┐    ┌───────────┐
│ Drafting  │───▶│  Assembled  │───▶│ Attorney Approved │───▶│ Submitted │
└──────────┘    └─────────────┘    └──────────────────┘    └───────────┘
                                                                  │
                                          ┌───────────┐           │
                                          │ Rejected  │◀──────────┤
                                          └───────────┘           │
                                                                  ▼
                                                           ┌──────────┐
                                                           │ Accepted │
                                                           └──────────┘
```

| State | Description |
|-------|-------------|
| **Drafting** | Packet is being constructed. Documents are being added, ordered, and validated. |
| **Assembled** | All required documents are present and validated. Harris County filing rules have been checked. Ready for attorney review. |
| **Attorney Approved** | Attorney has reviewed the complete filing packet and authorized its submission. Approval recorded with attorney ID, timestamp, and note. |
| **Submitted** | Packet has been submitted to eFileTexas. Envelope ID recorded. Awaiting clerk review. |
| **Accepted** | Clerk has accepted the filing. Filing timestamp and confirmation recorded. Document states updated to Filed. |
| **Rejected** | Clerk has rejected the filing. Rejection reason recorded. Packet returns to Drafting for correction and re-submission. |

---

### Document Automation (Templates)

#### Template Structure

Templates are stored as structured objects with the following components:

| Component | Description |
|-----------|-------------|
| **Template ID** | Unique identifier |
| **Name** | Human-readable name (e.g., "Original Petition for Divorce — With Children") |
| **Matter Type** | Which matter types this template applies to |
| **Document Type** | Classification (Petition, Motion, Order, Decree, Affidavit, etc.) |
| **Version** | Semantic version (major.minor.patch) |
| **Effective Date** | When this template version became active |
| **Retired Date** | When this template version was retired (null if current) |
| **Content Template** | The document template with merge field placeholders |
| **Merge Field Definitions** | Array of merge fields with source mapping, data type, and formatting rules |
| **Conditional Sections** | Logic for including/excluding template sections based on matter data |
| **Filing Code** | Default eFileTexas filing code for documents generated from this template |
| **Confidentiality** | Default confidentiality designation |

#### Merge Fields

Merge fields connect template placeholders to matter data. Each merge field definition includes:

```typescript
interface MergeFieldDefinition {
  fieldKey: string;           // e.g., "petitioner.fullName"
  displayName: string;        // e.g., "Petitioner Full Name"
  sourceModule: string;       // e.g., "contacts", "matter", "financial"
  sourcePath: string;         // e.g., "contacts.findByRole('petitioner').fullLegalName"
  dataType: 'text' | 'date' | 'currency' | 'number' | 'boolean' | 'address';
  format?: string;            // e.g., "MMMM d, yyyy" for dates
  required: boolean;          // if true, generation fails if field is empty
  fallback?: string;          // default value if source is empty and not required
}
```

#### Conditional Sections

Templates support conditional logic for sections that are included or excluded based on matter data:

- **Children sections**: Included only if matter has associated children
- **Property division sections**: Included only if community property exists
- **Spousal maintenance sections**: Included only if maintenance is requested
- **Military provisions**: Included only if a party is active-duty military
- **ACP provisions**: Included only if a party is an ACP participant (substitutes address)
- **Geographic restriction**: Included with specified county/counties if applicable

Conditions are evaluated at generation time. The generated document is a complete, standalone document with no template artifacts visible.

#### Version Tracking

Every generated document maintains a link to its source template and version:

```typescript
interface GeneratedDocument {
  id: string;
  templateId: string;
  templateVersion: string;
  matterId: string;
  mergeFieldValues: Record<string, any>;  // snapshot of values at generation time
  generatedAt: timestamp;
  generatedBy: string;                     // user who triggered generation
  contentHash: string;                     // SHA-256 of generated content
  state: DocumentState;
}
```

This link enables:
- **Re-generation**: If a template is updated (e.g., to fix a legal citation), documents generated from the old version can be identified and flagged for re-generation.
- **Audit**: Auditors can see exactly which template version produced a document and what merge field values were used.
- **Debugging**: If a generated document contains an error, the template version and merge field values can be inspected to identify the cause.

---

### Approval Workflow

Attorney approval is implemented as an explicit approval record, not a status flag:

```typescript
interface ApprovalRecord {
  id: string;
  documentId: string;          // or filingPacketId
  approvalType: 'document_review' | 'filing_authorization';
  actorId: string;             // attorney user ID
  actorRole: 'attorney';       // enforced — only attorneys can approve
  action: 'approved' | 'returned' | 'revoked';
  timestamp: timestamp;
  note?: string;               // attorney's comments (required on return)
  contentHash: string;         // hash of content at time of approval
}
```

Key design decisions for the approval workflow:

1. **Content hash verification**: The approval record includes a hash of the document content at the time of approval. If the document content changes after approval (which should be prevented by the state machine, but defense in depth), the hash mismatch is detectable.

2. **Approval records are immutable**: Once created, an approval record cannot be modified or deleted. If an approval needs to be revoked (e.g., attorney discovers an error after approval), a new approval record with `action: 'revoked'` is created, and the document returns to a prior state.

3. **Return requires a note**: When an attorney returns a document for revision, they must provide a note explaining what needs to change. This note is visible to the paralegal and is preserved in the audit trail.

4. **Separate document and filing approval**: An attorney may approve a document (content is correct) and later approve the filing packet (packet construction is correct and submission is authorized). These are separate approval actions because a document may be approved but the packet may need adjustment (e.g., wrong filing code, missing attachment).

---

## Rationale

### Why filing packets as first-class objects?

eFileTexas filing rejections are the single most common operational failure in Harris County e-filing. The most frequent causes are: wrong filing code, missing attachments, improperly combined documents (the affidavit rule), and incorrect metadata. By modeling filing packets as structured, validated objects — rather than letting users ad-hoc upload documents to eFileTexas — the platform can prevent the majority of rejection causes before submission.

Additionally, filing packets are a meaningful business object. Staff need to track: what was filed, when, in what packet, with what attachments, and whether it was accepted or rejected. Treating packets as first-class objects makes this tracking natural.

### Why an explicit document state machine?

Without explicit states, documents exist in an ambiguous condition — is this draft final? Has the attorney seen it? Was it already filed? The state machine eliminates ambiguity and provides a clear workflow that matches how law offices actually operate: paralegal drafts, paralegal reviews, attorney reviews, attorney approves, document is filed.

The state machine also provides the foundation for the attorney approval gate. Without it, there is no systematic way to ensure that every filed document was reviewed by an attorney — which is both a professional requirement and a malpractice risk management necessity.

### Why freeze content on approval?

If a document can be edited after attorney approval, the approval is meaningless — the filed version may differ from the approved version. Content freezing ensures that what the attorney approved is what gets filed. If changes are needed after approval, a new version is created and must go through the full review cycle. This is intentionally conservative — the cost of an extra review cycle is trivial compared to the cost of filing a document the attorney did not actually approve.

### Why combine affidavits with principal documents?

This is Harris County-specific guidance that causes frequent filing rejections when violated. By building this rule into the filing packet construction logic, the platform prevents a common error that wastes time, incurs re-filing fees, and delays case progress.

---

## Consequences

### Positive
- **Fewer filing rejections** — Structured packets with validated metadata and enforced Harris County rules prevent the most common rejection causes.
- **Complete audit trail** — Every document state transition, every approval action, and every filing submission is recorded with actor, timestamp, and context.
- **Attorney compliance** — The approval gate ensures that no document reaches the court without attorney review, satisfying professional obligations and reducing malpractice risk.
- **Version integrity** — Content hashing and version tracking ensure that the filed version matches the approved version and can be traced back to its source template.
- **Paralegal efficiency** — Templates with merge fields and conditional sections reduce document drafting time. Paralegals focus on reviewing and refining generated documents rather than drafting from scratch.

### Negative
- **Workflow rigidity** — The state machine does not allow shortcuts. Even a minor correction to an approved document requires a new version and re-approval. This is by design but may feel burdensome for simple typo fixes.
- **Template maintenance burden** — Templates must be updated when laws change, court rules change, or filing codes change. Someone must own template maintenance as an ongoing responsibility.
- **Harris County specificity** — Filing rules are encoded for Harris County. Expanding to other counties or states will require configurable filing rule engines.
- **Learning curve** — Staff accustomed to emailing Word documents for informal review must adapt to the structured workflow. Training and change management are required.

### Future Considerations

- **Multi-county support**: The filing rules engine should be designed to accept county-specific rule configurations, even though the initial implementation is Harris County only.
- **eFileTexas API integration**: The initial implementation may use manual submission (paralegal downloads the packet and uploads to eFileTexas). Direct API integration with eFileTexas should be planned for a subsequent release.
- **Digital signatures**: When Harris County courts accept digital signatures on certain document types, the Signed state can be automated with an e-signature integration.
- **AI-assisted review**: The Internal Review state is a natural insertion point for AI-assisted document review (checking for completeness, consistency with matter data, and common errors) in a future release.

---

## References

- eFileTexas Filing Guide (Tyler Technologies)
- Harris County District Clerk e-Filing FAQ
- Harris County Local Rules for Family District Courts
- Texas Rules of Civil Procedure, Rules 21, 21a (e-filing requirements)
- Texas Disciplinary Rules of Professional Conduct, Rule 5.03 (supervision of non-lawyer assistants)
- ADR-001: System Topology
- ADR-002: Authentication and RBAC
