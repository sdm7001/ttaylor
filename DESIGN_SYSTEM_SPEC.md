# Design System Specification — Ttaylor Family Law Paralegal Platform

**Version**: 1.0.0
**Status**: Phase 1 — Foundation
**Last Updated**: 2026-04-20

---

## Section 1: Design Principles

This is a professional legal operations platform, not a consumer SaaS product. Every design decision must serve the people who use this system daily: paralegals managing dozens of matters, attorneys reviewing documents under time pressure, and clients navigating stressful life events.

### 1.1 Professional and Restrained

The interface should feel like a well-organized law office, not a startup dashboard. No gratuitous gradients, no playful illustrations, no rounded-everything. Clean lines, sharp corners (2-4px radius max on cards), neutral backgrounds, and deliberate use of color only where it communicates status or requires attention.

### 1.2 High-Trust

Every interaction must reinforce that this system is reliable. Data must appear stable and complete. Loading states must be explicit. Destructive actions require confirmation. The user should never wonder whether their action was saved or whether the data is current.

### 1.3 Information-Dense

Paralegals work with many matters simultaneously. The interface should show maximum useful information per viewport without feeling cluttered. Dense data tables, compact cards, and persistent navigation are preferred over large whitespace and single-purpose views.

### 1.4 Accessible

WCAG 2.1 AA compliance is mandatory. This is non-negotiable. Contrast ratios, keyboard navigation, screen reader support, and focus management must be correct from day one.

### 1.5 Hierarchy Through Typography and Spacing

Color is reserved for status and urgency. Hierarchy is established through font weight, size, and spacing. Most of the interface is neutral; color draws the eye only where the system needs it.

---

## Section 2: Color Tokens

### 2.1 Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `color-primary-900` | `#0f1929` | Deep navy. Sidebar background, primary navigation. |
| `color-primary-800` | `#1a2740` | Dark slate. Active sidebar item background, card headers on dark. |
| `color-primary-700` | `#243352` | Mid slate. Hover state on sidebar items, secondary dark surfaces. |
| `color-primary-600` | `#2d4066` | Tertiary dark surfaces, borders on dark backgrounds. |
| `color-primary-500` | `#3d567d` | Muted text on dark backgrounds. |

### 2.2 Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `color-accent-blue` | `#1a56db` | Legal blue. Primary actions, links, selected states. |
| `color-accent-blue-light` | `#3b82f6` | Hover state for primary actions. |
| `color-accent-blue-dark` | `#1e40af` | Active/pressed state for primary actions. |
| `color-success` | `#0e7a45` | Success states, approved status, completed items. |
| `color-success-light` | `#d1fae5` | Success badge background. |
| `color-warning` | `#b45309` | Warning states, items needing attention. |
| `color-warning-light` | `#fef3c7` | Warning badge background. |
| `color-danger` | `#991b1b` | Danger states, overdue items, destructive actions. |
| `color-danger-light` | `#fee2e2` | Danger badge background. |

### 2.3 Neutral Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `color-neutral-50` | `#fafafa` | Page background. |
| `color-neutral-100` | `#f4f4f5` | Card background, subtle surface differentiation. |
| `color-neutral-200` | `#e4e4e7` | Borders, dividers. |
| `color-neutral-300` | `#d4d4d8` | Disabled borders, secondary dividers. |
| `color-neutral-400` | `#a1a1aa` | Placeholder text, disabled text. |
| `color-neutral-500` | `#71717a` | Secondary text, metadata. |
| `color-neutral-600` | `#52525b` | Body text (secondary). |
| `color-neutral-700` | `#3f3f46` | Body text (primary). |
| `color-neutral-800` | `#27272a` | Headings, high-emphasis text. |
| `color-neutral-900` | `#18181b` | Maximum contrast text. |

### 2.4 Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `surface-background` | `color-neutral-50` | App background. |
| `surface-card` | `#ffffff` | Card and panel backgrounds. |
| `surface-sidebar` | `color-primary-900` | Sidebar background. |
| `surface-modal-overlay` | `rgba(0, 0, 0, 0.5)` | Modal backdrop. |
| `surface-modal` | `#ffffff` | Modal content background. |
| `surface-input` | `#ffffff` | Form input background. |
| `surface-input-disabled` | `color-neutral-100` | Disabled input background. |
| `surface-table-header` | `color-neutral-100` | Table header row background. |
| `surface-table-row-hover` | `color-neutral-50` | Table row hover. |
| `surface-table-row-selected` | `#eff6ff` | Selected table row. |

### 2.5 Status Colors

#### Matter Status

| Status | Badge BG | Badge Text | Border-Left (on cards) |
|--------|----------|------------|------------------------|
| Active | `#dbeafe` | `#1e40af` | `#1a56db` |
| On Hold | `#fef3c7` | `#92400e` | `#b45309` |
| Closed | `color-neutral-200` | `color-neutral-600` | `color-neutral-400` |
| Archived | `color-neutral-100` | `color-neutral-500` | `color-neutral-300` |

#### Document Lifecycle

| Status | Badge BG | Badge Text |
|--------|----------|------------|
| Draft | `color-neutral-200` | `color-neutral-700` |
| In Review | `#dbeafe` | `#1e40af` |
| Revision Requested | `#fef3c7` | `#92400e` |
| Approved | `#d1fae5` | `#065f46` |
| Filed | `#c7d2fe` | `#3730a3` |
| Superseded | `color-neutral-100` | `color-neutral-500` |

#### Filing Status

| Status | Badge BG | Badge Text |
|--------|----------|------------|
| Assembling | `color-neutral-200` | `color-neutral-700` |
| Pending Review | `#dbeafe` | `#1e40af` |
| Approved | `#d1fae5` | `#065f46` |
| Submitted | `#c7d2fe` | `#3730a3` |
| Accepted | `#d1fae5` | `#065f46` |
| Rejected | `#fee2e2` | `#991b1b` |
| Correcting | `#fef3c7` | `#92400e` |

---

## Section 3: Typography

### 3.1 Font Families

| Token | Family | Fallback Stack | Usage |
|-------|--------|----------------|-------|
| `font-sans` | Inter | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif | All body text, headings, UI elements |
| `font-mono` | JetBrains Mono | 'Fira Code', 'Cascadia Code', monospace | Cause numbers, matter numbers, IDs, code references |

### 3.2 Size Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 11px (0.6875rem) | 16px | Fine print, timestamps, metadata labels |
| `text-sm` | 12px (0.75rem) | 18px | Table cells, secondary information, badge text |
| `text-base` | 13px (0.8125rem) | 20px | Default body text, form inputs, navigation items |
| `text-md` | 14px (0.875rem) | 22px | Emphasized body text, card titles |
| `text-lg` | 16px (1rem) | 24px | Section headings within pages, sidebar group headers |
| `text-xl` | 18px (1.125rem) | 28px | Page section titles |
| `text-2xl` | 22px (1.375rem) | 30px | Page titles |
| `text-3xl` | 28px (1.75rem) | 36px | Dashboard metric numbers, primary page headers |

### 3.3 Weight Scale

| Token | Weight | Usage |
|-------|--------|-------|
| `font-regular` | 400 | Body text, descriptions, table cells |
| `font-medium` | 500 | Navigation items, form labels, emphasized text |
| `font-semibold` | 600 | Card titles, section headings, table headers |
| `font-bold` | 700 | Page titles, metric values, strong emphasis |

### 3.4 Special Type Treatments

| Pattern | Font | Size | Weight | Additional |
|---------|------|------|--------|------------|
| Cause number | `font-mono` | `text-sm` | `font-medium` | Letter-spacing: 0.02em |
| Matter number | `font-mono` | `text-sm` | `font-regular` | Letter-spacing: 0.02em |
| Status badge text | `font-sans` | `text-xs` | `font-semibold` | Uppercase, letter-spacing: 0.04em |
| Metric value | `font-sans` | `text-3xl` | `font-bold` | Tabular numerals (font-variant-numeric: tabular-nums) |
| Timestamp | `font-sans` | `text-xs` | `font-regular` | `color-neutral-500` |

---

## Section 4: Spacing Scale

Base unit: 4px. All spacing values are multiples of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight spacing: between badge icon and text, inline element gaps |
| `space-sm` | 8px | Compact spacing: between related form fields, within badges, icon-to-text gap |
| `space-md` | 12px | Default spacing: table cell padding, between list items |
| `space-lg` | 16px | Standard spacing: card padding, between form groups, button padding-x |
| `space-xl` | 24px | Section spacing: between card sections, between page elements |
| `space-2xl` | 32px | Large section breaks: between page sections, modal padding |
| `space-3xl` | 48px | Page-level spacing: top margin of main content area |
| `space-4xl` | 64px | Maximum spacing: reserved for major layout breaks |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 2px | Badges, small elements |
| `radius-md` | 4px | Cards, buttons, inputs, modals |
| `radius-lg` | 6px | Dropdown menus, tooltips |
| `radius-full` | 9999px | Avatars, circular indicators |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Cards at rest |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.07) | Dropdowns, popovers |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.10) | Modals, elevated panels |
| `shadow-sidebar` | 2px 0 8px rgba(0,0,0,0.12) | Sidebar edge shadow |

---

## Section 5: Component Specifications

### 5.1 Sidebar Navigation

**Width**: 224px expanded, 64px collapsed (icon-only mode).

**Structure**:
- Logo/firm name area: 56px height, bottom border `color-primary-700`
- Navigation groups: collapsible sections with group header
- Navigation items: 40px height, `space-lg` left padding, `text-base` size
- Nested items: additional `space-xl` left padding
- Badge counts: right-aligned, pill shape, `text-xs`, accent-blue background with white text
- Active item: `color-primary-800` background, left 3px border `color-accent-blue`, white text
- Hover item: `color-primary-700` background
- Default item: `color-primary-500` text
- Collapse toggle: bottom of sidebar, 40px height, icon-only

**Behavior**:
- Collapse state persists across sessions (localStorage)
- On collapse, group headers hide; only icons remain
- Tooltips appear on hover when collapsed

### 5.2 Matter Card

Used in dashboard lists and search results to represent a matter at a glance.

**Layout**:
```
┌──────────────────────────────────────────────┐
│ [Status Badge]            [Urgency Flag]     │ <- 40px header
│ In re Marriage of Smith & Smith               │ <- Title, text-md, font-semibold
│ TT-2026-00142  ·  2026-12345 (309th)         │ <- Matter# · Cause# (Court), text-sm, font-mono
│ Petitioner: Jane Smith                        │ <- Parties, text-sm
│ ┌─────────────────────────────────┐          │
│ │ ● Intake → ● Drafting → ○ Filed │          │ <- Stage indicator
│ └─────────────────────────────────┘          │
│ Lead Paralegal: Maria Garcia   Updated 2h ago│ <- Footer, text-xs
└──────────────────────────────────────────────┘
```

**Specifications**:
- Card: white background, `shadow-sm`, `radius-md`, left border 3px colored by matter status
- Header: status badge (per Section 2.5) and urgency flag (only shown for high/critical)
- Title: `text-md`, `font-semibold`, `color-neutral-800`, single line with ellipsis overflow
- Identifiers: `font-mono`, `text-sm`, `color-neutral-600`
- Stage indicator: horizontal dots connected by line; filled dots = completed stages; current stage = accent-blue filled; future = hollow
- Urgency flags: high = amber dot, critical = red dot with pulse animation
- Card hover: `shadow-md`, translate-y -1px (subtle lift)

### 5.3 Status Badges

Consistent badge component used across all status displays.

**Structure**: Inline-flex, `radius-sm`, padding `space-xs` vertical / `space-sm` horizontal.

**Typography**: `text-xs`, `font-semibold`, uppercase, `letter-spacing: 0.04em`.

**Colors**: Per Section 2.5 tables. Badge always shows both background color AND text for accessibility.

**Dot variant**: For compact displays, a 6px circle with the badge text color can replace the full badge, but must have a tooltip with the status text.

### 5.4 Data Tables

The primary data display component. Used for matter lists, document lists, task lists, financial ledgers, and discovery tracking.

**Header row**:
- Background: `surface-table-header`
- Text: `text-xs`, `font-semibold`, `color-neutral-600`, uppercase, letter-spacing 0.04em
- Height: 36px
- Sortable columns: sort icon (chevron up/down) right of header text; active sort = `color-accent-blue`

**Data rows**:
- Height: 44px minimum (expandable for multi-line content)
- Text: `text-sm`, `font-regular`, `color-neutral-700`
- Border bottom: 1px `color-neutral-200`
- Hover: `surface-table-row-hover` background
- Selected: `surface-table-row-selected` background, left 2px border `color-accent-blue`

**Row selection**:
- Checkbox column: 40px width, centered checkbox
- Select all: header checkbox selects visible page
- Selected count: displayed in bulk actions bar

**Bulk actions bar**:
- Appears when 1+ rows selected
- Sticky at bottom of table or top of table depending on context
- Shows selected count and available actions as buttons
- Background: `color-accent-blue` at 5% opacity, left border 3px `color-accent-blue`

**Pagination**:
- Bottom of table, right-aligned
- Shows: "Showing 1-25 of 142" + page size selector (25/50/100) + previous/next buttons
- Page size persists per table via localStorage

### 5.5 Form Patterns

**Field layout**: Vertical stacking by default. Label above input.

**Labels**: `text-sm`, `font-medium`, `color-neutral-700`. Required fields: red asterisk after label text.

**Inputs**:
- Height: 36px
- Border: 1px `color-neutral-300`
- Border radius: `radius-md`
- Padding: `space-sm` vertical, `space-md` horizontal
- Focus: border `color-accent-blue`, ring 2px `color-accent-blue` at 20% opacity
- Error: border `color-danger`, ring 2px `color-danger` at 20% opacity
- Disabled: `surface-input-disabled` background, `color-neutral-400` text

**Inline validation**:
- Error message appears below input, `text-xs`, `color-danger`
- Validation triggers on blur for first interaction, then on change thereafter
- Success state: green checkmark icon right-aligned in input (for fields like cause number format validation)

**Legal-specific inputs**:
- **Date picker for hearing dates**: Calendar dropdown with quick-select for "next available Friday" and court schedule awareness
- **Cause number input**: `font-mono`, formatted as user types (auto-insert hyphens), validates against county format
- **County selector**: Dropdown with all 254 Texas counties, searchable, grouped by region
- **SSN input**: Last-four-only field, masked display, `font-mono`
- **Currency input**: Right-aligned, auto-formatted with commas, $ prefix
- **Party name fields**: First/Middle/Last/Suffix as separate inputs in a horizontal row

### 5.6 Modal Patterns

**Overlay**: `surface-modal-overlay`, click-to-dismiss (except confirmation modals).

**Modal container**: `surface-modal`, `shadow-lg`, `radius-md`, max-width 560px for standard, 800px for wide (e.g., document viewer settings).

**Structure**:
```
┌──────────────────────────────────┐
│ Modal Title                   ✕  │  <- Header, 56px, bottom border
│──────────────────────────────────│
│                                  │
│  Modal body content              │  <- Body, space-2xl padding
│                                  │
│──────────────────────────────────│
│              [Cancel] [Confirm]  │  <- Footer, 56px, top border, right-aligned
└──────────────────────────────────┘
```

**Confirmation modals** (for destructive or attorney-approval actions):
- Title prefixed with action type: "Approve Document", "Delete Filing Packet", "Close Matter"
- Body includes explicit description of consequence
- Destructive actions: confirm button is `color-danger` background, white text
- Attorney approval actions: confirm button is `color-success` background, white text
- Require explicit click (not Enter key) for destructive confirms
- Cannot be dismissed by clicking overlay

**Focus management**:
- Focus moves to first focusable element when modal opens
- Tab cycles within modal (focus trap)
- Escape key closes modal (except destructive confirmation)
- Focus returns to trigger element on close

### 5.7 Timeline Component

Used for matter stage progress and event history.

**Stage progress timeline** (horizontal, in matter header):
```
● Intake ──── ● Drafting ──── ● Filed ──── ○ Discovery ──── ○ Mediation ──── ○ Closed
```
- Completed stages: filled circle, `color-success`
- Current stage: filled circle, `color-accent-blue`, slightly larger (10px vs 8px)
- Future stages: hollow circle, `color-neutral-300`
- Connecting line: 2px, `color-neutral-200` (future) or `color-success` (completed segments)
- Stage labels: `text-xs`, below circles

**Event history timeline** (vertical, in matter detail):
```
│  ● 2026-04-18  Filing accepted — Cause number assigned: 2026-12345
│  ● 2026-04-15  Filing packet submitted to Harris County
│  ● 2026-04-14  Attorney approved filing packet
│  ● 2026-04-10  Original Petition approved by J. Taylor
│  ● 2026-04-08  Original Petition submitted for review
│  ● 2026-04-05  Matter opened from lead #L-2026-00089
```
- Vertical line: 2px, `color-neutral-200`, left side
- Event dots: 8px circles on the line, colored by event category
- Date: `text-xs`, `font-mono`, `color-neutral-500`
- Event text: `text-sm`, `color-neutral-700`
- Event type coloring: filing events = blue, approvals = green, status changes = neutral, warnings = amber

### 5.8 Document Viewer Shell

Container for viewing documents within the application.

**Layout**: Full-width panel within matter detail tab, or slide-over from right (480px width).

**Header**: Document title, version badge ("v3"), status badge, action buttons (Download, Print, Approve, Reject).

**Viewer area**: Embedded PDF viewer (pdf.js) or DOCX preview. Minimum height 600px. Scroll within container.

**Sidebar panel** (optional, toggled): Version history list, approval history, comments.

### 5.9 Filing Packet Assembly Panel

Dedicated interface for building filing packets.

**Layout**: Two-column within matter detail.

**Left column** (60%): Available documents list. Each document shows title, type, status, version. Drag handle for reordering. Checkbox for selection.

**Right column** (40%): Current packet contents. Ordered list showing: sort order number, document title, item_role badge (lead_document = blue, exhibit = neutral, etc.). Drag-to-reorder within packet. Remove button per item.

**Validation bar**: Sticky at bottom. Shows green checkmarks or red warnings for: lead document present, all documents approved, attorney sign-off complete. Disabled "Submit" button until all validations pass.

---

## Section 6: Layout Patterns

### 6.1 App Shell

```
┌─────────┬──────────────────────────────────────────────────┐
│         │  Breadcrumb  /  Page Title            [User] [?] │  <- Top bar, 56px
│         ├──────────────────────────────────────────────────┤
│ Sidebar │                                                  │
│ 224px   │  Main Content Area                               │
│         │  Padding: space-xl on all sides                  │
│         │  Max-width: 1440px, centered                     │
│         │                                                  │
│         │                                                  │
│         │                                                  │
└─────────┴──────────────────────────────────────────────────┘
```

- Sidebar: fixed position, full height, `surface-sidebar`
- Top bar: sticky, white background, `shadow-sm`, contains breadcrumb, page title, user menu, help
- Main content: scrollable, `surface-background`, padded

### 6.2 Matter Detail

```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]  In re Marriage of Smith & Smith                   │
│  TT-2026-00142  ·  2026-12345 (309th District, Harris Co)   │
│  [Active]  Lead Paralegal: Maria Garcia                      │
│  ● Intake ── ● Drafting ── ● Filed ── ○ Discovery ── ...    │
├──────────────────────────────────────────────────────────────┤
│ [Overview] [Documents] [Filing] [Discovery] [Calendar] ...   │  <- Tabs
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab content area                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Matter header: persistent, does not scroll with tab content. 140px height.
- Tabs: horizontal tab bar, sticky below matter header
- Tab content: scrollable within remaining viewport height
- Tabs available: Overview, Parties, Documents, Filing, Discovery, Calendar, Financial, Communications, Orders, History

### 6.3 Dashboard Grid

```
┌──────────────────┬──────────────────┬──────────────────┐
│  Matters Summary │  Upcoming        │  Overdue Items   │
│  Active: 47      │  Hearings (3)    │  Deadlines (2)   │
│  On Hold: 5      │  Mediations (1)  │  Tasks (4)       │
│  Closed (30d): 8 │  Depositions (0) │  Discovery (1)   │
├──────────────────┴──────────────────┴──────────────────┤
│  Recent Activity (timeline)                            │
├────────────────────────────────────────────────────────┤
│  My Tasks (table)                                      │
├────────────────────────────────────────────────────────┤
│  Pending Approvals (table, attorney-only)              │
└────────────────────────────────────────────────────────┘
```

- Top row: 3 equal-width metric cards
- Below: full-width sections stacked vertically
- Metric cards: `surface-card`, `shadow-sm`, metric value in `text-3xl` `font-bold`, label in `text-sm`
- Widget card titles: `text-lg`, `font-semibold`, with "View All" link right-aligned

### 6.4 Portal Layout (Client-Facing)

Simpler, less information-dense. Designed for non-legal users navigating stressful situations.

```
┌──────────────────────────────────────────────────────────┐
│  [Firm Logo]                          [Name] [Logout]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Welcome, Jane.                                          │
│  Your case: In re Marriage of Smith & Smith               │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Documents│ │ Messages │ │ Calendar │                │
│  │    12    │ │   3 new  │ │ Next: 5/1│                │
│  └──────────┘ └──────────┘ └──────────┘                │
│                                                          │
│  Recent Activity                                         │
│  ─────────────                                          │
│  Apr 18 - Your petition was filed with the court         │
│  Apr 15 - New document available for review              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- No sidebar navigation; top navigation only
- Larger text sizes (base = 14px instead of 13px)
- More whitespace and padding
- Friendly language (no legal jargon in UI labels)
- Limited actions: view documents, upload documents, send messages, view calendar
- No direct access to matter internals (stages, checklists, financial details)

---

## Section 7: Accessibility Requirements

### 7.1 WCAG 2.1 AA Compliance

All color combinations in this specification meet or exceed 4.5:1 contrast ratio for normal text and 3:1 for large text. The following combinations have been verified:

| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| `color-neutral-700` (#3f3f46) | `surface-card` (#ffffff) | 10.4:1 | AA |
| `color-neutral-800` (#27272a) | `surface-card` (#ffffff) | 13.5:1 | AAA |
| `color-neutral-500` (#71717a) | `surface-card` (#ffffff) | 4.6:1 | AA |
| `color-accent-blue` (#1a56db) | `surface-card` (#ffffff) | 5.8:1 | AA |
| `color-danger` (#991b1b) | `surface-card` (#ffffff) | 8.8:1 | AAA |
| White (#ffffff) | `color-primary-900` (#0f1929) | 16.2:1 | AAA |
| `color-primary-500` (#3d567d) | `color-primary-900` (#0f1929) | 2.4:1 | Fail for text — use only for decorative elements |

### 7.2 Keyboard Navigation

- All interactive elements reachable via Tab
- Logical tab order follows visual layout (left-to-right, top-to-bottom)
- Skip-to-main-content link as first focusable element
- Sidebar navigation: Arrow keys to move between items, Enter to activate, Escape to collapse group
- Data tables: Arrow keys for cell navigation when table is focused
- Modals: focus trapped within modal while open
- Dropdowns: Arrow keys to navigate options, Enter to select, Escape to close

### 7.3 Focus Management

- Visible focus indicator on all interactive elements: 2px ring, `color-accent-blue`, 2px offset
- Focus indicator must not be obscured by adjacent elements
- When content loads dynamically (e.g., new page in table), focus stays in logical position
- After form submission, focus moves to success/error message
- After modal close, focus returns to trigger element
- After page navigation, focus moves to page title (h1)

### 7.4 Screen Reader Support for Legal UI

- Cause numbers: `aria-label="Cause number 2026 dash 12345"` (prevents character-by-character reading)
- Matter numbers: `aria-label="Matter number T T dash 2026 dash 00142"`
- Status badges: Include `role="status"` and text content (color is never sole indicator)
- Stage timeline: `role="progressbar"` with `aria-valuenow` (current step) and `aria-valuemax` (total steps) and `aria-valuetext` describing current stage
- Data tables: proper `<th>` with `scope="col"` or `scope="row"`, `<caption>` element describing table purpose
- Sort indicators: `aria-sort="ascending"` or `aria-sort="descending"` on sorted column header
- Form validation errors: `aria-invalid="true"` on field, error message linked via `aria-describedby`
- Loading states: `aria-busy="true"` on container, `role="alert"` on completion message
- Timeline events: `role="feed"` with `role="article"` for each event, `aria-label` with full event description

### 7.5 Reduced Motion

- All animations respect `prefers-reduced-motion` media query
- When reduced motion is preferred: no transitions on hover/focus, no card lift effects, no pulse animations on urgency flags, instant state changes
- Skeleton loading screens used instead of spinner animations where possible
