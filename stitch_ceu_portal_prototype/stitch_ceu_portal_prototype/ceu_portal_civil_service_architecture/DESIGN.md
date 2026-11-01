---
name: CEU Portal Civil Service Architecture
colors:
  surface: '#f8f9ff'
  surface-dim: '#c1ddfe'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e4efff'
  surface-container-high: '#daeaff'
  surface-container-highest: '#d0e4ff'
  on-surface: '#001d35'
  on-surface-variant: '#3f484f'
  inverse-surface: '#16324c'
  inverse-on-surface: '#e9f1ff'
  outline: '#707880'
  outline-variant: '#bfc7d0'
  surface-tint: '#006492'
  primary: '#006390'
  on-primary: '#ffffff'
  primary-container: '#167db2'
  on-primary-container: '#ffffff'
  inverse-primary: '#8bceff'
  secondary: '#526069'
  on-secondary: '#ffffff'
  secondary-container: '#d3e2ed'
  on-secondary-container: '#56656e'
  tertiary: '#765900'
  on-tertiary: '#ffffff'
  tertiary-container: '#947100'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#8bceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004b6f'
  secondary-fixed: '#d6e5ef'
  secondary-fixed-dim: '#bac9d3'
  on-secondary-fixed: '#0f1d25'
  on-secondary-fixed-variant: '#3b4951'
  tertiary-fixed: '#ffdf98'
  tertiary-fixed-dim: '#eec14b'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4300'
  background: '#f8f9ff'
  on-background: '#001d35'
  surface-variant: '#d0e4ff'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.625rem
    fontWeight: '700'
    lineHeight: 2.125rem
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a modern, authoritative, and accessible institutional interface tailored for the Career Education Unit (Unit Pendidikan Kerjaya, Jabatan Sekolah-Sekolah). It marries civil-service credibility with approachable modern ergonomics. The visual style follows a balanced **Corporate / Modern** aesthetic with refined structural clarity, avoiding both bureaucratic rigidity and fleeting decorative trends. 

Every design decision prioritizes civil-servant legibility, field accessibility on mobile devices, and seamless management across schools and administrative departments. The interface evokes trust, competence, civic pride, and calm efficiency through deliberate information pacing, high contrast ratios, and reassuring tactile feedback.

## Colors

The palette grounds the interface in high-contrast institutional hierarchy while remaining warm and readable under all lighting conditions.

- **Primary Ocean Blue (`#167DB2`):** Communicates institutional governance, clarity, and primary intent. Applied strictly to primary actions, active navigational states, and high-level markers.
- **Secondary Soft Sky Blue (`#E3F2FD`):** Provides soft structural contrast, active item fills, badge backgrounds, and quiet contextual highlight surfaces.
- **Tertiary Royal Amber Gold (`#C59B27`):** Marks pending RSVP actions, priority alerts, essential status flags, and administrative accolades.
- **Urgent Crimson Red (`#E53935`):** Reserved for immediate action alerts, non-attendance flags, and critical ministerial warnings.
- **Deep Navy Slate (`#0D2B45`):** Serves as high-contrast primary typography and optional dark container backgrounds, achieving rigorous WCAG AAA compliance against white and pale surfaces.
- **Muted Slate (`#64748B`):** Delivers metadata, supporting copy, timestamps, and secondary captions without visual clutter.
- **Base Surfaces (`#F8FAFC` background, `#FFFFFF` surface):** Ensure distinct separation between underlying canvas and operational cards. Structural dividers employ `#E2E8F0` with `#81C2E6` as the responsive focus and ring indicator.

## Typography

The typographic hierarchy establishes clear informational authority. **Plus Jakarta Sans** provides structural elegance and approachability in headlines and titles, softening formal civil service communications without sacrificing dignity. **Inter** handles data tables, administrative directives, labels, and content copy with clean, neutral legibility.

All headings adopt tighter line tracking to preserve visual weight, while body text provides generous line heights (`1.5` to `1.625`) to assist quick scanning during field work. Critical alerts and timestamps use micro-tracking on `label-sm` to maintain instant recognition across dense dashboard views.

## Layout & Spacing

This design system uses a fluid layout with defensive constraints:
- **Mobile First (<768px):** A single-column layout anchored by a fixed 68px bottom navigation bar and a floating top bar. Canvas side margins sit at `1rem` (`space-md`) with `1rem` gutters between stacked cards.
- **Tablet (768px - 1024px):** Adapts to an 8-column layout. The bottom navigation bar transitions into a left rail, widening content gutters to `1.25rem`.
- **Desktop (>1024px):** Transitions to a 12-column layout with a fixed 260px administrative sidebar. Content area adopts a max width of `1440px`, centered, using `2rem` margins and `1.5rem` gutters.

Component padding enforces strict spatial scales: card interiors use `space-lg` (`1.5rem`), actionable items and quick-RSVP grids use `space-md` (`1rem`), and dense badge elements scale down to `space-xs` and `space-sm`.

## Elevation & Depth

Visual hierarchy combines clean 1px borders (`#E2E8F0`) with soft, low-intensity ambient shadows. This approach preserves crisp edges while providing natural visual lift over the `#F8FAFC` foundation.

- **Flat / Base Layer (0dp):** Standard inputs, neutral table structures, and background groupings. Outlined with `#E2E8F0`.
- **Surface Elevation (1dp):** Standard cards and document listings. Employs `0px 1px 3px rgba(13, 43, 69, 0.05), 0px 1px 2px rgba(13, 43, 69, 0.03)` with a 1px border.
- **Interactive Hover & Overlay (2dp):** RSVP selection items, active calendar dates, and dropdown menus. Uses `0px 4px 6px -1px rgba(13, 43, 69, 0.07), 0px 2px 4px -2px rgba(13, 43, 69, 0.05)`.
- **Floating Navigation (3dp):** The 68px mobile bottom navigation bar and top floating application bar use `0px -2px 10px rgba(13, 43, 69, 0.06)` combined with a subtle backdrop filter (`backdrop-blur: 8px`) against a semi-opaque `#FFFFFFee` base to preserve background context during scroll.

## Shapes

The design uses a rounded geometry (`roundedness: 2`) that balances approachable modern touch surfaces with institutional structure:

- **Cards and Dialog Containers:** `1rem` (16px, `rounded-lg`). Provides comfortable framing on handheld mobile screens.
- **Input Fields and Dropdowns:** `0.75rem` (12px, `rounded-md`). Creates ergonomic, finger-friendly hit states.
- **Action Buttons & RSVP Selectors:** `0.625rem` (10px, `rounded`). Yields distinct, deliberate touch targets.
- **Status Badges, Indicator Pills, and Date Dots:** `9999px` (Full pill). Guarantees consistent status indicators across differing label lengths.

## Components

### Buttons & Quick RSVP Triggers
- **Primary Action:** Solid Ocean Blue (`#167DB2`), text white, 10px radius, 44px min-height for touch compliance. Hover introduces slight tonal deepening (`#126896`).
- **Secondary Action:** White surface, 1px border (`#E2E8F0`), text Deep Navy Slate (`#0D2B45`).
- **Touch-Friendly RSVP Strip:** A 3-way segmented button cluster:
  - *Hadir (Present):* Soft emerald highlight when active (`#ECFDF5`), border `#10B981`, text `#065F46`.
  - *Tidak (Absent):* Urgent Red highlight when active (`#FEF2F2`), border `#E53935`, text `#991B1B`.
  - *Wakil (Proxy):* Amber Gold highlight when active (`#FFFBEB`), border `#C59B27`, text `#92400E`.

### Cards & Document Listings
- **Standard Card:** White surface, 16px radius, 1px border (`#E2E8F0`), elevated by 1dp shadow.
- **Document Cards:** Feature left-hand icon badges indicating file type (PDF/Doc/Drive), primary file metadata in `body-md` (Deep Navy Slate), file size/update timestamp in `body-sm` (Muted Slate), and an explicit Google Drive launch trigger button at the trailing end.

### Calendar Grid
- Monthly overview with clean 7-column layout. Selected date features a `#167DB2` pill marker with white text.
- Dates with scheduled initiatives contain a bottom row of up to 3 indicator dots (4px diameter): Ocean Blue for unit meetings, Amber Gold for pending RSVPs, and Crimson Red for urgent institutional deadlines.

### Input Fields & Composers
- Base height 48px, 12px radius, 1px border (`#E2E8F0`), background `#FFFFFF`. Active focus changes the outline to a 2px ring in `#81C2E6`.
- **Broadcast Composer:** Includes a title field, multi-school target selector chips, rich-text markdown input, and an urgent flag toggle styled in Crimson Red.

### Admin Analytics & Tables
- Desktop tables utilize `#FFFFFF` surface with subtle zebra alternating stripes in `#F8FAFC`. Header row uses `#0D2B45` text over `#F1F5F9` background, with 12px font size in uppercase tracking. On mobile, table rows collapse into structured 16px cards retaining full RSVP and tracking statuses.