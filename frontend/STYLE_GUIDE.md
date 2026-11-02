# Emergency Green Corridor System — Design Style Guide
**Punjab Safe Cities Authority (PSCA) PPIC3 Operations Console**  
*Final Year Project (UMT Lahore) — Public-Sector Control-Room Standard*

---

## 1. Design Direction & Philosophy

### 1.1 Purpose & Tone
The **Emergency Green Corridor System Operations Console** is designed specifically for deployment within high-stakes, 24/7 public-safety command centres such as the Punjab Safe Cities Authority (PSCA) PPIC3 facility. Users include police command officers, traffic controllers, Rescue 1122 dispatchers, and academic evaluators.

The visual language follows the **"Navy and Gold Official Operations Console"** paradigm, synthesizing principles from:
- **GOV.UK Design System**: Restrained typography, high contrast, absence of decorative fluff, content-first clarity.
- **U.S. Web Design System (USWDS)**: Rigorous 4px grid, standardized accessible color tokens, Public Sans primary typography.
- **Public-Sector Command-and-Control Interfaces**: High-density tabular telemetry, unambiguous status indicators, absence of distracting gradients or neon glows.

### 1.2 Core Mandates
1. **Zero Gimmicks**: No neon lines, glowing drop-shadows, blurred backdrops (glassmorphism), or animated pulse rings.
2. **Accessible by Law**: Strictly compliant with **WCAG 2.2 AA** (minimum 4.5:1 body contrast, 3:1 for large text and interactive boundaries).
3. **Dual Operational Context**:
   - **Light Theme (Default)**: Optimized for well-lit administrative and supervisory workstations.
   - **Dark Operations Mode**: Optimized for low-light, multi-monitor video-wall control rooms.
4. **Never Color Alone**: Every state, chip, badge, and alert pairs an outline icon (1.5px stroke from `lucide-react`) with an explicit textual label.

---

## 2. Design Tokens & Palette

All colors are exposed through CSS custom variables on `:root` and `.dark` in `src/index.css`, mapped into Tailwind CSS v4 via `@theme`.

### 2.1 Light Theme (Default)
| Token Variable | Hex Value | Role / Usage |
| :--- | :--- | :--- |
| `--bg` | `#F4F8FB` | Main viewport canvas |
| `--surface` | `#FFFFFF` | Primary cards, modals, table surfaces |
| `--surface-alt` | `#F3F2F1` | Secondary backgrounds, zebra table rows, input backgrounds |
| `--border` | `#B1B4B6` | Strong structural borders, active boundaries |
| `--border-subtle`| `#DFE3E8` | Subtle card dividers, table row hairlines |
| `--text` | `#0B0C0C` | Primary headings, body copy, key data values (19.6:1 contrast) |
| `--text-secondary`| `#505A5F` | Labels, timestamps, secondary metrics, helper text (7.1:1 contrast) |
| `--navy-900` | `#06162D` | Darkest brand navy, dark sidebar background |
| `--navy-800` | `#14315C` | Official top bar background, primary brand tone |
| `--navy-700` | `#284976` | Mid-navy accents, table headers, group headers |
| `--navy-600` | `#3E6498` | Secondary interactive elements |
| `--navy-100` | `#D7E5F4` | Light tinted borders and panel highlights |
| `--navy-50` | `#E7EFF8` | Table header background, active navigation background |
| `--primary` | `#1D70B8` | Primary operational buttons, active links, primary charts |
| `--primary-hover`| `#165A94` | Primary hover state |
| `--primary-active`| `#0F4373` | Primary pressed / active state |
| `--accent-gold` | `#DDAA01` | Official gold rule, active navigation indicator bar |
| `--accent-gold-dark`| `#B38C00` | Gold hover / border state |
| `--focus-ring` | `#FFDD00` | Accessibility outer focus halo (paired with `#0B0C0C` inner ring) |
| `--danger` | `#D4351C` | Emergency priority, safety violation, emergency route (4.86:1 contrast) |
| `--success` | `#00703C` | Green corridor active, safety approved, normal flow (6.21:1 contrast) |
| `--warning` | `#F47738` | Pre-emption warning, sensor advisory, staging notice |
| `--info` | `#1D70B8` | System information, baseline tags, documentation notice |

### 2.2 Dark Operations Mode
Activated via `.dark` class on root HTML container or via the Operations Mode toggle.

| Token Variable | Hex Value | Role / Usage |
| :--- | :--- | :--- |
| `--bg` | `#0A141B` | Operations canvas background (no pure `#000000`) |
| `--surface` | `#12202B` | Operations console cards and panels |
| `--surface-raised`| `#1C2D39` | Raised popovers, active navigation selection |
| `--border` | `#3E5667` | High-contrast structural boundaries |
| `--border-subtle`| `#233745` | Subtle panel dividers |
| `--text` | `#F3F2F1` | Primary text and telemetry metrics (16.6:1 contrast) |
| `--text-secondary`| `#B1B4B6` | Secondary labels and timestamps (7.95:1 contrast) |
| `--primary` | `#6C8DBC` | High-visibility accessible link/button blue |
| `--accent-gold` | `#DDAA01` | Active navigation and highlight rule |
| `--danger` | `#FF6B5A` | Muted-bright emergency red (5.92:1 contrast) |
| `--success` | `#3FB67B` | Muted-bright green corridor indicator (6.46:1 contrast) |
| `--warning` | `#F47738` | Advisory amber |

---

## 3. Typography & Hierarchy

### 3.1 Type Families
- **Interface Font**: `Public Sans` (the authoritative USWDS typeface)  
  *Fallback*: `Inter`, `system-ui`, `-apple-system`, `Segoe UI`, `sans-serif`.
- **Telemetry & Numerical Font**: `IBM Plex Mono`  
  *Usage*: Timers, countdowns, vehicle IDs, GPS coordinates, signal phase codes, audit hashes. Configured with `font-variant-numeric: tabular-nums` to prevent layout jitter on live updates.

### 3.2 Type Scale
| Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- |
| **32px** (`text-2xl` / H1) | 700 / 600 | 1.2 | Page title in header band |
| **24px** (`text-xl` / H2) | 700 / 600 | 1.25 | Card group headers, major KPI numerals |
| **18px** (`text-lg` / H3) | 600 | 1.3 | Card titles, modal headers |
| **16px** (`text-base`) | 600 / 400 | 1.5 | Primary body text, table row headers |
| **14px** (`text-sm`) | 500 / 400 | 1.5 | Standard UI body, form fields, table data |
| **12px** (`text-xs`) | 600 | 1.4 | Small uppercase labels (`letter-spacing: +0.04em`), badge text |
| **11px** (`text-[11px]`) | 500 | 1.3 | Footnotes, chart tick marks, build stamps |

---

## 4. Layout, Spacing, and Elevation

### 4.1 Grid & Spacing
- **Base Grid**: 4px. All margins, paddings, and gaps must be multiples of 4 (e.g., `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`).
- **Page Gutters**:
  - Desktop (≥1024px): `24px` to `32px`.
  - Mobile (<1024px): `16px`.
- **Card Padding**: Standard `16px` or `20px`. Compact KPI cells `12px`.

### 4.2 Radii & Elevation
- **Card Radius**: `4px` (`border-radius: 4px;`).
- **Button & Input Radius**: `4px`.
- **Badges & Status Chips**: `2px` or `4px`.
- **Forbidden**: Pill-shaped buttons (`rounded-full`) or oversized radii (`rounded-2xl`).
- **Elevation**: Flat by default with `1px solid var(--border-subtle)` or `var(--border)`. Modals and drawers use a single restrained shadow:  
  `box-shadow: 0 1px 2px rgba(11, 12, 12, 0.08);`  
  No heavy drop shadows or glowing blurs.

---

## 5. Chrome & Structural Components

### 5.1 Classification Banner
A permanent, neutral banner above the header:
- **Background**: `var(--navy-50)`.
- **Border**: `1px solid var(--border-subtle)`.
- **Text**: `"Final Year Project, UMT Lahore. Proposed deployment environment: PSCA PPIC3. Simulation and sandbox data only."`
- **Typography**: 11px uppercase Public Sans, tracking `+0.04em`, neutral secondary color.

### 5.2 Top Bar
- **Height**: 54px.
- **Background**: Solid `#14315C` (`--navy-800`).
- **Bottom Accent**: 3px solid `#DDAA01` (`--accent-gold`) rule.
- **Left Identity**: Neutral shield icon (`Shield` from `lucide-react`) + `"Emergency Green Corridor System"`. (No simulated or unofficial governmental crests).
- **Right Controls**:
  - Operational Mode Badge: `SUMO TraCI / Simulation Mode`.
  - Service Health Pill: Outline `CheckCircle2` + `Healthy`.
  - Operations Mode Toggle: `Sun` / `Moon` switch (persisted in `localStorage` wrapped in `try/catch`).
  - Active Operator Badge: Role chip (`PSCA Operator` or `Admin`).

### 5.3 Sidebar Navigation
- **Light Theme**: White surface with `1px solid var(--border-subtle)` right border.
- **Dark Operations Mode**: `#06162D` (`--navy-900`) with high-contrast border.
- **Groupings**:
  1. **Operations**: Live Corridor Dashboard, Active Route Clearance, Emergency Intake.
  2. **Intelligence**: Junction Wave Schedule, Edge Perception, Traffic Prediction.
  3. **Assurance**: Safety Validator (NFR1), Benchmark Evaluation.
  4. **Administration**: Digital Twin Adapters, Security & Audit Ledger.
- **Active Navigation Item**:
  - Left indicator: `3px solid var(--accent-gold)`.
  - Background: `var(--navy-50)` in Light Theme; `var(--surface-raised)` in Dark Mode.
  - Text: Bold weight in `var(--navy-900)` / `var(--text)`.

### 5.4 Footer
- Appears on all views.
- Contains: System name, build timestamp, version, `"Simulation & Sandbox Environment"`, and academic advisor acknowledgments.

---

## 6. Component Rules

### 6.1 Buttons
- **Primary Button (`.btn-p`)**: Solid `var(--primary)`, white text, `4px` radius, `8px 16px` padding.
- **Secondary Button (`.btn-s` / `.btn-g`)**: White surface with `1px solid var(--border)`, text `var(--text)`.
- **Danger Button**: Solid `var(--danger)`, white text.
- **Disabled State**: Opacity 0.5, `cursor: not-allowed`, maintaining minimum 3:1 boundary contrast.
- **Focus State**: `outline: 3px solid #0B0C0C; outline-offset: 1px; box-shadow: 0 0 0 3px #FFDD00;` on all interactive controls.

### 6.2 Data Tables
- **Header**: Sticky header with `var(--navy-50)` background and `2px solid var(--border-strong)` bottom rule.
- **Rows**: Alternating zebra striping with `var(--surface-alt)` on even rows.
- **Numerics**: Right-aligned in `IBM Plex Mono` tabular figures.
- **Best/Winning Metric**: Highlighted in bold weight + Lucide `Check` icon.
- **Hover**: Subtle row highlight with `var(--navy-50)` opacity `0.4`.

### 6.3 Badges and Status Chips
Must ALWAYS contain an icon and textual label:
- **`c-green`**: `CheckCircle2` + text (`APPROVED`, `ACTIVE`, `CLEARED`). Background `rgba(0,112,60,0.1)`, text `var(--success)`.
- **`c-red`**: `AlertCircle` + text (`REJECTED`, `EMERGENCY`, `FAULT`). Background `rgba(212,53,28,0.1)`, text `var(--danger)`.
- **`c-amber`**: `AlertTriangle` + text (`STANDBY`, `PENDING`, `WARNING`). Background `rgba(244,119,56,0.12)`, text `var(--warning)`.
- **`c-gray`**: `Clock` / `Minus` + text (`BASELINE`, `INACTIVE`, `STAGING`). Background `var(--surface-alt)`, text `var(--text-secondary)`.

### 6.4 Safety Validator Result Banner
- When a proposed preemption plan passes safety checks:
  - Full-width banner in `var(--success)` tint (`rgba(0,112,60,0.08)`) with `1px solid var(--success)`.
  - Icon: Lucide `CheckCircle2`.
  - Text: `APPROVED — All NFR1 Invariants Satisfied (Min Green ≥ 10s, Pedestrian Clearance Protected, Yellow Phase Enforced)`.
- When rejected:
  - Full-width banner in `var(--danger)` tint (`rgba(212,53,28,0.08)`) with `2px solid var(--danger)`.
  - Icon: Lucide `AlertCircle`.
  - Text: `REJECTED — Safety Invariant Violated`. Lists specific violated rules in plain bullet points.
  - Screen reader announcement: `aria-live="assertive"`.

### 6.5 Cartography & Corridor Maps
- **Basemap Canvas**: Desaturated neutral road network (`#E7EAEE` roadways on `#F4F8FB` surface in light; `#1C2D39` on `#0A141B` in dark).
- **Emergency Route**: Double-stroke rendered line (solid 4px `var(--danger)` with 1.5px white outline) ensuring 100% legibility against dark or light geometry.
- **Green Corridor**: Solid `var(--success)`.
- **Alternative / Baseline Route**: Dashed `var(--text-secondary)`.
- **Signal Heads**: Red / Amber / Green circular heads with clear letter markers (`R`, `A`, `G`).
- **Legend**: High-contrast card anchored to corner with identical symbology.

---

## 7. Strict Do's and Don'ts

### DO
- ✅ Use `Public Sans` for headings, buttons, and prose; use `IBM Plex Mono` for numbers, IDs, and logs.
- ✅ Use `lucide-react` outline icons with `strokeWidth={1.5}` consistently across every component.
- ✅ Pair every color indicator with an icon and clear text description.
- ✅ Maintain 1px solid borders and subtle 4px corner radii throughout.
- ✅ Provide dual-ring high-contrast focus indicators (`#FFDD00` + `#0B0C0C`) for keyboard navigation.
- ✅ Support clean printing (`@media print`) stripping navigation chrome and formatting tables for hardcopy reports.

### DON'T
- ❌ **DO NOT** use cyan (`#00F0FF`, `#5BE0BC`), neon teal (`#34D3A8`), or turquoise.
- ❌ **DO NOT** use CSS `backdrop-filter: blur(...)` or transparent glassmorphism panels.
- ❌ **DO NOT** use glowing text-shadows (`box-shadow: 0 0 15px cyan;`).
- ❌ **DO NOT** use decorative background gradients (`bg-gradient-to-r`, `from-`, `to-`, `via-`).
- ❌ **DO NOT** use emojis as interface icons.
- ❌ **DO NOT** use pill-shaped buttons (`rounded-full`).
- ❌ **DO NOT** display official Punjab Government, Rescue 1122, or PSCA crests without statutory authority. Use clean neutral outline shields.

