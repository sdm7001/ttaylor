# New Staff Onboarding Guide -- Ttaylor Family Law Platform

**Last Updated**: 2026-04-21
**Audience**: New staff members (paralegals, legal assistants, receptionists, attorneys)

---

## 1. System Overview

The Ttaylor platform is a web-based case management system purpose-built for Texas family law. It tracks every matter from initial client contact through final order, with built-in controls that ensure legal compliance and attorney oversight at every step.

### What the Platform Manages

- **Leads and intake**: New client inquiries, conflict checks, consultation scheduling
- **Matters**: Active cases with documents, deadlines, checklists, and contacts
- **Documents**: Generate from templates, submit for attorney review, track approval status
- **Filing packets**: Assemble court filings with required documents, validated for Harris County
- **Calendar**: Court dates, hearings, statutory deadlines with automatic calculations
- **Financial**: Invoices, payments, trust ledger entries
- **Client portal**: Clients view their matter status, download shared documents, send messages
- **Audit trail**: Every action is logged for compliance and accountability

### The 8 Phases of a Matter Lifecycle

1. **Lead Pending** -- Initial inquiry received, basic information captured
2. **Conflict Review** -- Automated conflict check against existing parties
3. **Consultation Completed** -- Attorney met with prospective client
4. **Retained** -- Engagement letter signed, matter formally opened
5. **Open Active** -- Active case work: discovery, motions, negotiations
6. **Awaiting Filing** -- Filing packet assembled and awaiting court submission
7. **Awaiting Service** -- Filed documents being served on opposing party
8. **Closed** -- Matter resolved (dismissed, settled, final order entered)

Not every matter passes through every phase. The system enforces valid transitions (e.g., you cannot move directly from Lead Pending to Closed).

---

## 2. Staff Roles

| Role | What You Can Do | What You Cannot Do |
|------|-----------------|-------------------|
| **ATTORNEY** | Everything. Approve documents, approve filing packets, create orders, manage users. | Nothing is restricted. |
| **PARALEGAL** | Create matters, draft documents, assemble filing packets, manage calendar, run conflict checks. | Approve documents, approve filing packets, create final orders. These require attorney sign-off. |
| **LEGAL_ASSISTANT** | View matters, upload documents, add calendar entries, manage contacts. | Create new matters, approve anything, modify filing packets. |
| **RECEPTIONIST** | Create leads, schedule consultations, view matter summaries. | Access documents, financial records, or filing details. |
| **ADMIN** | Manage users, roles, templates, and system settings. Full application access. | Approve legal documents (unless also an attorney). Admin is an IT/operations role. |

If you try to do something your role does not permit, the system will show an "Insufficient permissions" message. Ask your supervisor if you believe your role needs adjustment.

---

## 3. First Day: Logging In and Navigating

### 3.1 Signing In

1. Open your browser and go to **staff.ttaylorlegal.com**.
2. Click "Sign In".
3. Enter the email address your administrator registered for you.
4. Enter your password (or check your email for a sign-in link if this is your first time).
5. You will land on the **Dashboard**.

### 3.2 The Sidebar

The left sidebar is your main navigation. Sections visible depend on your role:

| Sidebar Section | What It Shows |
|----------------|---------------|
| **Dashboard** | Your assigned matters, upcoming deadlines, recent activity |
| **Leads** | New client inquiries and intake pipeline |
| **Matters** | All active and closed matters |
| **Calendar** | Court dates, deadlines, appointments |
| **Documents** | Document templates and pending reviews |
| **Filing** | Filing queue and packet assembly |
| **Contacts** | Parties, attorneys, courts, mediators |
| **Finance** | Invoices, payments, trust ledger |
| **Reports** | Caseload, financial, and activity reports |
| **Admin** | User management, settings, templates (ADMIN role only) |

### 3.3 Your Dashboard

The Dashboard shows:
- **My Assigned Matters** -- matters where you are a team member
- **Upcoming Deadlines** -- calendar items due in the next 7 days
- **Recent Activity** -- latest actions across your matters (documents filed, statuses changed, etc.)

Click any item to navigate directly to it.

---

## 4. Creating a New Intake

This process is typically performed by a **Receptionist** or **Paralegal**.

### Step-by-Step

1. Go to **Leads** in the sidebar.
2. Click **"New Lead"** in the top-right corner.
3. Fill in the intake form:
   - **Client name** (first and last)
   - **Phone number** and **email**
   - **Matter type** (e.g., Uncontested Divorce, SAPCR, Modification)
   - **Opposing party name** (for conflict check)
   - **Referral source** (how they found the firm)
   - **Brief description** of their situation
4. Click **"Submit Lead"**.
5. The system automatically runs a **conflict check** against existing parties in the database.
   - If a potential conflict is found, the lead status changes to **Conflict Review** and a notification is sent to the assigned attorney.
   - If no conflict is found, the lead proceeds to **Intake Pending**.
6. Schedule a consultation by clicking **"Schedule Consultation"** on the lead detail page.
7. After the consultation, the attorney marks the lead as **Retained** or **Declined**.
8. If retained, the system creates a new **Matter** automatically.

---

## 5. Working with Documents

### 5.1 Generating a Document from a Template

1. Open the matter you are working on.
2. Click the **"Documents"** tab.
3. Click **"Generate from Template"**.
4. Select the template (e.g., "Original Petition for Divorce -- Uncontested").
5. The system pre-fills template variables from the matter data (party names, case number, county, etc.).
6. Review the generated document. Edit any fields that need adjustment.
7. Click **"Save Draft"**.

### 5.2 Submitting for Attorney Review

1. On the document detail page, click **"Submit for Review"**.
2. Select the reviewing attorney from the dropdown.
3. Add any notes for the attorney (e.g., "Client requested 50/50 possession schedule").
4. Click **"Submit"**.
5. The document status changes to **Pending Review**. The attorney receives a notification.

### 5.3 Attorney Approval Workflow

Only users with the **ATTORNEY** role can approve documents. This gate is enforced at the API layer and cannot be bypassed through the interface.

When you are an attorney reviewing a document:

1. Go to **Documents** in the sidebar, or click the notification.
2. Open the document marked **Pending Review**.
3. Review the content.
4. Click **"Approve"** to mark it ready for filing, or **"Request Changes"** with notes for the drafter.
5. Approved documents become available for inclusion in filing packets.

---

## 6. Filing Packets

A filing packet is a collection of documents assembled for submission to the court.

### 6.1 Assembling a Packet

1. Open the matter.
2. Click the **"Filing"** tab.
3. Click **"Create Filing Packet"**.
4. Select the packet type (e.g., "Original Petition", "Motion to Modify").
5. Add documents to the packet:
   - The system shows all **approved** documents for this matter.
   - Select each document to include.
   - Designate one document as the **lead document** (required).
6. The system validates the packet against Harris County requirements:
   - Lead document is present
   - All documents are attorney-approved
   - Required cover sheet fields are populated
7. If validation passes, click **"Submit for Attorney Review"**.

### 6.2 Attorney Review of Filing Packets

Only attorneys can approve a filing packet for submission. This is the final gate before the packet enters the filing queue.

1. Attorney opens the filing packet from the **Filing** section or notification.
2. Reviews included documents and cover sheet.
3. Clicks **"Approve for Filing"** or **"Return for Revision"**.
4. Approved packets move to the filing queue.

### 6.3 Filing Queue

The filing queue shows all approved packets waiting for submission to the court. In the current phase, actual e-filing (eFileTexas/Odyssey integration) is a placeholder BullMQ job. Packets are manually filed until the e-filing API is connected.

---

## 7. Using the Calendar

### 7.1 Adding a Court Date

1. Open the matter.
2. Click the **"Calendar"** tab.
3. Click **"Add Event"**.
4. Select event type: **Hearing**, **Trial**, **Mediation**, **Deposition**, or **Deadline**.
5. Enter date, time, location (court name and room number).
6. Click **"Save"**.

### 7.2 Automatic Deadline Calculation

When you add certain events, the system automatically calculates related deadlines based on the Texas Family Code and local rules:

| Event | Auto-Generated Deadlines |
|-------|--------------------------|
| Trial date set | Discovery cutoff (30 days before), expert designation (90 days before), exhibit exchange (14 days before) |
| Hearing scheduled | Response deadline (if motion), notice period |
| Mediation scheduled | Mediation statement due (7 days before) |

Auto-calculated deadlines appear in the calendar with a clock icon. You can adjust them if the court orders different dates.

### 7.3 Calendar Views

- **My Calendar** -- only events for matters assigned to you
- **Firm Calendar** -- all events across all matters (attorneys and admin only)
- **Matter Calendar** -- events for a specific matter (within the matter detail page)

---

## 8. Client Portal

### 8.1 Granting Client Access

1. Open the matter.
2. Click the **"Client Portal"** tab.
3. Click **"Grant Portal Access"**.
4. Enter the client's email address.
5. The client receives an email invitation with a magic link to create their portal account.

### 8.2 What Clients See

Clients in the portal can:
- View their matter status and current phase
- See shared documents (only documents you explicitly share)
- Download shared documents
- Send messages to their legal team
- View upcoming calendar events marked as "visible to client"

Clients **cannot**:
- Edit any matter data
- See internal notes or draft documents
- See financial details (unless specifically shared)
- Access any other client's matters

### 8.3 Sharing Documents with Clients

1. Open the document in the matter's Documents tab.
2. Click **"Share with Client"**.
3. The document becomes visible in the client's portal view.
4. Clients receive a notification that a new document is available.

### 8.4 Client Messages

Messages from clients appear in the matter's **"Messages"** tab. All staff assigned to the matter can see and respond to client messages. Responses are visible to the client in their portal.

---

## 9. Getting Help

### Technical Issues

| Issue | Who to Contact |
|-------|---------------|
| Cannot sign in | Ask your office administrator to check your Clerk account |
| System is slow or unresponsive | Contact the IT administrator |
| Error messages on screen | Take a screenshot and email it to the IT administrator |
| Data looks wrong or missing | Contact a Paralegal or Admin to investigate |

### Training Resources

- This onboarding guide (bookmark it)
- The firm's internal procedures manual (for legal process questions, not software)
- Ask a senior paralegal -- they have used the system the longest

### Feature Requests and Bug Reports

If you notice something that could work better, or find a bug:

1. Write down exactly what you did, what you expected, and what happened instead.
2. Include a screenshot if possible.
3. Send it to the IT administrator.

Your feedback makes the system better for everyone.
