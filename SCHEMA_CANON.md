# Schema Canon — Ttaylor Family Law Paralegal Platform

**Version**: 1.0.0
**Status**: Phase 1 — Source of Truth
**Last Updated**: 2026-04-20

All database changes MUST be reviewed against this document. No migration may add, remove, or alter a column without updating this canon first and receiving approval.

---

## Naming Conventions

| Rule | Example |
|------|---------|
| Table names: plural snake_case | `matters`, `filing_packets` |
| Column names: singular snake_case | `first_name`, `created_at` |
| Primary keys: `id` of type `UUID` with `gen_random_uuid()` default | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys: `{referenced_table_singular}_id` | `matter_id`, `user_id` |
| Timestamps: `created_at` and `updated_at` on every table | `TIMESTAMPTZ NOT NULL DEFAULT now()` |
| Soft deletes: `deleted_at TIMESTAMPTZ NULL` where appropriate | Null = active, non-null = soft-deleted |
| Boolean columns: `is_` prefix | `is_active`, `is_primary` |
| Enum columns: stored as `TEXT` with CHECK constraint | `status TEXT NOT NULL CHECK (status IN ('draft','active'))` |
| Junction tables: alphabetical combination | `role_permissions`, `matter_assignments` |
| Indexes: `idx_{table}_{columns}` | `idx_matters_status` |

---

## Section 1: Identity and Access

### users

Staff accounts and system users. Client portal users are tracked separately in `portal_access`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique user identifier |
| email | TEXT | NOT NULL, UNIQUE | Login email address |
| password_hash | TEXT | NOT NULL | bcrypt-hashed password |
| first_name | TEXT | NOT NULL | Legal first name |
| last_name | TEXT | NOT NULL | Legal last name |
| phone | TEXT | NULL | Direct phone number |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Whether user can log in |
| is_attorney | BOOLEAN | NOT NULL, DEFAULT false | Whether user is a licensed attorney (gates approval actions) |
| bar_number | TEXT | NULL | Texas bar number if attorney |
| mfa_secret | TEXT | NULL | TOTP secret for MFA; null = MFA not enrolled |
| mfa_enabled | BOOLEAN | NOT NULL, DEFAULT false | Whether MFA is enforced for this user |
| last_login_at | TIMESTAMPTZ | NULL | Timestamp of most recent successful login |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |
| deleted_at | TIMESTAMPTZ | NULL | Soft-delete timestamp |

### roles

Named permission groups. Seeded with: `admin`, `attorney`, `senior_paralegal`, `paralegal`, `intake_specialist`, `billing_clerk`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique role identifier |
| name | TEXT | NOT NULL, UNIQUE | Machine-readable role name |
| display_name | TEXT | NOT NULL | Human-readable label |
| description | TEXT | NULL | Explanation of role purpose |
| is_system | BOOLEAN | NOT NULL, DEFAULT false | If true, role cannot be deleted or renamed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### permissions

Granular action permissions. Format: `resource:action` (e.g., `matter:create`, `document:approve`, `filing:submit`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique permission identifier |
| key | TEXT | NOT NULL, UNIQUE | Permission key in resource:action format |
| description | TEXT | NULL | What this permission grants |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |

### user_roles

Junction table: which users hold which roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Row identifier |
| user_id | UUID | NOT NULL, FK -> users(id) | The user |
| role_id | UUID | NOT NULL, FK -> roles(id) | The assigned role |
| assigned_by | UUID | NOT NULL, FK -> users(id) | Who granted this role |
| assigned_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When role was granted |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

**Unique constraint**: `(user_id, role_id)` — a user cannot hold the same role twice.

### role_permissions

Junction table: which permissions belong to which roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Row identifier |
| role_id | UUID | NOT NULL, FK -> roles(id) | The role |
| permission_id | UUID | NOT NULL, FK -> permissions(id) | The granted permission |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |

**Unique constraint**: `(role_id, permission_id)`

---

## Section 2: Leads and Intake

### leads

Prospective clients before matter opening. A lead may become one or more matters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique lead identifier |
| source | TEXT | NOT NULL, CHECK (source IN ('phone','web_form','referral','walk_in','other')) | How the lead arrived |
| status | TEXT | NOT NULL, DEFAULT 'new', CHECK (status IN ('new','contacted','qualified','converted','declined','lost')) | Current lead status |
| first_name | TEXT | NOT NULL | Prospective client first name |
| last_name | TEXT | NOT NULL | Prospective client last name |
| email | TEXT | NULL | Contact email |
| phone | TEXT | NULL | Contact phone |
| preferred_contact_method | TEXT | NULL, CHECK (preferred_contact_method IN ('phone','email','text')) | How they prefer to be reached |
| matter_type_interest | TEXT | NULL | What type of case they need (free text at intake) |
| notes | TEXT | NULL | Intake notes |
| assigned_to | UUID | NULL, FK -> users(id) | Intake specialist assigned |
| converted_matter_id | UUID | NULL, FK -> matters(id) | Matter created from this lead (null until conversion) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |
| deleted_at | TIMESTAMPTZ | NULL | Soft-delete timestamp |

### intake_questionnaires

Structured intake form responses attached to a lead. One lead may have multiple questionnaire versions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique questionnaire response identifier |
| lead_id | UUID | NOT NULL, FK -> leads(id) | Associated lead |
| questionnaire_type | TEXT | NOT NULL | Type of questionnaire (e.g., 'divorce_initial', 'sapcr_initial', 'modification') |
| responses | JSONB | NOT NULL, DEFAULT '{}' | Structured key-value responses from the intake form |
| completed_at | TIMESTAMPTZ | NULL | When the questionnaire was fully completed |
| completed_by | UUID | NULL, FK -> users(id) | Staff member who completed the form (if staff-assisted) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### conflict_checks

Conflict of interest checks performed against a lead before matter opening.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique conflict check identifier |
| lead_id | UUID | NOT NULL, FK -> leads(id) | Lead being checked |
| checked_by | UUID | NOT NULL, FK -> users(id) | Staff member who ran the check |
| check_method | TEXT | NOT NULL, CHECK (check_method IN ('automated','manual','both')) | How the check was performed |
| parties_checked | JSONB | NOT NULL, DEFAULT '[]' | Array of names/entities searched |
| conflicts_found | JSONB | NOT NULL, DEFAULT '[]' | Array of potential conflicts identified |
| result | TEXT | NOT NULL, CHECK (result IN ('clear','conflict_found','pending_review')) | Outcome of the check |
| attorney_cleared | BOOLEAN | NOT NULL, DEFAULT false | Whether an attorney has reviewed and cleared |
| attorney_cleared_by | UUID | NULL, FK -> users(id) | Attorney who cleared the conflict |
| attorney_cleared_at | TIMESTAMPTZ | NULL | When attorney clearance was given |
| notes | TEXT | NULL | Additional notes about the check |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

---

## Section 3: Contacts and People

### contacts

All people associated with matters: clients, opposing parties, witnesses, mediators, judges, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique contact identifier |
| contact_type | TEXT | NOT NULL, CHECK (contact_type IN ('client','opposing_party','opposing_counsel','judge','mediator','witness','guardian_ad_litem','amicus','expert','other')) | Role this contact plays |
| first_name | TEXT | NOT NULL | Legal first name |
| middle_name | TEXT | NULL | Middle name |
| last_name | TEXT | NOT NULL | Legal last name |
| suffix | TEXT | NULL | Name suffix (Jr., III, etc.) |
| preferred_name | TEXT | NULL | Name they go by |
| email | TEXT | NULL | Email address |
| phone_primary | TEXT | NULL | Primary phone |
| phone_secondary | TEXT | NULL | Secondary phone |
| date_of_birth | DATE | NULL | Date of birth |
| ssn_last_four | TEXT | NULL | Last four digits of SSN (encrypted at rest) |
| drivers_license_number | TEXT | NULL | Driver license number (encrypted at rest) |
| drivers_license_state | TEXT | NULL | State of issuance |
| notes | TEXT | NULL | General notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |
| deleted_at | TIMESTAMPTZ | NULL | Soft-delete timestamp |

### addresses

Physical addresses linked to contacts. A contact may have multiple addresses (home, work, mailing).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique address identifier |
| contact_id | UUID | NOT NULL, FK -> contacts(id) | Owning contact |
| address_type | TEXT | NOT NULL, CHECK (address_type IN ('home','work','mailing','service','other')) | Purpose of this address |
| is_primary | BOOLEAN | NOT NULL, DEFAULT false | Whether this is the primary address for the contact |
| street_1 | TEXT | NOT NULL | Street address line 1 |
| street_2 | TEXT | NULL | Street address line 2 |
| city | TEXT | NOT NULL | City |
| state | TEXT | NOT NULL | State (two-letter code) |
| zip | TEXT | NOT NULL | ZIP or ZIP+4 |
| county | TEXT | NULL | County (important for Texas filing jurisdiction) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### matter_parties

Junction table linking contacts to matters with their role on that specific matter.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Row identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | The matter |
| contact_id | UUID | NOT NULL, FK -> contacts(id) | The contact |
| party_role | TEXT | NOT NULL, CHECK (party_role IN ('petitioner','respondent','intervenor','child','witness','guardian_ad_litem','amicus','mediator','judge','opposing_counsel','expert','other')) | Role on this matter |
| is_primary_client | BOOLEAN | NOT NULL, DEFAULT false | Whether this is our firm's client on this matter |
| notes | TEXT | NULL | Role-specific notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

**Unique constraint**: `(matter_id, contact_id, party_role)` — same contact cannot hold the same role twice on a matter.

### children

Children involved in family law matters. Linked to matters via matter_parties, but stored separately due to specialized fields.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique child identifier |
| contact_id | UUID | NOT NULL, FK -> contacts(id) | Underlying contact record |
| date_of_birth | DATE | NOT NULL | Child's date of birth |
| gender | TEXT | NULL | Gender |
| school_name | TEXT | NULL | Current school |
| school_district | TEXT | NULL | School district |
| grade | TEXT | NULL | Current grade level |
| special_needs | TEXT | NULL | Special needs or medical conditions relevant to custody |
| custody_status | TEXT | NULL, CHECK (custody_status IN ('joint_managing','sole_managing','possessory','pending','not_applicable')) | Current conservatorship status |
| primary_residence_parent_id | UUID | NULL, FK -> contacts(id) | Contact ID of parent with primary residence |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### employment_records

Employment and income information for contacts. Critical for child support and spousal maintenance calculations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique employment record identifier |
| contact_id | UUID | NOT NULL, FK -> contacts(id) | The employed contact |
| employer_name | TEXT | NOT NULL | Name of employer |
| job_title | TEXT | NULL | Position title |
| start_date | DATE | NULL | Employment start date |
| end_date | DATE | NULL | Employment end date (null = current) |
| is_current | BOOLEAN | NOT NULL, DEFAULT true | Whether this is current employment |
| gross_monthly_income | NUMERIC(12,2) | NULL | Gross monthly income |
| net_monthly_income | NUMERIC(12,2) | NULL | Net monthly income |
| pay_frequency | TEXT | NULL, CHECK (pay_frequency IN ('weekly','biweekly','semimonthly','monthly','annually')) | How often paid |
| employer_address | TEXT | NULL | Employer physical address |
| employer_phone | TEXT | NULL | Employer phone number |
| notes | TEXT | NULL | Additional employment notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

---

## Section 4: Matter Core

### matter_types

Reference table of case types the firm handles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique type identifier |
| code | TEXT | NOT NULL, UNIQUE | Machine code (e.g., 'uncontested_divorce', 'sapcr', 'modification', 'adoption', 'enforcement', 'contested_divorce', 'protective_order') |
| display_name | TEXT | NOT NULL | Human label |
| description | TEXT | NULL | Explanation of this matter type |
| default_checklist_template_id | UUID | NULL, FK -> checklist_templates(id) | Default checklist to generate when matter of this type is opened |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Whether this type can be selected for new matters |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### matter_stages

Reference table of stages a matter progresses through. Ordered per matter type.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique stage identifier |
| matter_type_id | UUID | NOT NULL, FK -> matter_types(id) | Which matter type this stage belongs to |
| code | TEXT | NOT NULL | Machine code (e.g., 'intake', 'drafting', 'filed', 'discovery', 'mediation', 'trial_prep', 'trial', 'post_decree', 'closed') |
| display_name | TEXT | NOT NULL | Human label |
| sort_order | INTEGER | NOT NULL | Display/progression order within matter type |
| description | TEXT | NULL | What this stage represents |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

**Unique constraint**: `(matter_type_id, code)`, `(matter_type_id, sort_order)`

### matters

The central entity: an active legal matter (case).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique matter identifier |
| matter_number | TEXT | NOT NULL, UNIQUE | Internal matter number (e.g., 'TT-2026-00142') |
| cause_number | TEXT | NULL | Court-assigned cause number (null until filed) |
| matter_type_id | UUID | NOT NULL, FK -> matter_types(id) | Type of case |
| current_stage_id | UUID | NOT NULL, FK -> matter_stages(id) | Current stage in the workflow |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK (status IN ('active','on_hold','closed','archived')) | High-level matter status |
| title | TEXT | NOT NULL | Matter title (e.g., 'In re Marriage of Smith & Smith') |
| short_description | TEXT | NULL | Brief internal description |
| county | TEXT | NOT NULL | Filing county (e.g., 'Harris', 'Fort Bend') |
| court_number | TEXT | NULL | Court number (e.g., '309th District Court') |
| judge_contact_id | UUID | NULL, FK -> contacts(id) | Assigned judge |
| lead_id | UUID | NULL, FK -> leads(id) | Originating lead (null if opened without lead) |
| opened_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the matter was opened |
| closed_at | TIMESTAMPTZ | NULL | When the matter was closed |
| archived_at | TIMESTAMPTZ | NULL | When the matter was archived |
| urgency | TEXT | NOT NULL, DEFAULT 'normal', CHECK (urgency IN ('low','normal','high','critical')) | Priority/urgency level |
| notes | TEXT | NULL | Internal notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |
| deleted_at | TIMESTAMPTZ | NULL | Soft-delete timestamp |

### matter_assignments

Which staff members are assigned to which matters, and in what capacity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Row identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | The matter |
| user_id | UUID | NOT NULL, FK -> users(id) | The assigned staff member |
| assignment_role | TEXT | NOT NULL, CHECK (assignment_role IN ('lead_attorney','supporting_attorney','lead_paralegal','supporting_paralegal','intake_specialist','billing_clerk')) | Role on this matter |
| is_primary | BOOLEAN | NOT NULL, DEFAULT false | Whether this is the primary assignee for this role |
| assigned_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When assignment was made |
| removed_at | TIMESTAMPTZ | NULL | When assignment was removed (null = active) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

**Unique constraint**: `(matter_id, user_id, assignment_role)` where `removed_at IS NULL`

### matter_stage_transitions

Audit log of every stage change on a matter.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique transition identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | The matter |
| from_stage_id | UUID | NULL, FK -> matter_stages(id) | Previous stage (null for initial assignment) |
| to_stage_id | UUID | NOT NULL, FK -> matter_stages(id) | New stage |
| transitioned_by | UUID | NOT NULL, FK -> users(id) | Who triggered the transition |
| reason | TEXT | NULL | Reason for the transition |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the transition occurred |

---

## Section 5: Workflow and Tasks

### checklist_templates

Reusable checklist templates tied to matter types. Each matter type has a default template that auto-generates on matter creation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique template identifier |
| name | TEXT | NOT NULL | Template name (e.g., 'Uncontested Divorce Checklist') |
| matter_type_id | UUID | NOT NULL, FK -> matter_types(id) | Associated matter type |
| description | TEXT | NULL | What this checklist covers |
| version | INTEGER | NOT NULL, DEFAULT 1 | Template version for tracking changes |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Whether this template is used for new matters |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### checklist_template_items

Individual items within a checklist template.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique template item identifier |
| checklist_template_id | UUID | NOT NULL, FK -> checklist_templates(id) | Parent template |
| title | TEXT | NOT NULL | Item title |
| description | TEXT | NULL | Detailed instructions |
| sort_order | INTEGER | NOT NULL | Display order within checklist |
| is_required | BOOLEAN | NOT NULL, DEFAULT true | Whether this item must be completed |
| stage_gate_id | UUID | NULL, FK -> matter_stages(id) | If set, this item must be complete before matter can advance past this stage |
| depends_on_item_id | UUID | NULL, FK -> checklist_template_items(id) | Item that must be complete before this one can start |
| default_assignee_role | TEXT | NULL | Role that should be auto-assigned (e.g., 'lead_paralegal') |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### checklist_instances

A materialized checklist for a specific matter, generated from a template.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique instance identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | The matter this checklist belongs to |
| checklist_template_id | UUID | NOT NULL, FK -> checklist_templates(id) | Template it was generated from |
| status | TEXT | NOT NULL, DEFAULT 'in_progress', CHECK (status IN ('in_progress','completed','cancelled')) | Overall checklist status |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### checklist_item_instances

Individual items within a materialized checklist.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique item instance identifier |
| checklist_instance_id | UUID | NOT NULL, FK -> checklist_instances(id) | Parent checklist instance |
| checklist_template_item_id | UUID | NOT NULL, FK -> checklist_template_items(id) | Originating template item |
| status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending','in_progress','completed','skipped','blocked')) | Item status |
| assigned_to | UUID | NULL, FK -> users(id) | Staff member assigned to this item |
| completed_by | UUID | NULL, FK -> users(id) | Who marked it complete |
| completed_at | TIMESTAMPTZ | NULL | When it was completed |
| notes | TEXT | NULL | Completion notes or context |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### tasks

Ad-hoc tasks not tied to a checklist. For one-off assignments, follow-ups, and reminders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique task identifier |
| matter_id | UUID | NULL, FK -> matters(id) | Associated matter (null for firm-level tasks) |
| title | TEXT | NOT NULL | Task title |
| description | TEXT | NULL | Detailed description |
| status | TEXT | NOT NULL, DEFAULT 'open', CHECK (status IN ('open','in_progress','completed','cancelled')) | Task status |
| priority | TEXT | NOT NULL, DEFAULT 'normal', CHECK (priority IN ('low','normal','high','urgent')) | Task priority |
| assigned_to | UUID | NULL, FK -> users(id) | Assigned staff member |
| assigned_by | UUID | NOT NULL, FK -> users(id) | Who created/assigned the task |
| due_at | TIMESTAMPTZ | NULL | When the task is due |
| completed_at | TIMESTAMPTZ | NULL | When the task was completed |
| completed_by | UUID | NULL, FK -> users(id) | Who completed it |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### deadlines

Court-imposed or statutory deadlines. These are distinct from task due dates because they carry legal consequences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique deadline identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Associated matter |
| title | TEXT | NOT NULL | Deadline description (e.g., 'Answer Due', 'Discovery Deadline') |
| deadline_type | TEXT | NOT NULL, CHECK (deadline_type IN ('court_ordered','statutory','contractual','internal')) | Source of the deadline |
| due_date | DATE | NOT NULL | The deadline date |
| due_time | TIME | NULL | Specific time if applicable |
| reminder_days_before | INTEGER[] | NOT NULL, DEFAULT '{14,7,3,1}' | Array of days before to send reminders |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK (status IN ('active','completed','waived','extended')) | Current deadline status |
| completed_at | TIMESTAMPTZ | NULL | When the deadline was met |
| notes | TEXT | NULL | Notes about the deadline |
| created_by | UUID | NOT NULL, FK -> users(id) | Who entered the deadline |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### calendar_events

Hearings, mediations, depositions, and other scheduled events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique event identifier |
| matter_id | UUID | NULL, FK -> matters(id) | Associated matter (null for firm-wide events) |
| event_type | TEXT | NOT NULL, CHECK (event_type IN ('hearing','mediation','deposition','client_meeting','internal_meeting','trial','settlement_conference','other')) | Type of event |
| title | TEXT | NOT NULL | Event title |
| description | TEXT | NULL | Event details |
| location | TEXT | NULL | Physical or virtual location |
| start_at | TIMESTAMPTZ | NOT NULL | Event start time |
| end_at | TIMESTAMPTZ | NOT NULL | Event end time |
| is_all_day | BOOLEAN | NOT NULL, DEFAULT false | Whether this is an all-day event |
| reminder_minutes_before | INTEGER[] | NOT NULL, DEFAULT '{1440,60,15}' | Minutes before to send reminders (1440=1day) |
| created_by | UUID | NOT NULL, FK -> users(id) | Who created the event |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

---

## Section 6: Documents and Templates

### templates

Document templates with merge fields. Used to generate first drafts of petitions, orders, agreements, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique template identifier |
| name | TEXT | NOT NULL | Template name (e.g., 'Original Petition for Divorce - Harris County') |
| category | TEXT | NOT NULL, CHECK (category IN ('petition','response','order','agreement','motion','discovery','correspondence','financial','other')) | Document category |
| matter_type_id | UUID | NULL, FK -> matter_types(id) | Applicable matter type (null = universal) |
| file_asset_id | UUID | NOT NULL, FK -> file_assets(id) | The template file (DOCX with merge fields) |
| merge_fields | JSONB | NOT NULL, DEFAULT '[]' | Array of merge field definitions with keys and data sources |
| version | INTEGER | NOT NULL, DEFAULT 1 | Template version |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Whether available for use |
| created_by | UUID | NOT NULL, FK -> users(id) | Template author |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### documents

Documents associated with matters. A document may be generated from a template or uploaded.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique document identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| template_id | UUID | NULL, FK -> templates(id) | Template used to generate this document (null if uploaded) |
| title | TEXT | NOT NULL | Document title |
| document_type | TEXT | NOT NULL, CHECK (document_type IN ('petition','response','order','agreement','motion','discovery_request','discovery_response','financial_disclosure','correspondence','evidence','court_filing','client_upload','internal_memo','other')) | Classification |
| status | TEXT | NOT NULL, DEFAULT 'draft', CHECK (status IN ('draft','in_review','revision_requested','approved','filed','superseded','archived')) | Document lifecycle status |
| current_version_id | UUID | NULL, FK -> document_versions(id) | Pointer to the current version |
| notes | TEXT | NULL | Internal notes about this document |
| created_by | UUID | NOT NULL, FK -> users(id) | Who created the document |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |
| deleted_at | TIMESTAMPTZ | NULL | Soft-delete timestamp |

### document_versions

Version history for documents. Every save creates a new version.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique version identifier |
| document_id | UUID | NOT NULL, FK -> documents(id) | Parent document |
| version_number | INTEGER | NOT NULL | Sequential version number |
| file_asset_id | UUID | NOT NULL, FK -> file_assets(id) | The actual file for this version |
| change_summary | TEXT | NULL | Description of what changed |
| created_by | UUID | NOT NULL, FK -> users(id) | Who created this version |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |

**Unique constraint**: `(document_id, version_number)`

### document_approvals

Attorney review and approval records for documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique approval record identifier |
| document_id | UUID | NOT NULL, FK -> documents(id) | The document under review |
| document_version_id | UUID | NOT NULL, FK -> document_versions(id) | Specific version being reviewed |
| requested_by | UUID | NOT NULL, FK -> users(id) | Who requested the review |
| requested_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When review was requested |
| reviewer_id | UUID | NOT NULL, FK -> users(id) | Attorney reviewing |
| decision | TEXT | NULL, CHECK (decision IN ('approved','rejected','revision_requested')) | Review outcome |
| decision_at | TIMESTAMPTZ | NULL | When decision was made |
| comments | TEXT | NULL | Reviewer comments |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

---

## Section 7: Filing and Service

### filing_packets

Grouped sets of documents prepared for court filing. A packet is the unit of attorney approval and submission.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique packet identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| packet_name | TEXT | NOT NULL | Descriptive name (e.g., 'Original Petition Filing') |
| status | TEXT | NOT NULL, DEFAULT 'assembling', CHECK (status IN ('assembling','pending_review','approved','submitted','accepted','rejected','correcting')) | Packet lifecycle status |
| filing_county | TEXT | NOT NULL | Target county for filing |
| court_number | TEXT | NULL | Target court |
| filing_type | TEXT | NOT NULL, CHECK (filing_type IN ('initial','subsequent','responsive','post_judgment')) | Filing category |
| attorney_approved_by | UUID | NULL, FK -> users(id) | Attorney who approved for filing |
| attorney_approved_at | TIMESTAMPTZ | NULL | When attorney approved |
| submitted_at | TIMESTAMPTZ | NULL | When submitted to court/e-filing |
| accepted_at | TIMESTAMPTZ | NULL | When accepted by court clerk |
| rejected_at | TIMESTAMPTZ | NULL | When rejected by court clerk |
| rejection_reason | TEXT | NULL | Clerk's rejection reason |
| notes | TEXT | NULL | Filing notes |
| assembled_by | UUID | NOT NULL, FK -> users(id) | Paralegal who assembled the packet |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### filing_packet_items

Individual documents within a filing packet, with ordering and role.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Row identifier |
| filing_packet_id | UUID | NOT NULL, FK -> filing_packets(id) | Parent packet |
| document_id | UUID | NOT NULL, FK -> documents(id) | The document |
| document_version_id | UUID | NOT NULL, FK -> document_versions(id) | Specific version included |
| sort_order | INTEGER | NOT NULL | Order within the packet |
| item_role | TEXT | NOT NULL, CHECK (item_role IN ('lead_document','exhibit','attachment','proposed_order','certificate_of_service','cover_sheet','other')) | Role of this item in the filing |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |

### filing_events

Audit trail of filing activity: submission attempts, acceptance, rejection, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique event identifier |
| filing_packet_id | UUID | NOT NULL, FK -> filing_packets(id) | Associated packet |
| event_type | TEXT | NOT NULL, CHECK (event_type IN ('assembled','submitted','accepted','rejected','corrected','resubmitted','withdrawn')) | What happened |
| event_data | JSONB | NOT NULL, DEFAULT '{}' | Structured event details (e.g., envelope ID, confirmation number) |
| performed_by | UUID | NOT NULL, FK -> users(id) | Who performed the action |
| notes | TEXT | NULL | Event-specific notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the event occurred |

### service_records

Proof of service tracking for documents served on parties.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique service record identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| document_id | UUID | NOT NULL, FK -> documents(id) | Document that was served |
| served_on_contact_id | UUID | NOT NULL, FK -> contacts(id) | Who was served |
| service_method | TEXT | NOT NULL, CHECK (service_method IN ('personal','substituted','certified_mail','regular_mail','e_service','publication','waiver','other')) | How service was accomplished |
| served_at | TIMESTAMPTZ | NULL | When service was accomplished |
| served_by | TEXT | NULL | Name of process server or method detail |
| return_received | BOOLEAN | NOT NULL, DEFAULT false | Whether return/proof has been received |
| return_received_at | TIMESTAMPTZ | NULL | When return was received |
| file_asset_id | UUID | NULL, FK -> file_assets(id) | Scanned proof of service document |
| notes | TEXT | NULL | Service notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

---

## Section 8: Discovery and Evidence

### discovery_requests

Discovery requests sent or received. Tracks interrogatories, requests for production, requests for admission, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique request identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| direction | TEXT | NOT NULL, CHECK (direction IN ('outgoing','incoming')) | Whether we sent or received |
| discovery_type | TEXT | NOT NULL, CHECK (discovery_type IN ('interrogatories','requests_for_production','requests_for_admission','deposition_notice','subpoena','other')) | Type of discovery |
| title | TEXT | NOT NULL | Request title/set number |
| served_on_contact_id | UUID | NULL, FK -> contacts(id) | Who it was served on (outgoing) |
| received_from_contact_id | UUID | NULL, FK -> contacts(id) | Who sent it (incoming) |
| served_date | DATE | NULL | Date served |
| response_due_date | DATE | NULL | Statutory or agreed response deadline |
| status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending','in_progress','completed','overdue','objected','extended')) | Current status |
| document_id | UUID | NULL, FK -> documents(id) | The actual discovery document |
| notes | TEXT | NULL | Notes |
| created_by | UUID | NOT NULL, FK -> users(id) | Who entered the record |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### discovery_responses

Responses to discovery requests.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique response identifier |
| discovery_request_id | UUID | NOT NULL, FK -> discovery_requests(id) | The request being responded to |
| response_date | DATE | NULL | Date response was served |
| status | TEXT | NOT NULL, DEFAULT 'drafting', CHECK (status IN ('drafting','in_review','served','supplemented','deficient')) | Response status |
| document_id | UUID | NULL, FK -> documents(id) | The response document |
| deficiency_notes | TEXT | NULL | Notes on deficiencies if applicable |
| created_by | UUID | NOT NULL, FK -> users(id) | Who created the response record |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### discovery_items

Individual items within a discovery request or response (e.g., each interrogatory, each document requested).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique item identifier |
| discovery_request_id | UUID | NOT NULL, FK -> discovery_requests(id) | Parent request |
| item_number | INTEGER | NOT NULL | Sequential item number within the set |
| description | TEXT | NOT NULL | The request text |
| response_text | TEXT | NULL | The response text |
| objection_text | TEXT | NULL | Objection if any |
| status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending','answered','objected','partially_answered','supplemented')) | Item-level status |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### evidence_items

Cataloged evidence for a matter: exhibits, financial records, communications, photographs, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique evidence item identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| exhibit_number | TEXT | NULL | Exhibit designation (e.g., 'P-1', 'R-3') |
| title | TEXT | NOT NULL | Evidence item title |
| description | TEXT | NULL | Description of what this evidence shows |
| evidence_type | TEXT | NOT NULL, CHECK (evidence_type IN ('document','photograph','financial_record','communication','recording','physical','expert_report','other')) | Type of evidence |
| source | TEXT | NULL | Where this evidence came from |
| date_obtained | DATE | NULL | When the evidence was obtained |
| file_asset_id | UUID | NULL, FK -> file_assets(id) | Digital copy |
| is_admitted | BOOLEAN | NOT NULL, DEFAULT false | Whether admitted by the court |
| admitted_at | TIMESTAMPTZ | NULL | When admitted |
| notes | TEXT | NULL | Notes |
| created_by | UUID | NOT NULL, FK -> users(id) | Who cataloged this item |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

---

## Section 9: Communications, Portal, and Financials

### communication_threads

Threaded communication channels associated with matters or leads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique thread identifier |
| matter_id | UUID | NULL, FK -> matters(id) | Associated matter (null for pre-matter communication) |
| lead_id | UUID | NULL, FK -> leads(id) | Associated lead (null for matter-level threads) |
| subject | TEXT | NOT NULL | Thread subject |
| channel | TEXT | NOT NULL, CHECK (channel IN ('internal','client_portal','email','phone_log','text_log')) | Communication channel |
| is_privileged | BOOLEAN | NOT NULL, DEFAULT false | Whether this thread is attorney-client privileged |
| created_by | UUID | NOT NULL, FK -> users(id) | Thread creator |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### communication_messages

Individual messages within a communication thread.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique message identifier |
| thread_id | UUID | NOT NULL, FK -> communication_threads(id) | Parent thread |
| sender_user_id | UUID | NULL, FK -> users(id) | Staff sender (null if from portal client) |
| sender_portal_access_id | UUID | NULL, FK -> portal_access(id) | Portal client sender (null if from staff) |
| body | TEXT | NOT NULL | Message body |
| is_read | BOOLEAN | NOT NULL, DEFAULT false | Whether recipient has read the message |
| read_at | TIMESTAMPTZ | NULL | When it was read |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |

### portal_access

Client portal accounts. Separate from staff users for security isolation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique portal access identifier |
| contact_id | UUID | NOT NULL, FK -> contacts(id) | The client contact |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Matter they have portal access to |
| email | TEXT | NOT NULL | Portal login email |
| password_hash | TEXT | NOT NULL | bcrypt-hashed portal password |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Whether portal access is active |
| invited_by | UUID | NOT NULL, FK -> users(id) | Staff member who sent the invitation |
| invited_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When invitation was sent |
| accepted_at | TIMESTAMPTZ | NULL | When client first logged in |
| last_login_at | TIMESTAMPTZ | NULL | Most recent portal login |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

**Unique constraint**: `(contact_id, matter_id)` — one portal account per contact per matter.

### financial_entries

Financial transactions associated with a matter: retainer payments, fee entries, cost entries, trust accounting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique financial entry identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| entry_type | TEXT | NOT NULL, CHECK (entry_type IN ('retainer_deposit','fee','cost','payment','refund','trust_deposit','trust_disbursement','write_off')) | Type of financial entry |
| amount | NUMERIC(12,2) | NOT NULL | Dollar amount (positive for credits, negative for debits from client perspective) |
| description | TEXT | NOT NULL | Description of the charge or payment |
| date | DATE | NOT NULL | Transaction date |
| category | TEXT | NULL | Sub-category (e.g., 'filing_fee', 'service_fee', 'attorney_time', 'paralegal_time') |
| hours | NUMERIC(6,2) | NULL | Hours billed (for time-based entries) |
| rate | NUMERIC(8,2) | NULL | Hourly rate applied |
| entered_by | UUID | NOT NULL, FK -> users(id) | Who entered the record |
| approved_by | UUID | NULL, FK -> users(id) | Who approved (for entries requiring approval) |
| approved_at | TIMESTAMPTZ | NULL | When approved |
| invoice_number | TEXT | NULL | Associated invoice number |
| notes | TEXT | NULL | Notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### settlement_proposals

Settlement offers and counter-offers tracked through negotiation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique proposal identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| direction | TEXT | NOT NULL, CHECK (direction IN ('outgoing','incoming')) | Whether we sent or received |
| proposal_date | DATE | NOT NULL | Date of the proposal |
| status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending','accepted','rejected','countered','expired','withdrawn')) | Current status |
| summary | TEXT | NOT NULL | Summary of terms |
| terms | JSONB | NOT NULL, DEFAULT '{}' | Structured settlement terms (property division, support, custody, etc.) |
| document_id | UUID | NULL, FK -> documents(id) | Formal proposal document |
| responded_at | TIMESTAMPTZ | NULL | When a response was given |
| response_proposal_id | UUID | NULL, FK -> settlement_proposals(id) | Link to counter-proposal if countered |
| notes | TEXT | NULL | Internal notes |
| created_by | UUID | NOT NULL, FK -> users(id) | Who entered this record |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

---

## Section 10: Orders, Compliance, Audit

### orders

Court orders entered in a matter.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique order identifier |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| order_type | TEXT | NOT NULL, CHECK (order_type IN ('temporary_restraining','temporary_orders','final_decree','modification','enforcement','protective','agreed','other')) | Type of order |
| title | TEXT | NOT NULL | Order title |
| signed_date | DATE | NULL | Date signed by judge |
| effective_date | DATE | NULL | When the order takes effect |
| expiration_date | DATE | NULL | When the order expires (for TROs, protective orders) |
| document_id | UUID | NULL, FK -> documents(id) | The signed order document |
| status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending','signed','effective','expired','superseded','vacated')) | Order status |
| notes | TEXT | NULL | Notes |
| created_by | UUID | NOT NULL, FK -> users(id) | Who entered the record |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### compliance_items

Specific obligations from court orders that must be tracked for compliance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique compliance item identifier |
| order_id | UUID | NOT NULL, FK -> orders(id) | Originating order |
| matter_id | UUID | NOT NULL, FK -> matters(id) | Parent matter |
| obligated_contact_id | UUID | NOT NULL, FK -> contacts(id) | Who must comply |
| description | TEXT | NOT NULL | What must be done |
| compliance_type | TEXT | NOT NULL, CHECK (compliance_type IN ('one_time','recurring','ongoing','conditional')) | Nature of the obligation |
| due_date | DATE | NULL | When compliance is due (for one-time items) |
| recurrence_rule | TEXT | NULL | Recurrence pattern (e.g., '1st and 15th monthly') |
| status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending','compliant','non_compliant','waived','modified')) | Compliance status |
| verified_by | UUID | NULL, FK -> users(id) | Who verified compliance |
| verified_at | TIMESTAMPTZ | NULL | When compliance was verified |
| notes | TEXT | NULL | Notes |
| created_by | UUID | NOT NULL, FK -> users(id) | Who entered the item |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification time |

### audit_events

Immutable audit trail of all significant actions in the system. This table is append-only; rows are never updated or deleted.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique audit event identifier |
| event_type | TEXT | NOT NULL | Action category (e.g., 'matter.created', 'document.approved', 'user.login', 'filing.submitted') |
| actor_type | TEXT | NOT NULL, CHECK (actor_type IN ('user','portal_client','system')) | Who performed the action |
| actor_id | UUID | NOT NULL | ID of the actor (user ID, portal_access ID, or system UUID) |
| resource_type | TEXT | NOT NULL | Table/entity affected (e.g., 'matter', 'document', 'filing_packet') |
| resource_id | UUID | NOT NULL | ID of the affected resource |
| matter_id | UUID | NULL | Matter context (for cross-reference) |
| changes | JSONB | NOT NULL, DEFAULT '{}' | Before/after values for changed fields |
| metadata | JSONB | NOT NULL, DEFAULT '{}' | Additional context (IP address, user agent, session ID) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the event occurred |

**No updated_at or deleted_at** — this table is append-only by design.

**Index**: `idx_audit_events_resource` on `(resource_type, resource_id)`, `idx_audit_events_actor` on `(actor_type, actor_id)`, `idx_audit_events_matter` on `(matter_id)`, `idx_audit_events_created` on `(created_at)`

### file_assets

Physical file storage records. All uploaded or generated files are tracked here. Actual files are stored in S3-compatible object storage; this table holds metadata and signed URL generation data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique file asset identifier |
| storage_key | TEXT | NOT NULL, UNIQUE | Object storage key (path in S3 bucket) |
| original_filename | TEXT | NOT NULL | Original filename at upload |
| content_type | TEXT | NOT NULL | MIME type |
| size_bytes | BIGINT | NOT NULL | File size in bytes |
| checksum_sha256 | TEXT | NOT NULL | SHA-256 hash of file contents for integrity verification |
| uploaded_by_user_id | UUID | NULL, FK -> users(id) | Staff uploader |
| uploaded_by_portal_id | UUID | NULL, FK -> portal_access(id) | Portal client uploader |
| virus_scan_status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (virus_scan_status IN ('pending','clean','infected','error')) | Virus scan result |
| virus_scanned_at | TIMESTAMPTZ | NULL | When virus scan completed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Row creation time |

**No updated_at** — file assets are immutable once created. New versions create new file_asset rows.

---

## Index Strategy

Beyond primary keys and unique constraints defined above, the following indexes are recommended:

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| idx_matters_status | matters | (status) WHERE deleted_at IS NULL | Filter active matters by status |
| idx_matters_cause_number | matters | (cause_number) WHERE cause_number IS NOT NULL | Look up by cause number |
| idx_matters_county | matters | (county) | County-based filtering |
| idx_matter_parties_matter | matter_parties | (matter_id) | Party lookup by matter |
| idx_matter_parties_contact | matter_parties | (contact_id) | Matter lookup by contact (conflict checks) |
| idx_documents_matter | documents | (matter_id) WHERE deleted_at IS NULL | Document listing per matter |
| idx_documents_status | documents | (status) WHERE deleted_at IS NULL | Filter by document lifecycle |
| idx_tasks_assigned | tasks | (assigned_to, status) | Task queue per user |
| idx_deadlines_due | deadlines | (due_date) WHERE status = 'active' | Upcoming deadline queries |
| idx_calendar_events_range | calendar_events | (start_at, end_at) | Calendar range queries |
| idx_filing_packets_matter | filing_packets | (matter_id) | Filing lookup per matter |
| idx_leads_status | leads | (status) WHERE deleted_at IS NULL | Lead pipeline filtering |
| idx_contacts_name | contacts | (last_name, first_name) WHERE deleted_at IS NULL | Name search |
| idx_financial_entries_matter | financial_entries | (matter_id) | Financial summary per matter |

---

## Migration Discipline

1. Every schema change starts with updating this document.
2. The Prisma schema file (`/database/schema/schema.prisma`) must match this canon exactly.
3. Migrations are generated via `prisma migrate dev` and committed to `/database/migrations/`.
4. Production migrations require attorney sign-off for changes to filing, order, or compliance tables.
5. Destructive changes (column removal, type narrowing) require a two-phase migration: deprecate, then remove after confirming no references.
