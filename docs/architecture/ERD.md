# Entity-Relationship Diagram -- Ttaylor Family Law Paralegal Platform

**Version**: 1.0.0
**Source of Truth**: `/SCHEMA_CANON.md`
**Last Updated**: 2026-04-21

---

## Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram

    %% ============================================
    %% IDENTITY AND ACCESS
    %% ============================================

    users {
        UUID id PK
        TEXT email UK
        TEXT password_hash
        TEXT first_name
        TEXT last_name
        TEXT phone
        BOOLEAN is_active
        BOOLEAN is_attorney
        TEXT bar_number
        TEXT mfa_secret
        BOOLEAN mfa_enabled
        TIMESTAMPTZ last_login_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
    }

    roles {
        UUID id PK
        TEXT name UK
        TEXT display_name
        TEXT description
        BOOLEAN is_system
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    permissions {
        UUID id PK
        TEXT key UK
        TEXT description
        TIMESTAMPTZ created_at
    }

    user_roles {
        UUID id PK
        UUID user_id FK
        UUID role_id FK
        UUID assigned_by FK
        TIMESTAMPTZ assigned_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    role_permissions {
        UUID id PK
        UUID role_id FK
        UUID permission_id FK
        TIMESTAMPTZ created_at
    }

    users ||--o{ user_roles : "holds"
    roles ||--o{ user_roles : "assigned to"
    users ||--o{ user_roles : "assigned_by"
    roles ||--o{ role_permissions : "grants"
    permissions ||--o{ role_permissions : "granted via"

    %% ============================================
    %% LEADS AND INTAKE
    %% ============================================

    leads {
        UUID id PK
        TEXT source
        TEXT status
        TEXT first_name
        TEXT last_name
        TEXT email
        TEXT phone
        TEXT preferred_contact_method
        TEXT matter_type_interest
        TEXT notes
        UUID assigned_to FK
        UUID converted_matter_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
    }

    intake_questionnaires {
        UUID id PK
        UUID lead_id FK
        TEXT questionnaire_type
        JSONB responses
        TIMESTAMPTZ completed_at
        UUID completed_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    conflict_checks {
        UUID id PK
        UUID lead_id FK
        UUID checked_by FK
        TEXT check_method
        JSONB parties_checked
        JSONB conflicts_found
        TEXT result
        BOOLEAN attorney_cleared
        UUID attorney_cleared_by FK
        TIMESTAMPTZ attorney_cleared_at
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    leads ||--o{ intake_questionnaires : "has"
    leads ||--o{ conflict_checks : "checked via"
    users ||--o{ leads : "assigned_to"
    users ||--o{ intake_questionnaires : "completed_by"
    users ||--o{ conflict_checks : "checked_by"
    users ||--o{ conflict_checks : "attorney_cleared_by"

    %% ============================================
    %% CONTACTS AND PEOPLE
    %% ============================================

    contacts {
        UUID id PK
        TEXT contact_type
        TEXT first_name
        TEXT middle_name
        TEXT last_name
        TEXT suffix
        TEXT preferred_name
        TEXT email
        TEXT phone_primary
        TEXT phone_secondary
        DATE date_of_birth
        TEXT ssn_last_four
        TEXT drivers_license_number
        TEXT drivers_license_state
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
    }

    addresses {
        UUID id PK
        UUID contact_id FK
        TEXT address_type
        BOOLEAN is_primary
        TEXT street_1
        TEXT street_2
        TEXT city
        TEXT state
        TEXT zip
        TEXT county
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    children {
        UUID id PK
        UUID contact_id FK
        DATE date_of_birth
        TEXT gender
        TEXT school_name
        TEXT school_district
        TEXT grade
        TEXT special_needs
        TEXT custody_status
        UUID primary_residence_parent_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    employment_records {
        UUID id PK
        UUID contact_id FK
        TEXT employer_name
        TEXT job_title
        DATE start_date
        DATE end_date
        BOOLEAN is_current
        NUMERIC gross_monthly_income
        NUMERIC net_monthly_income
        TEXT pay_frequency
        TEXT employer_address
        TEXT employer_phone
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    contacts ||--o{ addresses : "has"
    contacts ||--o{ children : "is child record for"
    contacts ||--o{ employment_records : "employed at"
    contacts ||--o{ children : "primary_residence_parent"

    %% ============================================
    %% MATTER CORE
    %% ============================================

    matter_types {
        UUID id PK
        TEXT code UK
        TEXT display_name
        TEXT description
        UUID default_checklist_template_id FK
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matter_stages {
        UUID id PK
        UUID matter_type_id FK
        TEXT code
        TEXT display_name
        INTEGER sort_order
        TEXT description
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matters {
        UUID id PK
        TEXT matter_number UK
        TEXT cause_number
        UUID matter_type_id FK
        UUID current_stage_id FK
        TEXT status
        TEXT title
        TEXT short_description
        TEXT county
        TEXT court_number
        UUID judge_contact_id FK
        UUID lead_id FK
        TIMESTAMPTZ opened_at
        TIMESTAMPTZ closed_at
        TIMESTAMPTZ archived_at
        TEXT urgency
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
    }

    matter_assignments {
        UUID id PK
        UUID matter_id FK
        UUID user_id FK
        TEXT assignment_role
        BOOLEAN is_primary
        TIMESTAMPTZ assigned_at
        TIMESTAMPTZ removed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matter_parties {
        UUID id PK
        UUID matter_id FK
        UUID contact_id FK
        TEXT party_role
        BOOLEAN is_primary_client
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matter_stage_transitions {
        UUID id PK
        UUID matter_id FK
        UUID from_stage_id FK
        UUID to_stage_id FK
        UUID transitioned_by FK
        TEXT reason
        TIMESTAMPTZ created_at
    }

    matter_types ||--o{ matter_stages : "defines"
    matter_types ||--o{ matters : "classifies"
    matter_stages ||--o{ matters : "current_stage"
    leads }o--o| matters : "converted to"
    contacts ||--o{ matters : "judge_contact"
    matters ||--o{ matter_assignments : "staffed by"
    users ||--o{ matter_assignments : "assigned to"
    matters ||--o{ matter_parties : "involves"
    contacts ||--o{ matter_parties : "participates in"
    matters ||--o{ matter_stage_transitions : "progresses through"
    matter_stages ||--o{ matter_stage_transitions : "from_stage"
    matter_stages ||--o{ matter_stage_transitions : "to_stage"
    users ||--o{ matter_stage_transitions : "transitioned_by"

    %% ============================================
    %% WORKFLOW AND TASKS
    %% ============================================

    checklist_templates {
        UUID id PK
        TEXT name
        UUID matter_type_id FK
        TEXT description
        INTEGER version
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    checklist_template_items {
        UUID id PK
        UUID checklist_template_id FK
        TEXT title
        TEXT description
        INTEGER sort_order
        BOOLEAN is_required
        UUID stage_gate_id FK
        UUID depends_on_item_id FK
        TEXT default_assignee_role
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    checklist_instances {
        UUID id PK
        UUID matter_id FK
        UUID checklist_template_id FK
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    checklist_item_instances {
        UUID id PK
        UUID checklist_instance_id FK
        UUID checklist_template_item_id FK
        TEXT status
        UUID assigned_to FK
        UUID completed_by FK
        TIMESTAMPTZ completed_at
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    tasks {
        UUID id PK
        UUID matter_id FK
        TEXT title
        TEXT description
        TEXT status
        TEXT priority
        UUID assigned_to FK
        UUID assigned_by FK
        TIMESTAMPTZ due_at
        TIMESTAMPTZ completed_at
        UUID completed_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    deadlines {
        UUID id PK
        UUID matter_id FK
        TEXT title
        TEXT deadline_type
        DATE due_date
        TIME due_time
        INTEGER_ARRAY reminder_days_before
        TEXT status
        TIMESTAMPTZ completed_at
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    calendar_events {
        UUID id PK
        UUID matter_id FK
        TEXT event_type
        TEXT title
        TEXT description
        TEXT location
        TIMESTAMPTZ start_at
        TIMESTAMPTZ end_at
        BOOLEAN is_all_day
        INTEGER_ARRAY reminder_minutes_before
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matter_types ||--o{ checklist_templates : "has default"
    checklist_templates ||--o{ checklist_template_items : "contains"
    checklist_template_items ||--o{ checklist_template_items : "depends_on"
    matter_stages ||--o{ checklist_template_items : "stage_gate"
    matters ||--o{ checklist_instances : "has"
    checklist_templates ||--o{ checklist_instances : "generated from"
    checklist_instances ||--o{ checklist_item_instances : "contains"
    checklist_template_items ||--o{ checklist_item_instances : "derived from"
    users ||--o{ checklist_item_instances : "assigned_to"
    users ||--o{ checklist_item_instances : "completed_by"
    matters ||--o{ tasks : "has"
    users ||--o{ tasks : "assigned_to"
    users ||--o{ tasks : "assigned_by"
    matters ||--o{ deadlines : "has"
    users ||--o{ deadlines : "created_by"
    matters ||--o{ calendar_events : "scheduled for"
    users ||--o{ calendar_events : "created_by"

    %% ============================================
    %% DOCUMENTS AND TEMPLATES
    %% ============================================

    templates {
        UUID id PK
        TEXT name
        TEXT category
        UUID matter_type_id FK
        UUID file_asset_id FK
        JSONB merge_fields
        INTEGER version
        BOOLEAN is_active
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    documents {
        UUID id PK
        UUID matter_id FK
        UUID template_id FK
        TEXT title
        TEXT document_type
        TEXT status
        UUID current_version_id FK
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
    }

    document_versions {
        UUID id PK
        UUID document_id FK
        INTEGER version_number
        UUID file_asset_id FK
        TEXT change_summary
        UUID created_by FK
        TIMESTAMPTZ created_at
    }

    document_approvals {
        UUID id PK
        UUID document_id FK
        UUID document_version_id FK
        UUID requested_by FK
        TIMESTAMPTZ requested_at
        UUID reviewer_id FK
        TEXT decision
        TIMESTAMPTZ decision_at
        TEXT comments
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matter_types ||--o{ templates : "applicable to"
    templates ||--o{ documents : "generated from"
    matters ||--o{ documents : "contains"
    documents ||--o{ document_versions : "versioned as"
    documents ||--o{ document_approvals : "reviewed via"
    document_versions ||--o{ document_approvals : "specific version"
    users ||--o{ documents : "created_by"
    users ||--o{ document_versions : "created_by"
    users ||--o{ document_approvals : "requested_by"
    users ||--o{ document_approvals : "reviewer"

    %% ============================================
    %% FILING AND SERVICE
    %% ============================================

    filing_packets {
        UUID id PK
        UUID matter_id FK
        TEXT packet_name
        TEXT status
        TEXT filing_county
        TEXT court_number
        TEXT filing_type
        UUID attorney_approved_by FK
        TIMESTAMPTZ attorney_approved_at
        TIMESTAMPTZ submitted_at
        TIMESTAMPTZ accepted_at
        TIMESTAMPTZ rejected_at
        TEXT rejection_reason
        TEXT notes
        UUID assembled_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    filing_packet_items {
        UUID id PK
        UUID filing_packet_id FK
        UUID document_id FK
        UUID document_version_id FK
        INTEGER sort_order
        TEXT item_role
        TIMESTAMPTZ created_at
    }

    filing_events {
        UUID id PK
        UUID filing_packet_id FK
        TEXT event_type
        JSONB event_data
        UUID performed_by FK
        TEXT notes
        TIMESTAMPTZ created_at
    }

    service_records {
        UUID id PK
        UUID matter_id FK
        UUID document_id FK
        UUID served_on_contact_id FK
        TEXT service_method
        TIMESTAMPTZ served_at
        TEXT served_by
        BOOLEAN return_received
        TIMESTAMPTZ return_received_at
        UUID file_asset_id FK
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matters ||--o{ filing_packets : "filed via"
    filing_packets ||--o{ filing_packet_items : "contains"
    documents ||--o{ filing_packet_items : "included in"
    document_versions ||--o{ filing_packet_items : "specific version"
    filing_packets ||--o{ filing_events : "tracked by"
    users ||--o{ filing_packets : "attorney_approved_by"
    users ||--o{ filing_packets : "assembled_by"
    users ||--o{ filing_events : "performed_by"
    matters ||--o{ service_records : "served for"
    documents ||--o{ service_records : "served document"
    contacts ||--o{ service_records : "served on"

    %% ============================================
    %% DISCOVERY AND EVIDENCE
    %% ============================================

    discovery_requests {
        UUID id PK
        UUID matter_id FK
        TEXT direction
        TEXT discovery_type
        TEXT title
        UUID served_on_contact_id FK
        UUID received_from_contact_id FK
        DATE served_date
        DATE response_due_date
        TEXT status
        UUID document_id FK
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    discovery_responses {
        UUID id PK
        UUID discovery_request_id FK
        DATE response_date
        TEXT status
        UUID document_id FK
        TEXT deficiency_notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    discovery_items {
        UUID id PK
        UUID discovery_request_id FK
        INTEGER item_number
        TEXT description
        TEXT response_text
        TEXT objection_text
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    evidence_items {
        UUID id PK
        UUID matter_id FK
        TEXT exhibit_number
        TEXT title
        TEXT description
        TEXT evidence_type
        TEXT source
        DATE date_obtained
        UUID file_asset_id FK
        BOOLEAN is_admitted
        TIMESTAMPTZ admitted_at
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matters ||--o{ discovery_requests : "has"
    discovery_requests ||--o{ discovery_responses : "responded to by"
    discovery_requests ||--o{ discovery_items : "contains"
    contacts ||--o{ discovery_requests : "served_on"
    contacts ||--o{ discovery_requests : "received_from"
    documents ||--o{ discovery_requests : "documented by"
    documents ||--o{ discovery_responses : "documented by"
    users ||--o{ discovery_requests : "created_by"
    users ||--o{ discovery_responses : "created_by"
    matters ||--o{ evidence_items : "exhibits"
    users ||--o{ evidence_items : "created_by"

    %% ============================================
    %% COMMUNICATIONS AND PORTAL
    %% ============================================

    communication_threads {
        UUID id PK
        UUID matter_id FK
        UUID lead_id FK
        TEXT subject
        TEXT channel
        BOOLEAN is_privileged
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    communication_messages {
        UUID id PK
        UUID thread_id FK
        UUID sender_user_id FK
        UUID sender_portal_access_id FK
        TEXT body
        BOOLEAN is_read
        TIMESTAMPTZ read_at
        TIMESTAMPTZ created_at
    }

    portal_access {
        UUID id PK
        UUID contact_id FK
        UUID matter_id FK
        TEXT email
        TEXT password_hash
        BOOLEAN is_active
        UUID invited_by FK
        TIMESTAMPTZ invited_at
        TIMESTAMPTZ accepted_at
        TIMESTAMPTZ last_login_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matters ||--o{ communication_threads : "has"
    leads ||--o{ communication_threads : "has"
    communication_threads ||--o{ communication_messages : "contains"
    users ||--o{ communication_messages : "sent by staff"
    portal_access ||--o{ communication_messages : "sent by client"
    users ||--o{ communication_threads : "created_by"
    contacts ||--o{ portal_access : "accesses via"
    matters ||--o{ portal_access : "grants access to"
    users ||--o{ portal_access : "invited_by"

    %% ============================================
    %% FINANCIALS
    %% ============================================

    financial_entries {
        UUID id PK
        UUID matter_id FK
        TEXT entry_type
        NUMERIC amount
        TEXT description
        DATE date
        TEXT category
        NUMERIC hours
        NUMERIC rate
        UUID entered_by FK
        UUID approved_by FK
        TIMESTAMPTZ approved_at
        TEXT invoice_number
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    settlement_proposals {
        UUID id PK
        UUID matter_id FK
        TEXT direction
        DATE proposal_date
        TEXT status
        TEXT summary
        JSONB terms
        UUID document_id FK
        TIMESTAMPTZ responded_at
        UUID response_proposal_id FK
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matters ||--o{ financial_entries : "billed for"
    users ||--o{ financial_entries : "entered_by"
    users ||--o{ financial_entries : "approved_by"
    matters ||--o{ settlement_proposals : "negotiated via"
    documents ||--o{ settlement_proposals : "documented by"
    settlement_proposals ||--o{ settlement_proposals : "countered by"
    users ||--o{ settlement_proposals : "created_by"

    %% ============================================
    %% ORDERS AND COMPLIANCE
    %% ============================================

    orders {
        UUID id PK
        UUID matter_id FK
        TEXT order_type
        TEXT title
        DATE signed_date
        DATE effective_date
        DATE expiration_date
        UUID document_id FK
        TEXT status
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    compliance_items {
        UUID id PK
        UUID order_id FK
        UUID matter_id FK
        UUID obligated_contact_id FK
        TEXT description
        TEXT compliance_type
        DATE due_date
        TEXT recurrence_rule
        TEXT status
        UUID verified_by FK
        TIMESTAMPTZ verified_at
        TEXT notes
        UUID created_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    matters ||--o{ orders : "governed by"
    documents ||--o{ orders : "signed order doc"
    users ||--o{ orders : "created_by"
    orders ||--o{ compliance_items : "obligates"
    matters ||--o{ compliance_items : "tracked on"
    contacts ||--o{ compliance_items : "obligated party"
    users ||--o{ compliance_items : "verified_by"
    users ||--o{ compliance_items : "created_by"

    %% ============================================
    %% AUDIT AND FILE STORAGE
    %% ============================================

    audit_events {
        UUID id PK
        TEXT event_type
        TEXT actor_type
        UUID actor_id
        TEXT resource_type
        UUID resource_id
        UUID matter_id
        JSONB changes
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    file_assets {
        UUID id PK
        TEXT storage_key UK
        TEXT original_filename
        TEXT content_type
        BIGINT size_bytes
        TEXT checksum_sha256
        UUID uploaded_by_user_id FK
        UUID uploaded_by_portal_id FK
        TEXT virus_scan_status
        TIMESTAMPTZ virus_scanned_at
        TIMESTAMPTZ created_at
    }

    users ||--o{ file_assets : "uploaded_by_user"
    portal_access ||--o{ file_assets : "uploaded_by_portal"
    file_assets ||--o{ templates : "template file"
    file_assets ||--o{ document_versions : "version file"
    file_assets ||--o{ service_records : "proof of service"
    file_assets ||--o{ evidence_items : "digital copy"
```

---

## Key Design Decisions

### 1. UUID Primary Keys

Every table uses `UUID` primary keys with `gen_random_uuid()` defaults. This provides:

- **Distributed ID generation**: No sequence contention; IDs can be generated at the application layer before insert.
- **Security**: IDs are not sequential, preventing enumeration attacks. A client cannot guess another matter's ID by incrementing.
- **Merge safety**: If the system ever needs to merge data from multiple environments (staging to production, multi-tenant separation), UUID keys avoid collision.
- **tRPC ergonomics**: UUIDs work naturally as cursor values for pagination and as URL-safe identifiers.

### 2. Soft Deletes

Tables holding substantive legal data use `deleted_at TIMESTAMPTZ NULL` for soft deletes:

- **Legal retention**: Family law records must be retained for years. A hard delete would violate retention obligations.
- **Audit trail continuity**: `audit_events` references `resource_id` by UUID. If the referenced row were hard-deleted, the audit trail would point at nothing.
- **Undo capability**: Accidental deletion of a matter or contact can be reversed by setting `deleted_at` back to null.
- **Query convention**: All application queries filter `WHERE deleted_at IS NULL` by default. Prisma middleware enforces this globally.

Tables that do NOT have soft deletes are either immutable (audit_events, file_assets, matter_stage_transitions) or are junction/reference tables where hard-delete is safe (role_permissions, filing_packet_items).

### 3. audit_events as Append-Only

The `audit_events` table has no `updated_at` or `deleted_at` columns. It is strictly append-only:

- **Immutability**: Audit logs that can be edited are not audit logs. The append-only constraint is enforced at the database level via a trigger that rejects UPDATE and DELETE on this table.
- **Legal defensibility**: If a dispute arises about what happened in a case, the audit trail must be tamper-evident.
- **Structured changes**: The `changes` JSONB column stores before/after diffs, so the complete history of any record can be reconstructed from the audit trail alone.
- **Indexed for retrieval**: Four indexes cover the primary access patterns: by resource, by actor, by matter, and by time range.

### 4. file_assets as Central File Reference

All physical files (uploads, generated documents, template files, proof-of-service scans, evidence) route through a single `file_assets` table:

- **Single source of truth for storage**: Every file has exactly one `storage_key` in S3-compatible storage. No table stores file paths directly.
- **Integrity verification**: Every file has a `checksum_sha256` recorded at upload time, enabling integrity checks on retrieval.
- **Virus scanning**: Every file goes through a virus scan pipeline. The `virus_scan_status` column ensures infected files are never served.
- **Immutability**: File assets have no `updated_at`. Editing a document creates a new `document_version` pointing at a new `file_asset`. This preserves the complete version history.
- **Dual uploader tracking**: Both staff (`uploaded_by_user_id`) and portal clients (`uploaded_by_portal_id`) can upload files, tracked distinctly.

### 5. Separation of Contacts and Portal Access

Staff users (`users` table) and client portal users (`portal_access` table) are stored separately:

- **Security isolation**: Staff credentials and client credentials live in different tables with different access patterns. A SQL injection on the portal side cannot directly access staff credentials.
- **Per-matter access**: A client gets portal access scoped to a specific matter. They cannot see other matters they are not parties to.
- **Contact reusability**: A `contact` can appear across multiple matters (e.g., a parent in multiple SAPCR cases). Portal access is granted per-matter, not per-contact.

### 6. Matter Stage Transitions as Audit Trail

The `matter_stage_transitions` table records every stage change as an immutable event:

- **Compliance tracking**: Courts and bar associations may ask when a case reached a particular stage. This table provides an exact timeline.
- **Analytics**: Transition data enables pipeline velocity reporting (average time in each stage by matter type).
- **Rollback evidence**: If a matter is moved back to a previous stage (e.g., from discovery back to drafting), the reason is documented.
