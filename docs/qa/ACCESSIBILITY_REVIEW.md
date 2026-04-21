# Accessibility Review -- Ttaylor Family Law Platform

**Date**: 2026-04-21
**Reviewer**: Coder Agent (static code analysis)
**Standard**: WCAG 2.1 Level AA
**Scope**: @ttaylor/ui component library and staff-web/client-portal page structure

---

## 1. Current Implementation -- What Is Correct

### Semantic HTML Structure

- **DataTable** uses proper `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` structure. Screen readers can navigate table cells correctly.
- **PageHeader** uses `<h1>` elements for page titles. Heading hierarchy is maintained.
- **Button** uses native `<button>` elements (not `<div onClick>`). Keyboard focus and activation work by default.
- **Card** uses `<div>` with visual styling only -- appropriate since cards are presentational containers, not interactive landmarks.
- **Forms** use native `<input>`, `<select>`, `<textarea>` elements with associated `<label>` elements in most cases.
- **LoadingSpinner** has `aria-label="Loading"` -- screen readers announce loading state.

### Keyboard Navigation

- All interactive elements (buttons, inputs, links) are focusable via Tab key by default (native HTML elements).
- The sidebar navigation uses `<a>` tags with `href` attributes -- standard keyboard navigation works.
- DataTable rows with click handlers also use navigation links, not div-only click targets.

---

## 2. Identified Gaps

### GAP-A1: StatusPill relies on color alone (WCAG 1.4.1 -- Use of Color)

**Severity**: FAIL
**Component**: `packages/ui/src/StatusPill.tsx`
**Issue**: Status indicators use background color as the sole differentiator between states (e.g., green for ACTIVE, red for OVERDUE, amber for PENDING). Users with color vision deficiency cannot distinguish states.
**Remediation**: Add visually-hidden text or `aria-label` with the status name. The visible text inside the pill already contains the status string in most usages, but when used as a standalone indicator (no visible text), an `aria-label` is required.

### GAP-A2: Icon-only buttons missing accessible labels (WCAG 4.1.2 -- Name, Role, Value)

**Severity**: FAIL
**Location**: Matter detail action buttons, filing detail toolbar, audit log filter controls
**Issue**: Several buttons render only an icon (e.g., Lucide `Plus`, `Trash2`, `ChevronDown`) without visible text or `aria-label`. Screen readers announce these as "button" with no description.
**Remediation**: Add `aria-label` to every icon-only button. Example: `<button aria-label="Add document"><Plus /></button>`

### GAP-A3: Form error states missing aria-describedby (WCAG 1.3.1 -- Info and Relationships)

**Severity**: MODERATE
**Location**: New Matter form, New Contact form, GenerateDocumentDialog
**Issue**: Validation error messages appear visually near their associated inputs but are not programmatically linked. Screen readers do not announce error messages when the user focuses the invalid input.
**Remediation**: Add `aria-describedby` pointing to the error message element ID. Add `aria-invalid="true"` to inputs in error state.

### GAP-A4: Dialog/Modal components missing ARIA attributes (WCAG 4.1.2)

**Severity**: MODERATE
**Location**: GenerateDocumentDialog, confirmation dialogs
**Issue**: Modal dialogs are implemented as positioned overlays but lack `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the dialog title. Focus is not trapped within the dialog when open.
**Remediation**: Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to dialog container. Implement focus trap (trap focus within dialog on open, return focus to trigger on close).

### GAP-A5: No skip-to-main-content link (WCAG 2.4.1 -- Bypass Blocks)

**Severity**: MODERATE
**Location**: `apps/staff-web/src/app/(dashboard)/layout.tsx`, `apps/client-portal/src/app/(portal)/layout.tsx`
**Issue**: The sidebar has 10+ navigation links. Keyboard users must tab through all of them to reach main content on every page load.
**Remediation**: Add a visually-hidden "Skip to main content" link as the first focusable element in the layout, targeting `<main id="main-content">`.

### GAP-A6: Tab component focus management (WCAG 2.1.1 -- Keyboard)

**Severity**: MODERATE
**Location**: Matter detail page (8 tabs: Overview, Parties, Documents, Checklist, Calendar, Filing, Notes, Financial)
**Issue**: Tabs are implemented as buttons that toggle content visibility. Arrow key navigation between tabs is not implemented. Tab panels do not have `role="tabpanel"` or `aria-labelledby` linking back to their tab.
**Remediation**: Implement WAI-ARIA Tabs pattern: `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on each panel, `aria-selected` on active tab, arrow key navigation between tabs.

### GAP-A7: Insufficient color contrast in some status pills (WCAG 1.4.3 -- Contrast)

**Severity**: NEEDS VERIFICATION
**Component**: `packages/ui/src/StatusPill.tsx`
**Issue**: Some status pill combinations (light background + white/light text) may not meet the 4.5:1 contrast ratio for normal text. The amber and green backgrounds with dark text likely pass, but the specific hex values need measurement.
**Remediation**: Verify each color combination with a contrast checker. Adjust text color or background to meet 4.5:1 minimum.

### GAP-A8: Data table sort/filter controls not announced (WCAG 4.1.2)

**Severity**: LOW
**Component**: DataTable with sorting
**Issue**: When table columns are sortable, the sort direction is indicated visually (arrow icon) but not announced to screen readers. Column headers acting as sort buttons lack `aria-sort` attribute.
**Remediation**: Add `aria-sort="ascending"`, `aria-sort="descending"`, or `aria-sort="none"` to sortable `<th>` elements.

---

## 3. Summary Assessment

| Category | Status | Notes |
|----------|--------|-------|
| Semantic HTML | PASS | Correct use of table, heading, button, form elements |
| Keyboard access | PARTIAL | Native elements work; tabs and dialogs need enhancement |
| Screen reader support | PARTIAL | Missing aria-labels on icon buttons, missing dialog roles |
| Color independence | FAIL | StatusPill relies on color alone |
| Focus management | FAIL | No focus trap in dialogs, no skip link |
| Error association | FAIL | Form errors not linked via aria-describedby |

**WCAG 2.1 AA Assessment**: PARTIAL COMPLIANCE

The structural foundation is correct -- semantic HTML elements are used throughout, which is the hardest thing to retrofit. The gaps are all in ARIA attribute augmentation and focus management, which are straightforward to add without restructuring components.

---

## 4. Prioritized Remediation

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| 1 | A2: Icon-only button labels | Low (add aria-label to ~15 buttons) | High (screen reader usability) |
| 2 | A1: StatusPill color independence | Low (aria-label on pill component) | High (color-blind users) |
| 3 | A5: Skip-to-main link | Low (single component addition) | Medium (keyboard efficiency) |
| 4 | A3: Form error aria-describedby | Medium (touch all form components) | Medium (form usability) |
| 5 | A4: Dialog ARIA + focus trap | Medium (component refactor) | Medium (modal usability) |
| 6 | A6: Tab ARIA pattern | Medium (tablist implementation) | Medium (matter detail page) |
| 7 | A7: Contrast verification | Low (measurement + adjustment) | Low-Medium (readability) |
| 8 | A8: Table sort announcements | Low (aria-sort attributes) | Low (table navigation) |

**Estimated total effort**: 2-3 developer days to reach full WCAG 2.1 AA compliance.
