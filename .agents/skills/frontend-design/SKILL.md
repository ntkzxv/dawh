---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality for the DAWH ecosystem. Use this skill when the user asks to build web components, pages, artifacts, dashboards, React components, HTML/CSS layouts, navigation systems, or when styling/beautifying any web UI according to the official DAWH design system, 3-tier white hierarchy, and Figma specifications.
---

This skill guides the creation of distinctive, production-grade frontend interfaces for the **DAWH Enterprise ERP & Hire-Purchase System**, adhering strictly to our custom design tokens, typography, and UI paradigms while avoiding generic "AI slop" aesthetics.
## Shared Common UI Components

Before adding or restyling common controls, inspect `components/common` and reuse its existing components and visual styles. For buttons, search fields, and filters, use `Button`, `SecondaryButton`, `SearchInput`, `FilterDropdown`, and `FilterButton` where they fit instead of inventing page-specific Tailwind styles. Follow their shared dimensions, spacing, colors, borders, radii, hover/focus states, and Light/Dark theme behavior.

Use `Button` with the appropriate variant for primary actions such as Add/Create, and `SecondaryButton` for secondary actions such as Import/Export. Do not create narrowly named wrappers for an action pair when an existing shared button type already expresses the visual role.

If a page needs a reusable style that is missing or inconsistent, update or add it in `components/common`, then use that shared implementation on the page. For filter popovers, use `FilterButton` as the trigger and follow the responsive panel structure, theme colors, active-filter count, and dismiss behavior of `audit-filter-panel`. Avoid per-page overrides that conflict with the common component defaults. Before finalizing, compare the rendered controls with an existing common toolbar and check both themes and responsive widths.

## Warehouse list tables

Use `/warehouse/inventory?kind=products` as the toolbar reference and `/test` tab 2 as the table and pagination reference. Place a single responsive toolbar above the table frame: `SearchInput` followed by `FilterButton` on the left; relevant secondary actions followed by the primary add/create button on the right. Name the primary action for the item being added, such as “เพิ่มสินค้า”. Let the groups wrap on narrow screens while keeping their order. Keep filter choices inside the filter popover.

Do not place a generic heading or duplicate count such as “รายการทั้งหมด”, “รายการ”, or “All items” at the top-left of the table. The page heading already identifies the content; show the total in pagination below the table. Retain a specific section heading only when it distinguishes multiple different tables on one page. Use `DataTable` with `dataTableFrameClassName` for the bordered surface and keep `Pagination` outside the frame. See `docs/table-layout-guidelines.md` for the full warehouse table layout.

---

## 🎨 DAWH Official Design System & Theme Tokens

### 1. Theme Configuration (`customTheme`)
Map colors to the semantic roles exported in the supplied DAWH CSS. Apply them by role: surfaces establish the canvas and component layers; text uses primary and supporting levels; borders distinguish containers from controls; actions use their primary and on-primary pair; chart and informational colors stay within data and information. Do not substitute a color from one role into another just because it looks similar.

```typescript
export const customTheme = {
  dark: {
    canvas: "#2C2C2C",          // Main page background
    sidebar: "#222222",         // Sidebar container & inputs
    cards: "#383838",           // Cards, active tab highlight, modals
    accent: "#FFFFFF",          // Accent (Auth, primary CTAs, progress bars)
    actionOnPrimary: "#222222", // Existing dark text color on primary actions
    secondary: "#FFFFFF",       // Neutral active emphasis and secondary interaction
    border: "#444444",          // Dividers, card borders, subtle separators
    borderControl: "#E4E4E7",   // Input and control outlines
    surfaceHover: "#383838",    // Hover and subtle surface
    surfaceInput: "#222222",    // Input background
    chartGrid: "#444444",       // Chart grid lines
    chartSeries2: "#F4F4F5",    // Secondary chart series
    statusInfoText: "#FFFFFF",  // Neutral informational text
    text: {
      primary: "#FFFFFF",       // Pure White (Primary Text & Headings)
      secondary: "#F4F4F5",     // Soft White (Secondary Text & Menu Items)
      muted: "#E4E4E7",         // Muted Zinc (Sub-icons & Level 3 Text)
    },
  },
  light: {
    canvas: "#F8FAFC",          // Clean crisp light canvas
    sidebar: "#FFFFFF",         // Pure white sidebar
    cards: "#FFFFFF",           // Clean white cards
    accent: "#222222",          // Dark slate accent
    actionOnPrimary: "#FFFFFF", // Text and icons on primary actions
    secondary: "#222222",       // Neutral active emphasis and secondary interaction
    border: "#E4E4E7",          // Subtle light zinc border
    borderControl: "#737D88",   // Input and control outlines
    surfaceHover: "#F1F5F9",    // Hover and subtle surface
    surfaceInput: "#F8FAFC",    // Input background
    chartGrid: "#E4E4E7",       // Chart grid lines
    chartSeries2: "#383838",    // Secondary chart series
    statusInfoText: "#222222",  // Neutral informational text
    text: {
      primary: "#222222",       // Dark slate primary text
      muted: "#383838",         // Slate 500 muted text
    },
  },
};
```

Apply the Light roles as shown in the supplied CSS: `surface/canvas`, `surface/sidebar`, `surface/card`, `surface/hover`, and `surface/input` for their matching surfaces; `border/default` for dividers and `border/control` for inputs and controls; `text/primary` and `text/muted` for text hierarchy; `action/primary` and `action/on-primary` for primary actions; and `chart/grid`, `chart/series-2`, and `status/info-text` only for chart and information roles. Keep the existing Dark palette values above; the supplied Dark CSS defines role names, but must not replace those existing Dark colors. Use the updated Light success, warning, and danger colors listed below; retain the existing Dark status colors.

### 2. Status & Form Validation Tokens (Official Harmonized Accent Palette)

When designing forms, badges, status pills, password strength, or indicators, strictly apply the DAWH status tokens below. Standalone status text uses the status hue. On tinted status backgrounds, use primary text in Light theme and white text in Dark theme. Keep the status hue for indicators, borders, and bars.

| Status Role | Light Theme (`#F8FAFC`) | Dark / Black Theme (`#2C2C2C`) |
| :--- | :--- | :--- |
| **⚫ Neutral Active / Pagination** | **`#222222`**<br>`bg-[#222222] text-white font-bold`<br>`shadow-sm rounded-lg` | **`#FFFFFF`**<br>`bg-white text-[#222222] font-bold`<br>`shadow-sm rounded-lg` |
| **✅ Correct / Valid / Success / Active** | **`#15A465`**<br>Standalone text: `text-[#15A465]`; pale badge label: `text-[#222222] font-semibold`<br>`bg-[#15A465]/10 border-[#15A465]/30`<br>Bar / Badge fill: `bg-[#15A465]` | **`#2EC4B6`**<br>Standalone text: `text-[#2EC4B6]`; tinted badge label: `text-[#F4F4F5] font-semibold`<br>`bg-[#2EC4B6]/15 border-[#2EC4B6]/30`<br>Bar / Badge fill: `bg-[#2EC4B6]` |
| **❌ Incorrect / Invalid / Error / Danger** | **`#C7291F`**<br>Standalone text: `text-[#C7291F]`; pale badge label: `text-[#222222] font-semibold`<br>`bg-[#C7291F]/10 border-[#C7291F]/30`<br>Bar / Badge fill: `bg-[#C7291F]` | **`#E71D36`**<br>Standalone text: `text-[#E71D36]`; tinted badge label: `text-[#F4F4F5] font-semibold`<br>`bg-[#E71D36]/15 border-[#E71D36]/30`<br>Bar / Badge fill: `bg-[#E71D36]` |
| **⚠️ Warning / Fair / Pending / Attention** | **`#CE8D10`**<br>Standalone text: `text-[#CE8D10]`; pale badge label: `text-[#222222] font-semibold`<br>`bg-[#CE8D10]/10 border-[#CE8D10]/30`<br>Bar / Badge fill: `bg-[#CE8D10]` | **`#FF9F1C`**<br>Standalone text: `text-[#FF9F1C]`; tinted badge label: `text-[#F4F4F5] font-semibold`<br>`bg-[#FF9F1C]/15 border-[#FF9F1C]/30`<br>Bar / Badge fill: `bg-[#FF9F1C]` |
| **ℹ️ Info / Active / Secondary Brand** | **`#222222`**<br>`text-[#222222] font-bold`<br>`bg-[#222222]/5 border-[#222222]/20`<br>Bar / Badge fill: `bg-[#222222]` | **`#FFFFFF`**<br>`text-[#FFFFFF] font-semibold`<br>`bg-white/10 border-white/20`<br>Bar / Badge fill: `bg-white` |

### 3. Theme Color Priority and Dark White Hierarchy

For Light interfaces, keep the CSS hierarchy consistent: canvas `#F8FAFC`; cards and sidebar `#FFFFFF`; hover and subtle surfaces `#F1F5F9`; primary text `#222222`; supporting text `#383838`; default borders `#E4E4E7`; and control borders `#737D88`. Use black `#222222` and white `#FFFFFF` for primary and informational emphasis. Status colors follow the status table above.

Use the DAWH black-and-white palette for active controls, pagination, informational links, focus states, and secondary emphasis. Reserve indigo `#6366F1` (Light) and `#787BFF` (Dark) for the rare case where a chart or information category must be distinguished from neutral UI and the green, yellow, and red status colors; do not use indigo as decoration or a default accent.

For Dark interfaces, keep the existing palette values in `customTheme`. Apply them by visual priority: `#FFFFFF` for primary text and active emphasis; `#F4F4F5` for secondary labels and interactive text; `#E4E4E7` for muted descriptions and secondary icons; `#444444` for separators; and `#383838` for card and subtle surfaces. Use `#222222` for the sidebar and inputs, and `#2C2C2C` for the canvas. Status colors follow the Dark column in the status table.

When developing dark-mode interfaces, always apply this precise 3-tier white hierarchy:

1. **Pure White (`#FFFFFF`)**:
   - **Primary Text**: Major headings (`h1`, `h2`, `h3`), Brand logos, Section titles.
   - **Active Tab/Card Highlight**: Active menu labels and active icon fills.
   - **Luminescent Accents**: Glowing indicators (`shadow-[0_0_12px_rgba(255,255,255,0.7)]`), Sun icon.
2. **Off-White / Soft White (`#F4F4F5` / `#F5F5F7`)**:
   - **Secondary Text**: Inactive navigation labels, button labels.
   - **Hover States**: Text color on element hover (`hover:text-[#FFFFFF]`).
   - **Interactive Elements**: Module Hub button label, secondary card headers.
3. **Muted Zinc / Light Gray (`#E4E4E7`)**:
   - **Sub-Icons**: Chevrons, collapse/expand arrows, language toggle icons, settings icons.
   - **Level 3 Descriptive Text**: System metadata, *System Access*, timestamp badges.
   - **Secondary Actions**: Inactive state icon outlines.

---

## 🔤 Typography Standards

| Role | Font Family | Usage Guidelines |
| :--- | :--- | :--- |
| **Brand & Display** | `Outfit` (Google Font) | Brand title `dawh`, Splash Hero (64px, 800 weight), Section banners |
| **UI & Body** | `Geist` (Sans-serif) | Navigation tabs, tables, form inputs, buttons (Title Case / Natural case, **NO forced uppercase**) |
| **Monospace / Code** | `Geist Mono` | Keyboard shortcuts (`⌘K`), serial numbers, financial figures, audit logs |

---

## 🧩 Component & Navigation Architecture

### 1. Collapsible Tree Accordion (Sub-menus)
When building navigation groups with multiple sub-items:
- **Parent Header Button**: Displays primary Icon (`size={20}`), Title Case label, and a `ChevronDown` on the right (rotates 180° when expanded).
- **Sub-items Container**:
  - Indented with a sleek **Left Vertical Tree Line** (`ml-5 pl-3.5 border-l border-[#444444] dark:border-[#444444]`).
  - Animated smoothly with CSS Grid (`grid-rows-[0fr] -> grid-rows-[1fr]`).
  - Inactive sub-items: `text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-white/5`.
  - Active sub-item: `bg-[#383838] text-[#FFFFFF] font-semibold shadow-sm border border-[#555555]`.
  - Auto-expands if current URL matches a child route.

### 2. Dual-Theme Logo Handling
In `NavbarMain`, dynamically swap logos based on the active theme:
- **Light Theme**: `dawh_2048black_logo.png`
- **Dark Theme**: `dawh_2048light_logo.png`
- **Container Sizing**: `h-[72px]` when expanded, `w-12 h-12` when minimized.

### 3. Mobile & PWA Safe Area Insets
All layouts, sidebars, and full-screen screens MUST handle mobile safe areas:
- Top padding: `.pt-safe` (`padding-top: max(var(--sat), 0px)`)
- Bottom padding: `.pb-safe` (`padding-bottom: max(var(--sab), 0px)`)

### 4. Splash Loader Standard
For entry splash screens (`/`):
- Background `#2C2C2C`
- Centered brand title `dawh` (`Outfit` 64px, 800 weight, `#FFFFFF`)
- Subtitle `Hire-Purchase & Warehouse ERP` (`Geist` 14px, uppercase, `#999999`)
- Progress Bar Track: `w-[240px] h-[4px] bg-[#444444] rounded-full`
- Progress Bar Fill: `bg-white` (Dark) / `bg-[#222222]` (Light) `rounded-full` with dynamic progress animation.

### 5. Strict Language Purity & No English Parentheses in Thai (ห้ามใส่วงเล็บภาษาอังกฤษต่อท้ายภาษาไทย)
When rendering UI labels, titles, buttons, headers, or messages in either Thai (`isThai`) or English:
- **เวลาเขียนภาษาไทย ให้เป็นภาษาไทยล้วน ห้ามมีวงเล็บภาษาอังกฤษต่อท้ายเด็ดขาด** (Never append English words/acronyms in parentheses when writing Thai).
  - ❌ **ห้ามเขียน**: `ข้อกำหนดการให้บริการ (Terms of Service)`, `การคุ้มครองข้อมูลส่วนบุคคล (PDPA Protection)`, `การรับรองความถูกต้อง (Data Authenticity)`, `ความปลอดภัย (Security Policy)`, `รายงานตรวจรับสินค้า (GRN)`, `ส่วนต่าง (Variance)`
  - ✅ **เขียนภาษาไทยล้วน**: `ข้อกำหนดการให้บริการ`, `การคุ้มครองข้อมูลส่วนบุคคล`, `การรับรองความถูกต้องของข้อมูล`, `ความปลอดภัยของบัญชีและรหัสผ่าน`, `รายงานตรวจรับสินค้า`, `ส่วนต่างสุทธิ`
- **Active Language Only**: Keep each language clean and self-contained without bilingual mixing or parenthetical translation mirrors:
  - Thai: `รายงานตรวจรับสินค้า`, `ยอดตามใบกำกับภาษี`, `ยอดที่สแกนรับจริง`, `ส่วนต่างสุทธิ`, `ใบเสร็จทางการ`
  - English: `Goods Receipt Report`, `Expected Units`, `Received Units`, `Net Variance`, `Official Receipt`
- **0% Emoji Rule**: Never use emojis in UI headings, buttons, notifications, or cards.

---

## 🚀 Quality Checklist Before Finalizing UI
- [ ] No generic AI aesthetics (No arbitrary purple-on-white gradients).
- [ ] Typography follows `Outfit` for display and `Geist` for content.
- [ ] All colors adhere strictly to `customTheme` and the 3-Tier White Hierarchy.
- [ ] Collapsible menus feature the Left Vertical Tree Guide Line.
- [ ] Strict Language Purity: ภาษาไทยต้องเป็นภาษาไทยล้วน ห้ามมีวงเล็บภาษาอังกฤษต่อท้ายเด็ดขาด (No English words/terms in parentheses in Thai UI).
- [ ] 0% Emojis throughout UI components.
- [ ] Transitions use cubic-bezier timing (`duration-300` / `duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`).
- [ ] Fully responsive on Mobile, Tablet, and Desktop with Safe Area insets.
