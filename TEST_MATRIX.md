# Test Matrix — Ttaylor Family Law Paralegal Platform

**Version**: 1.0.0
**Status**: Phase 1 — Master Test Coverage Map
**Last Updated**: 2026-04-20

This document maps every major requirement to its test coverage. All tests must pass before a feature is merged. Priority levels: P0 = must pass for any deploy, P1 = must pass for release, P2 = should pass, may defer with documented rationale.

---

## Section 1: Identity and Access Tests

### 1.1 Role Assignment

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Admin can assign roles to users | Integration | P0 | Call role assignment endpoint with admin credentials; verify user_roles row created | user_roles record exists with correct user_id, role_id, assigned_by |
| Non-admin cannot assign roles | Integration | P0 | Call role assignment endpoint with paralegal credentials | Returns 403; no user_roles row created |
| System roles cannot be deleted | Unit | P0 | Attempt to delete a role where is_system = true | Operation rejected; role persists |
| User can hold multiple roles | Integration | P1 | Assign two different roles to same user | Both user_roles records exist; permissions are union of both roles |
| Duplicate role assignment is rejected | Unit | P1 | Attempt to assign same role twice to same user | Returns conflict error; single row in user_roles |

### 1.2 Permission Checks

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Permissions cascade through roles | Unit | P0 | User with 'attorney' role calls endpoint requiring 'document:approve' | Access granted; action succeeds |
| Missing permission blocks action | API | P0 | User with 'paralegal' role calls endpoint requiring 'filing:submit' without that permission | Returns 403 |
| Permission check is evaluated per-request | Integration | P0 | Revoke a role, then immediately retry the same action | Second request returns 403 |
| Role-permission matrix matches spec | Unit | P0 | For each seeded role, verify exact set of permissions matches SCHEMA_CANON | All permission sets match |

### 1.3 MFA Enforcement

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| User with MFA enabled must provide TOTP | API | P0 | Login with valid password but no TOTP code; mfa_enabled = true | Returns 401 with mfa_required flag |
| Valid TOTP code grants session | API | P0 | Login with valid password + valid TOTP code | Returns session token |
| Expired TOTP code is rejected | API | P0 | Login with TOTP code from 2 windows ago | Returns 401 |
| MFA enrollment flow completes | E2E | P1 | Walk through MFA setup: generate secret, scan QR, confirm code | mfa_enabled flips to true; subsequent logins require TOTP |

### 1.4 Session Expiry

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Session expires after inactivity timeout | API | P0 | Authenticate, wait past configured timeout, make request | Returns 401; session invalid |
| Active sessions extend on activity | API | P1 | Authenticate, make request within timeout window | Session remains valid; expiry extended |
| Logout invalidates session immediately | API | P0 | Authenticate, call logout, retry with same token | Returns 401 |

### 1.5 Portal vs Staff Auth Isolation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Portal token cannot access staff endpoints | API | P0 | Authenticate as portal client, call /api/staff/* endpoint | Returns 403 |
| Staff token cannot access portal-only endpoints | API | P0 | Authenticate as staff, call /api/portal/* endpoint | Returns 403 |
| Portal and staff share no session state | Integration | P0 | Login as both on same browser; verify cookies are scoped to different paths | Sessions are independent |

---

## Section 2: Intake and Conflict Tests

### 2.1 Lead Creation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Intake specialist can create lead | API | P0 | POST /api/leads with valid data and intake_specialist credentials | Lead created with status 'new'; audit_event logged |
| Required fields enforced on lead | Unit | P0 | Attempt lead creation missing first_name | Validation error returned |
| Lead source must be valid enum | Unit | P1 | Attempt lead creation with source = 'carrier_pigeon' | Validation error |
| Lead created with assigned_to | API | P1 | Create lead with assigned_to set | Lead record has correct assigned_to |

### 2.2 Questionnaire Completion

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Questionnaire attaches to lead | API | P0 | POST questionnaire with lead_id | intake_questionnaires record created with correct lead_id |
| Partial completion allowed | API | P1 | Save questionnaire with incomplete responses, completed_at = null | Record saved; completed_at remains null |
| Full completion sets timestamp | API | P0 | Submit questionnaire with all required fields | completed_at set; completed_by set |
| Multiple questionnaire versions per lead | Integration | P1 | Submit two questionnaires for same lead | Both records exist; both linked to same lead_id |

### 2.3 Conflict Check Workflow

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Conflict check required before matter opening | Integration | P0 | Attempt to convert lead to matter with no conflict check | Blocked; returns error indicating conflict check required |
| Clear conflict check allows conversion | Integration | P0 | Run conflict check with result 'clear', then convert lead | Matter created; lead status = 'converted' |
| Found conflict blocks conversion until attorney clears | Integration | P0 | Conflict check with result 'conflict_found', attorney_cleared = false, attempt conversion | Blocked |
| Attorney clearance unblocks conversion | Integration | P0 | Set attorney_cleared = true on conflict with conflict_found, then convert | Matter created successfully |
| Conflict check searches existing contacts | Unit | P0 | Run check with names matching existing matter_parties | conflicts_found array populated with matches |

---

## Section 3: Matter Lifecycle Tests

### 3.1 Matter Opening from Lead

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Lead converts to matter | Integration | P0 | Convert qualified lead with clear conflict check | Matter created; lead.converted_matter_id set; lead.status = 'converted'; matter_parties created for petitioner |
| Matter number auto-generated | Unit | P0 | Create matter | matter_number matches pattern TT-YYYY-NNNNN |
| Default checklist generated | Integration | P0 | Create matter of type 'uncontested_divorce' | checklist_instance created from default template; all template items materialized |
| Initial stage set correctly | Unit | P0 | Create matter | current_stage_id points to first stage (sort_order = 1) for the matter type |

### 3.2 Stage Transitions

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Valid forward transition succeeds | API | P0 | Advance matter from 'intake' to 'drafting' | current_stage_id updated; matter_stage_transitions record created |
| Gated transition blocked by incomplete checklist item | Integration | P0 | Attempt transition past a stage when a stage-gated checklist item is incomplete | Returns error listing blocking items |
| Gated transition succeeds when items complete | Integration | P0 | Complete all gated items, then transition | Transition succeeds |
| Backward transition allowed with reason | API | P1 | Move matter from 'filed' back to 'drafting' with reason | Transition succeeds; reason recorded |
| Transition audit trail complete | Integration | P0 | Perform 3 transitions | matter_stage_transitions has 3 rows with correct from/to/by/reason |

### 3.3 Assignment Changes

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Assign staff to matter | API | P0 | POST assignment for user with assignment_role | matter_assignments record created |
| Remove assignment sets removed_at | API | P0 | Remove active assignment | removed_at set; user no longer appears in active assignments |
| Primary flag enforced per role | Unit | P1 | Assign two lead_paralegals, both is_primary = true | Error or only latest is primary |

### 3.4 Closure and Archival

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Close matter sets closed_at | API | P0 | Set matter status to 'closed' | closed_at timestamp set; status = 'closed' |
| Closed matter blocks new document creation | Integration | P1 | Attempt to create document on closed matter | Returns error |
| Archive matter sets archived_at | API | P1 | Set matter status to 'archived' | archived_at timestamp set |
| Archived matters hidden from default lists | API | P1 | List active matters | Archived matters not included unless explicitly requested |

---

## Section 4: Document Tests

### 4.1 Draft Generation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Generate document from template | Integration | P0 | Select template, provide matter_id, trigger generation | Document created with status 'draft'; merge fields populated from matter data |
| Merge fields resolve correctly | Unit | P0 | Template with {{petitioner.first_name}}, {{cause_number}}, {{county}} | All fields replaced with correct matter data |
| Missing merge field flagged | Unit | P1 | Template references field not available on matter | Warning logged; placeholder left or error returned |
| Generated document has version 1 | Integration | P0 | Generate document | document_versions record created with version_number = 1 |

### 4.2 Review Workflow

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Paralegal can submit for review | API | P0 | Set document status to 'in_review' | Status updated; document_approvals record created with requested_by |
| Only attorneys can approve | API | P0 | Non-attorney attempts to set decision = 'approved' | Returns 403 |
| Attorney approval updates document status | Integration | P0 | Attorney sets decision = 'approved' | document.status = 'approved'; decision_at set |

### 4.3 Rejection Handling

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Attorney rejection sets revision_requested | Integration | P0 | Attorney sets decision = 'revision_requested' with comments | document.status = 'revision_requested'; comments stored |
| Revised document creates new version | Integration | P0 | Upload new version after rejection | New document_version with incremented version_number; current_version_id updated |
| Re-submission goes back to in_review | API | P1 | Resubmit rejected document | Status back to 'in_review'; new document_approvals record |

### 4.4 Version Tracking

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Each save creates a new version | Integration | P0 | Upload 3 revisions | 3 document_version rows; version_numbers 1, 2, 3 |
| Current version pointer accurate | Unit | P0 | After uploading version 3 | document.current_version_id points to version 3 |
| Previous versions remain accessible | API | P1 | Request version 1 after version 3 exists | Version 1 file returned |

---

## Section 5: Filing Packet Tests

### 5.1 Packet Assembly

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Create filing packet | API | P0 | POST filing packet for a matter | Packet created with status 'assembling' |
| Add documents to packet | API | P0 | Add 3 documents as packet items with roles | filing_packet_items created with correct sort_order and item_role |
| Remove document from packet | API | P1 | Remove an item from an assembling packet | Item deleted; remaining items re-orderable |

### 5.2 Lead Document Presence Validation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Packet requires a lead document | Integration | P0 | Attempt to submit packet with no item_role = 'lead_document' | Validation error: "Filing packet must include a lead document" |
| Packet with lead document passes validation | Integration | P0 | Submit packet with at least one lead_document | Validation passes |

### 5.3 Harris County Grouping Rules

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Harris County packets enforce specific document grouping | Integration | P1 | Create packet for Harris County with filing_type = 'initial' | Validation enforces: petition + civil case information sheet + fee waiver or payment grouped together |
| Non-Harris County packets use standard grouping | Integration | P1 | Create packet for Fort Bend County | Standard validation applies |

### 5.4 Attorney Approval Gate

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Packet requires attorney approval before submission | Integration | P0 | Attempt to set status 'submitted' with no attorney approval | Blocked; returns error |
| Attorney approval recorded | API | P0 | Attorney approves packet | attorney_approved_by and attorney_approved_at set |
| Approved packet can be submitted | Integration | P0 | Submit an attorney-approved packet | Status changes to 'submitted'; submitted_at set; filing_event logged |
| Only attorneys can approve packets | API | P0 | Paralegal attempts packet approval | Returns 403 |

### 5.5 Submission and Acceptance

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Submission creates filing event | Integration | P0 | Submit packet | filing_events row with event_type = 'submitted' |
| Acceptance updates packet | API | P0 | Mark packet accepted | Status = 'accepted'; accepted_at set; filing_event logged |
| Acceptance event stores confirmation data | Unit | P1 | Accept with envelope_id and confirmation_number | event_data contains both fields |

### 5.6 Rejection and Correction

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Rejection updates packet status | API | P0 | Mark packet rejected with reason | Status = 'rejected'; rejected_at set; rejection_reason stored |
| Correcting status allows re-assembly | Integration | P1 | Set rejected packet to 'correcting', modify documents, resubmit | Full cycle: rejected -> correcting -> pending_review -> approved -> submitted |
| Rejection creates filing event | Integration | P0 | Reject a packet | filing_events row with event_type = 'rejected' |

---

## Section 6: Checklist and Task Tests

### 6.1 Template Generation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Checklist auto-generates from matter type | Integration | P0 | Create matter of type 'sapcr' | checklist_instance linked to SAPCR default template; all template items materialized as checklist_item_instances |
| Template items preserve sort order | Unit | P0 | Generate checklist from 10-item template | checklist_item_instances sort_order matches template |
| Template items inherit default assignee role | Unit | P1 | Template item with default_assignee_role = 'lead_paralegal' | Instance assigned to matter's lead_paralegal |

### 6.2 Item Completion

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Mark item complete | API | P0 | Set item status to 'completed' | completed_by and completed_at set |
| Completing all items completes checklist | Integration | P0 | Complete every item in a checklist | checklist_instance.status = 'completed' |
| Skip item marks as skipped | API | P1 | Set required item to 'skipped' with authorization | Status = 'skipped'; requires attorney-level permission |

### 6.3 Gating Logic

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Stage-gated item blocks matter transition | Integration | P0 | Item with stage_gate_id = 'filed' stage is incomplete; attempt transition past 'filed' | Transition blocked with list of incomplete gated items |
| Dependency item blocks dependent | Integration | P0 | Item B depends on Item A; attempt to complete B before A | Returns error; B remains 'blocked' |
| Completing dependency unblocks dependent | Integration | P0 | Complete item A | Item B transitions from 'blocked' to 'pending' |

### 6.4 Escalation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Overdue checklist item triggers escalation | Integration | P1 | Item past internal deadline | Notification sent to lead attorney on matter |
| Ad-hoc task overdue triggers notification | Integration | P1 | Task past due_at | Notification to assigned_to and assigned_by |

---

## Section 7: Calendar and Deadline Tests

### 7.1 Event Creation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Create hearing event | API | P0 | POST calendar event with event_type = 'hearing' | Record created with correct start_at, end_at, matter_id |
| All-day event stores correctly | Unit | P1 | Create event with is_all_day = true | is_all_day = true; times handled correctly |
| Event linked to matter | Integration | P0 | Create event on matter | Event appears in matter's calendar view |

### 7.2 Deadline Tracking

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Create court-ordered deadline | API | P0 | POST deadline with deadline_type = 'court_ordered' | Record created; status = 'active' |
| Deadline completion records timestamp | API | P0 | Mark deadline completed | completed_at set; status = 'completed' |
| Overdue deadline detected | Unit | P0 | Query deadlines where due_date < today AND status = 'active' | Overdue deadlines returned |

### 7.3 Reminder Dispatch

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Deadline reminders sent per schedule | Integration | P1 | Deadline with reminder_days_before = {14,7,3,1}; simulate day 7 before | Reminder dispatched |
| Calendar event reminders sent | Integration | P1 | Event with reminder_minutes_before = {1440,60,15}; simulate 60 min before | Reminder dispatched |
| Reminder does not re-send | Unit | P1 | Process reminders twice for same deadline/timepoint | Only one reminder sent |

---

## Section 8: Discovery Tests

### 8.1 Request Tracking

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Create outgoing discovery request | API | P0 | POST discovery request with direction = 'outgoing' | Record created with served_on_contact_id set |
| Create incoming discovery request | API | P0 | POST with direction = 'incoming' | Record created with received_from_contact_id set |
| Response due date calculated from served date | Unit | P1 | Create request served on day X | response_due_date = X + 30 days (Texas default) |
| Overdue discovery flagged | Unit | P0 | Request past response_due_date with status != 'completed' | status = 'overdue' or appears in overdue query |

### 8.2 Response Recording

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Response links to request | API | P0 | Create discovery response for a request | discovery_response.discovery_request_id correct |
| Response status tracks lifecycle | API | P0 | Move response through drafting -> in_review -> served | Status updates correctly at each step |

### 8.3 Deficiency Workflow

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Mark response deficient | API | P1 | Set response status = 'deficient' with deficiency_notes | Status and notes saved |
| Deficient response triggers follow-up task | Integration | P1 | Mark response deficient | Task created assigned to lead_paralegal |
| Supplementation links to original | Integration | P1 | Create supplemental response | status = 'supplemented'; new response record linked |

---

## Section 9: Portal Tests

### 9.1 Client Invitation

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Staff invites client to portal | API | P0 | POST portal_access invitation | portal_access record created; invited_by set; invitation email sent |
| Invitation email contains setup link | Integration | P1 | Trigger invitation | Email body contains unique setup URL |
| Client sets password via invitation | E2E | P0 | Follow setup link, set password | password_hash set; accepted_at set on first login |

### 9.2 Document Upload

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Client uploads document via portal | API | P0 | Authenticated portal client uploads file | file_asset created; document created with type 'client_upload'; linked to correct matter |
| Upload triggers virus scan | Integration | P1 | Upload file | file_asset.virus_scan_status transitions from 'pending' to 'clean' or 'infected' |
| Infected file quarantined | Integration | P1 | Upload file that triggers scan failure | File not accessible; staff notified |

### 9.3 Message Exchange

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Client sends message to staff | API | P0 | Portal client posts message in thread | communication_messages record with sender_portal_access_id set |
| Staff receives and responds | API | P0 | Staff posts reply in same thread | Message with sender_user_id set; portal client can see it |
| Read receipt tracked | API | P1 | Portal client reads staff message | is_read = true; read_at set |

### 9.4 Access Scoping

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Client sees only their matter | API | P0 | Portal client queries matters | Only matter linked to their portal_access returned |
| Client cannot see other clients' documents | API | P0 | Portal client queries documents on another matter | Returns 403 or empty result |
| Client cannot see internal threads | API | P0 | Portal client queries threads with channel = 'internal' | Internal threads excluded |
| Deactivated portal access blocks login | API | P0 | Set is_active = false, attempt login | Returns 401 |

---

## Section 10: Security Tests

### 10.1 Privilege Escalation Attempts

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| User cannot assign themselves roles | API | P0 | User tries to add admin role to their own user_id | Rejected; audit_event logged |
| Paralegal cannot approve documents | API | P0 | Paralegal calls approval endpoint | 403; no approval record created |
| Portal client cannot access staff APIs | API | P0 | Portal token against all /api/staff/* routes | All return 403 |
| Horizontal privilege escalation blocked | API | P0 | User A tries to access User B's matter assignments | 403 or filtered results |

### 10.2 Role Boundary Enforcement

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Each role's effective permissions match spec | Unit | P0 | For each role, enumerate effective permissions, compare against SCHEMA_CANON | Exact match |
| Role removal takes immediate effect | Integration | P0 | Remove attorney role from user, retry attorney-gated action | Action blocked on next request |

### 10.3 Signed URL Expiry

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Signed URL expires after configured TTL | API | P0 | Generate signed URL, wait past TTL, request file | Returns 403 or 410 |
| Signed URL works within TTL | API | P0 | Generate and immediately use signed URL | File returned |
| Signed URL scoped to authorized user | API | P0 | Generate signed URL for User A, use from User B's session | Rejected |

### 10.4 Audit Trail Completeness

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Every create/update/delete generates audit event | Integration | P0 | Perform CRUD on matters, documents, filings | Corresponding audit_events exist for each operation |
| Audit events are immutable | Unit | P0 | Attempt UPDATE or DELETE on audit_events | Operation blocked (no UPDATE/DELETE permissions on table) |
| Audit event captures before/after | Unit | P0 | Update a matter's status | audit_event.changes contains {before: {status: 'active'}, after: {status: 'closed'}} |
| Login attempts audited | Integration | P0 | Successful and failed login | audit_events for both with IP address in metadata |

---

## Section 11: E2E Scenario Tests

### 11.1 Full Uncontested Divorce

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Complete lifecycle from intake to closure | E2E | P0 | Lead creation -> intake questionnaire -> conflict check -> matter opening -> document drafting -> attorney review -> filing packet assembly -> attorney approval -> filing submission -> acceptance -> final decree -> closure | Every stage transition recorded; all checklist items completed; all required documents exist; matter status = 'closed' |

**Detailed steps:**
1. Create lead with source = 'phone'
2. Complete divorce_initial questionnaire
3. Run conflict check -> clear
4. Convert lead to matter (type: uncontested_divorce)
5. Verify checklist auto-generated
6. Generate Original Petition from template
7. Submit for attorney review -> approved
8. Assemble filing packet with petition as lead_document + civil case info sheet
9. Attorney approves packet
10. Submit packet -> accepted
11. Generate Final Decree from template
12. Submit for attorney review -> approved
13. Record signed order
14. Close matter

### 11.2 Full SAPCR (Suit Affecting Parent-Child Relationship)

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| SAPCR lifecycle including children and custody | E2E | P0 | Same flow as divorce with added child records, custody status tracking, and child support calculations | Children linked to matter; custody_status set; employment_records used for support calculation |

### 11.3 Modification

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Modification references existing order | E2E | P1 | Open modification matter -> link to prior order -> draft modification petition -> file | Prior order linked; modification petition references original cause number |

### 11.4 Adoption

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Adoption lifecycle with consent tracking | E2E | P1 | Lead -> matter -> consent documents -> home study tracking -> hearing -> final order | All consent documents tracked; hearing event created; final adoption order recorded |

---

## Section 12: Accessibility and Visual Tests

### 12.1 WCAG 2.1 AA Compliance

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Color contrast meets 4.5:1 ratio | Visual | P0 | Automated scan of all text/background combinations | All text meets WCAG 2.1 AA contrast ratios |
| All interactive elements keyboard accessible | E2E | P0 | Tab through every page; activate every control via keyboard | All buttons, links, form fields reachable and operable |
| Focus indicators visible | Visual | P0 | Tab through UI | Every focused element has visible focus ring (min 2px) |
| Form inputs have labels | E2E | P0 | Check all form fields for associated label elements | Every input has programmatic label (aria-label or <label>) |
| Error messages associated with fields | E2E | P1 | Trigger validation error; verify screen reader announcement | Error message linked to input via aria-describedby |

### 12.2 Legal-Specific Accessibility

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Cause numbers readable by screen readers | Unit | P1 | Cause number rendered in monospace with aria-label | Screen reader reads "Cause number 2026 dash 12345" not individual characters |
| Status badges have text alternatives | Unit | P1 | Check all status badges | Color is not sole indicator; text label present |
| Data tables have proper headers | E2E | P1 | Inspect all data tables | <th> elements present; scope attributes set |
| Modal focus trap works | E2E | P0 | Open confirmation modal; tab through | Focus stays within modal; Escape closes modal |
| Timeline component narrates correctly | E2E | P1 | Navigate matter timeline with screen reader | Each event announced with date, type, and description |

### 12.3 Visual Regression

| Requirement | Test Type | Priority | Test Description | Pass Criteria |
|-------------|-----------|----------|------------------|---------------|
| Dashboard layout matches spec | Visual | P1 | Screenshot comparison of dashboard at 1440px | Less than 0.1% pixel difference from baseline |
| Matter detail page layout stable | Visual | P1 | Screenshot comparison of matter detail | Less than 0.1% pixel difference from baseline |
| Responsive breakpoints render correctly | Visual | P1 | Screenshots at 1440px, 1024px, 768px | Layout adapts per design spec at each breakpoint |
| Dark mode (if implemented) passes contrast | Visual | P2 | All contrast checks in dark mode | Meets WCAG 2.1 AA |

---

## Test Infrastructure

### Tooling

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Vitest | Unit tests | /tests/unit/vitest.config.ts |
| Playwright | E2E and visual tests | /tests/e2e/playwright.config.ts |
| Supertest | API integration tests | Used within Vitest |
| axe-core | Accessibility scanning | Integrated into Playwright |
| Prisma | Test database management | Test database seeded per scenario |

### Test Database Strategy

- Each test suite gets a fresh database via Prisma migrate reset
- Seed scripts in `/database/seeds/` provide realistic data per scenario
- Tests never share mutable state across suites
- Parallel test execution uses isolated database schemas

### CI Requirements

- All P0 tests must pass on every PR
- All P1 tests must pass before release tag
- P2 test failures generate warnings but do not block
- E2E tests run nightly on staging environment
- Visual regression tests run on PRs that modify UI components
