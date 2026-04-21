# Design System Specification -- Ttaylor Family Law Paralegal Platform

**Version:** 1.0.0
**Status:** Phase 1 -- Foundation
**Last Updated:** 2026-04-21

---

## Design Philosophy

This is a **legal operations platform**, not a consumer SaaS product. The design language must communicate trust, competence, and restraint. Users are paralegals, attorneys, and legal assistants who spend 8+ hours per day in this interface, managing sensitive legal matters under time pressure.

**Core principles:**

1. **Restrained** -- no decorative elements, no playful illustrations, no rounded-everything. Legal professionals expect seriousness. Visual noise wastes their attention.
2. **High-trust** -- the interface must feel as reliable as a court document. Consistent spacing, predictable layouts, no layout shifts, no ambiguous states.
3. **Information-dense** -- legal work involves cross-referencing many data points simultaneously (party names, dates, statuses, deadlines, document lists). The design prioritizes density over whitespace.
4. **Professional** -- the aesthetic is a well-organized law office, not a startup dashboard. Dark text on light backgrounds, minimal color, strong hierarchy through typography weight rather than color.

**Anti-patterns to avoid:**
- Pastel gradients, glassmorphism, or trendy visual effects
- Excessive whitespace that forces scrolling on data-heavy views
- Color as the primary differentiator (accessibility and legal convention both demand text/icon labeling)
- Rounded cards with large padding (wastes space on matter list views)
- Hamburger menus on desktop (legal users need persistent navigation)

---

## Color Tokens

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#0f172a` (slate-900) | Primary brand color, sidebar background, headings |
| `--color-accent` | `#1565C0` (blue-800) | Interactive elements: links, active states, primary buttons |
| `--color-accent-hover` | `#0D47A1` (blue-900) | Hover state for accent elements |
| `--color-accent-light` | `#E3F2FD` (blue-50) | Light accent backgrounds for selected rows, active nav items |
| `--color-surface` | `#FFFFFF` | Page background, card backgrounds |
| `--color-surface-muted` | `#F8FAFC` (slate-50) | Alternating table rows, secondary panels, page section backgrounds |
| `--color-border` | `#E2E8F0` (slate-200) | All borders: cards, tables, inputs, dividers |
| `--color-border-strong` | `#CBD5E1` (slate-300) | Emphasized borders: focused inputs, table headers |
| `--color-text-primary` | `#0f172a` (slate-900) | Body text, headings, labels |
| `--color-text-secondary` | `#475569` (slate-600) | Helper text, timestamps, metadata, breadcrumbs |
| `--color-text-muted` | `#94A3B8` (slate-400) | Placeholder text, disabled states |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-destructive` | `#DC2626` (red-600) | Delete actions, error states, rejected status |
| `--color-destructive-hover` | `#B91C1C` (red-700) | Hover state for destructive actions |
| `--color-destructive-light` | `#FEF2F2` (red-50) | Error message backgrounds |
| `--color-success` | `#16A34A` (green-600) | Success states, approved/active status |
| `--color-success-light` | `#F0FDF4` (green-50) | Success message backgrounds |
| `--color-warning` | `#D97706` (amber-600) | Warning states, under-review status, approaching deadlines |
| `--color-warning-light` | `#FFFBEB` (amber-50) | Warning message backgrounds |
| `--color-info` | `#2563EB` (blue-600) | Informational badges, filed status |
| `--color-info-light` | `#EFF6FF` (blue-50) | Info message backgrounds |

---

## Typography

### Font Family

**Primary:** Inter (Google Fonts) -- chosen for its readability at small sizes, extensive weight range, and tabular number support (critical for financial data and case numbers).

**Monospace:** JetBrains Mono -- used for cause numbers, filing codes, and reference IDs where character alignment matters.

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `--text-xs` | 12px (0.75rem) | 16px | Fine print, table metadata, timestamps |
| `--text-sm` | 13px (0.8125rem) | 18px | Secondary labels, helper text, breadcrumbs |
| `--text-base` | 14px (0.875rem) | 20px | **Default body text**, table cells, form inputs |
| `--text-md` | 15px (0.9375rem) | 22px | Card titles, sidebar nav labels |
| `--text-lg` | 18px (1.125rem) | 28px | Section headings, dialog titles |
| `--text-xl` | 24px (1.5rem) | 32px | Page titles |
| `--text-2xl` | 30px (1.875rem) | 36px | Dashboard metrics, large numbers |
| `--text-3xl` | 36px (2.25rem) | 40px | Landing page headings (client portal only) |

**Note:** The default body text is 14px, not 16px. Legal interfaces are information-dense; 16px wastes vertical space on table-heavy views. 14px Inter remains highly readable due to Inter's large x-height.

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `--font-regular` | 400 | Body text, table cells, descriptions |
| `--font-medium` | 500 | Form labels, nav items, secondary headings |
| `--font-semibold` | 600 | Card titles, column headers, status badges |
| `--font-bold` | 700 | Page titles, emphasis, primary headings |

---

## Spacing Scale

Base unit: **4px**. All spacing derives from this base.

| Token | Value | Usage Example |
|-------|-------|---------------|
| `--space-1` | 4px | Inline element gap, icon-to-text spacing |
| `--space-2` | 8px | Tight padding (badge interior, compact button padding) |
| `--space-3` | 12px | Input padding, small card padding |
| `--space-4` | 16px | **Default element spacing**, card padding, form field gap |
| `--space-5` | 20px | Section padding (compact) |
| `--space-6` | 24px | Card body padding, modal padding |
| `--space-7` | 32px | Section gap, page section separation |
| `--space-8` | 40px | Large section padding |
| `--space-9` | 48px | Page top/bottom padding |
| `--space-10` | 56px | Major section separation |
| `--space-11` | 64px | Page-level vertical rhythm |
| `--space-12` | 80px | Hero sections (client portal only) |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, small tags, inline elements |
| `--radius-md` | 6px | **Default**: buttons, inputs, dropdowns, cards |
| `--radius-lg` | 8px | Modals, larger cards, panels |
| `--radius-xl` | 12px | Client portal cards, hero elements |

**Design note:** Radii are intentionally restrained. The platform should feel sharp and precise, not soft and playful. 6px on buttons and cards provides just enough rounding to feel modern without approaching consumer-app aesthetics.

---

## Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Default card elevation, dropdowns |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)` | Hovered cards, floating elements |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` | Modals, command palettes, popovers |

---

## Component Specifications

### Button

| Property | Primary | Secondary | Ghost | Destructive |
|----------|---------|-----------|-------|-------------|
| Background | `--color-accent` | `--color-surface` | `transparent` | `--color-destructive` |
| Text | `#FFFFFF` | `--color-text-primary` | `--color-accent` | `#FFFFFF` |
| Border | none | `1px solid --color-border` | none | none |
| Hover BG | `--color-accent-hover` | `--color-surface-muted` | `--color-accent-light` | `--color-destructive-hover` |
| Radius | `--radius-md` | `--radius-md` | `--radius-md` | `--radius-md` |

**Sizes:**

| Size | Height | Padding (h) | Font Size | Icon Size |
|------|--------|-------------|-----------|-----------|
| `sm` | 32px | 12px | `--text-sm` (13px) | 14px |
| `md` | 36px | 16px | `--text-base` (14px) | 16px |
| `lg` | 40px | 20px | `--text-base` (14px) | 18px |

**States:** All buttons show a 2px `--color-accent` focus ring (offset 2px) on keyboard focus. Disabled buttons are 50% opacity with `cursor: not-allowed`.

### Badge / StatusPill

Compact labels used to indicate matter status, document status, and other categorical states.

**Structure:** Inline-flex, `--text-xs` (12px), `--font-semibold` (600), padding `2px 8px`, `--radius-sm` (4px).

**Matter status colors:**

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| `DRAFT` | `#F1F5F9` (slate-100) | `#475569` (slate-600) | `#CBD5E1` (slate-300) |
| `OPEN` | `#DBEAFE` (blue-100) | `#1E40AF` (blue-800) | `#93C5FD` (blue-300) |
| `ACTIVE` | `#DCFCE7` (green-100) | `#166534` (green-800) | `#86EFAC` (green-300) |
| `ON_HOLD` | `#FEF3C7` (amber-100) | `#92400E` (amber-800) | `#FCD34D` (amber-300) |
| `PENDING_CLOSE` | `#F3E8FF` (purple-100) | `#6B21A8` (purple-800) | `#C084FC` (purple-300) |
| `CLOSED` | `#E2E8F0` (slate-200) | `#64748B` (slate-500) | `#CBD5E1` (slate-300) |
| `ARCHIVED` | `#F1F5F9` (slate-100) | `#94A3B8` (slate-400) | `#E2E8F0` (slate-200) |

**Document status colors:**

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| `DRAFT` | `#F1F5F9` (slate-100) | `#475569` (slate-600) | `#CBD5E1` (slate-300) |
| `UNDER_REVIEW` | `#FEF3C7` (amber-100) | `#92400E` (amber-800) | `#FCD34D` (amber-300) |
| `ATTORNEY_APPROVED` | `#DCFCE7` (green-100) | `#166534` (green-800) | `#86EFAC` (green-300) |
| `FILED` | `#DBEAFE` (blue-100) | `#1E40AF` (blue-800) | `#93C5FD` (blue-300) |
| `REJECTED` | `#FEE2E2` (red-100) | `#991B1B` (red-800) | `#FCA5A5` (red-300) |

### Card

- Background: `--color-surface`
- Border: `1px solid --color-border`
- Radius: `--radius-md` (6px)
- Shadow: `--shadow-sm`
- Padding: `--space-6` (24px) body, `--space-4` (16px) header/footer
- Header: bottom border `--color-border`, title in `--text-md` `--font-semibold`
- Hover (if clickable): `--shadow-md`, border color transitions to `--color-border-strong`

### DataTable

The primary data display component. Used for matter lists, document lists, filing queues, financial records.

- **Header row:** Background `--color-surface-muted`, text `--text-xs` `--font-semibold` uppercase, letter-spacing `0.05em`, color `--color-text-secondary`
- **Body rows:** `--text-base`, padding `--space-3` vertical, `--space-4` horizontal
- **Alternating rows:** Even rows `--color-surface`, odd rows `--color-surface-muted`
- **Row hover:** Background `--color-accent-light`
- **Sorting:** Column headers show sort arrow icons. Active sort column header text is `--color-accent`.
- **Filtering:** Filter controls sit above the table in a collapsible bar. Active filters show as removable chips.
- **Pagination:** Below table, right-aligned. Shows rows-per-page selector (10, 25, 50, 100), page navigation, and total count.
- **Empty state:** Centered in table body area, icon + message + optional action button.
- **Loading state:** Skeleton rows matching table structure, 3 rows by default.
- **Row selection:** Checkbox column on the left. Selected rows have `--color-accent-light` background with a left `3px solid --color-accent` border indicator.

### Modal / Dialog

- Overlay: `rgba(0, 0, 0, 0.5)`
- Container: `--color-surface`, `--radius-lg` (8px), `--shadow-lg`
- Max width: `sm` 400px, `md` 560px, `lg` 720px, `xl` 960px
- Padding: `--space-6` (24px)
- Header: `--text-lg` `--font-semibold`, bottom border
- Footer: top border, buttons right-aligned, `--space-3` gap between buttons
- Close button: top-right, ghost icon button
- Focus trap: keyboard focus cannot leave the modal while open
- Escape key: closes the modal (unless destructive confirmation)

### Form

- **Layout:** Label above input, `--space-1` (4px) gap between label and input
- **Label:** `--text-sm` `--font-medium`, color `--color-text-primary`
- **Input:** Height 36px, padding `--space-3` (12px), border `1px solid --color-border`, radius `--radius-md`, `--text-base`
- **Input focus:** Border `--color-accent`, ring `2px solid --color-accent` with 50% opacity
- **Helper text:** Below input, `--text-xs`, color `--color-text-secondary`, `--space-1` gap from input
- **Error state:** Border `--color-destructive`, helper text `--color-destructive`, error icon inline
- **Required indicator:** Red asterisk after label text
- **Field spacing:** `--space-4` (16px) between form fields
- **Section spacing:** `--space-7` (32px) between form sections with a section heading in `--text-md` `--font-semibold`
- **Select:** Same styling as input, with chevron-down icon right-aligned
- **Textarea:** Min height 80px, resizable vertically

### Sidebar Navigation

- **Width:** 224px fixed on desktop, collapsible to 64px (icon-only mode)
- **Background:** `--color-primary` (#0f172a)
- **Text color:** `#CBD5E1` (slate-300) default, `#FFFFFF` active/hover
- **Active item:** Background `rgba(255, 255, 255, 0.1)`, left border `3px solid --color-accent`, text `#FFFFFF`
- **Hover item:** Background `rgba(255, 255, 255, 0.05)`
- **Item height:** 40px, padding `--space-3` left (12px after the active border)
- **Item font:** `--text-md` (15px) `--font-medium`
- **Icon size:** 18px, `--space-3` (12px) gap to label text
- **Section divider:** 1px line `rgba(255, 255, 255, 0.1)`, `--space-3` margin above and below
- **Section label:** `--text-xs` `--font-semibold` uppercase, `--space-2` left padding, color `#64748B` (slate-500)
- **Collapse trigger:** Bottom of sidebar, chevron icon, toggles between full and icon-only mode
- **Mobile:** Full-width overlay from left, 280px wide, backdrop overlay, swipe-to-close

**Navigation groups:**

1. **Main:** Dashboard, Intake/Leads, Matters, Filing Queue
2. **Operations:** Documents, Calendar, Discovery
3. **Finance:** Invoices, Payments, Trust Ledger
4. **Admin:** Users, Roles, Templates, Settings
5. **Reports:** Dashboard Analytics, Matter Reports, Financial Reports

### PageHeader

Top of every page, below the sidebar header.

- **Title:** `--text-xl` (24px) `--font-bold`
- **Breadcrumb:** Above title, `--text-sm`, color `--color-text-secondary`, separator `/`
- **Action buttons:** Right-aligned, same vertical line as title
- **Description:** Optional, below title, `--text-sm`, color `--color-text-secondary`
- **Bottom border:** `1px solid --color-border`, `--space-6` (24px) margin-bottom

### EmptyState

Centered content for views with no data.

- **Icon:** 48px, color `--color-text-muted`
- **Heading:** `--text-lg` `--font-semibold`, `--space-3` below icon
- **Description:** `--text-sm`, color `--color-text-secondary`, max-width 360px, `--space-2` below heading
- **Action button:** Primary variant, `--space-5` below description

### LoadingState

- **Skeleton elements:** Rounded rectangles matching content layout, background animated gradient from `--color-surface-muted` to `--color-border` and back (1.5s ease-in-out infinite)
- **Table skeleton:** 3 rows of skeleton cells matching the table column widths
- **Card skeleton:** Skeleton title bar + 2 skeleton text lines + skeleton action bar
- **Page skeleton:** Sidebar (static) + skeleton PageHeader + skeleton content area

---

## Navigation Model

### Desktop Layout

```
+--------+-------------------------------------------+
|        |  Breadcrumb > Path > Here                 |
| SIDE   |  Page Title              [Action Buttons]  |
| BAR    |  Optional description                      |
| 224px  |-------------------------------------------|
|        |                                            |
| fixed  |  Main Content Area                         |
| left   |  (fluid width, max-width 1440px)           |
|        |                                            |
|        |  Tables, forms, cards, etc.                |
|        |                                            |
+--------+-------------------------------------------+
```

- Sidebar: fixed left, 224px, full viewport height
- Main content: fluid, left margin 224px, max-width 1440px, centered when wider
- Content padding: `--space-7` (32px) horizontal, `--space-6` (24px) vertical
- Breadcrumb navigation on all pages deeper than top-level sections

### Mobile Layout (< 768px)

- Sidebar collapses to hamburger menu (top-left)
- Content takes full width
- Tables become horizontally scrollable or collapse to card view
- Modal becomes full-screen sheet (slides up from bottom)

### Matter Detail Tabs

The matter detail view uses a horizontal tab bar for sub-sections:

| Tab | Content |
|-----|---------|
| Overview | Matter summary: type, status, assigned staff, key dates, recent activity |
| Parties | All contacts associated with this matter: petitioner, respondent, children, opposing counsel, judge |
| Documents | All documents on this matter with status badges, version count, last modified |
| Filing | Filing packets associated with this matter, current status, submission history |
| Checklist | Workflow checklist for this matter type, completion tracking, assignment |
| Calendar | Deadlines, hearings, court dates specific to this matter |
| Discovery | Discovery requests and responses (if applicable to matter type) |
| Financial | Fee agreement, invoices, payments, trust balance for this matter |
| Notes | Internal notes and memos, sorted by date |

Tab bar is sticky below the PageHeader. Active tab has a bottom border `3px solid --color-accent`. Tab labels use `--text-sm` `--font-medium`.

---

## Screen Inventory

### Staff Application

| Screen | Route | Key Components |
|--------|-------|----------------|
| Dashboard / Analytics | `/` | Metric cards (open matters, pending filings, upcoming deadlines, overdue items), recent activity feed, pipeline chart |
| Intake / Leads | `/leads` | DataTable of leads with status filters, new lead button, search |
| Lead Detail | `/leads/[id]` | Lead info card, intake questionnaire, conflict check status, convert-to-matter action |
| Matter List | `/matters` | DataTable with status/type/assignee filters, sort by opened date, search |
| Matter Detail | `/matters/[id]` | Tabbed view (see Matter Detail Tabs above) |
| Document Editor | `/matters/[id]/documents/[docId]` | Rich text editor with template merge, version history sidebar, status workflow actions |
| Filing Queue | `/filing` | DataTable of all filing packets across matters, grouped by status, bulk actions |
| Filing Packet Detail | `/filing/[id]` | Packet contents, document list with approval status, submission history, approve/submit actions |
| Calendar | `/calendar` | Month/week/day view, deadline indicators, hearing slots, matter-linked events |
| Discovery | `/matters/[id]/discovery` | Tabs for requests sent / requests received, tracking deadlines |
| Invoices | `/finance/invoices` | Invoice list, generation, send-to-client action |
| Payments | `/finance/payments` | Payment recording, trust deposit/disbursement |
| Trust Ledger | `/finance/trust` | Per-matter trust account activity, balance tracking |
| User Management | `/admin/users` | Staff list, role assignment, activation/deactivation |
| Template Management | `/admin/templates` | Document template list, editor, merge field catalog |
| Settings | `/admin/settings` | Firm configuration, notification preferences |
| Reports | `/reports` | Report selector, date range, export to CSV/PDF |

### Client Portal

| Screen | Route | Key Components |
|--------|-------|----------------|
| Portal Dashboard | `/portal` | Matter list (client's matters only), recent activity, unread messages count |
| Matter View | `/portal/matters/[id]` | Status summary, shared documents, messaging |
| Document View | `/portal/matters/[id]/documents` | Documents explicitly shared by staff, download links |
| Messages | `/portal/matters/[id]/messages` | Threaded messages with staff, file attachment support |
| Profile | `/portal/profile` | Contact info update, notification preferences |

---

## Accessibility

### WCAG 2.1 AA Compliance

- **Color contrast:** Minimum 4.5:1 ratio for normal text, 3:1 for large text (18px+ or 14px+ bold). All color token combinations have been validated against this threshold.
- **Focus indicators:** All interactive elements show a visible focus ring (2px `--color-accent`, offset 2px) on keyboard focus. Focus rings use `outline` (not `border`) to avoid layout shifts.
- **Keyboard navigation:** All functionality is accessible via keyboard. Tab order follows visual layout. Escape closes modals and dropdowns. Arrow keys navigate within composite widgets (tabs, menus, tables).
- **Screen reader support:** All images have alt text. Icons used alongside text are `aria-hidden`. Icon-only buttons have `aria-label`. Status badges include the status text, not just color.
- **Form accessibility:** All inputs have associated `<label>` elements (via `htmlFor`). Error messages are linked to inputs via `aria-describedby`. Required fields use `aria-required="true"`.
- **Reduced motion:** Animations and transitions respect `prefers-reduced-motion: reduce`. Skeleton loading replaces animated transitions when this preference is set.
- **Touch targets:** Minimum 44x44px touch target for all interactive elements on mobile.
