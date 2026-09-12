---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality for the DAWH ecosystem. Use this skill when the user asks to build web components, pages, artifacts, dashboards, React components, HTML/CSS layouts, navigation systems, or when styling/beautifying any web UI according to the official DAWH design system, 3-tier white hierarchy, and Figma specifications.
---

This skill guides the creation of distinctive, production-grade frontend interfaces for the **DAWH Enterprise ERP & Hire-Purchase System**, adhering strictly to our custom design tokens, typography, and UI paradigms while avoiding generic "AI slop" aesthetics.

---

## 🎨 DAWH Official Design System & Theme Tokens

### 1. Theme Configuration (`customTheme`)
All components and stylesheets MUST map directly to the following palette:

```typescript
export const customTheme = {
  dark: {
    canvas: "#2C2C2C",          // Main page background
    sidebar: "#222222",         // Sidebar container & inputs
    cards: "#383838",           // Cards, active tab highlight, modals
    accent: "#FFFFFF",          // Accent (Auth, primary CTAs, progress bars)
    border: "#444444",          // Dividers, card borders, subtle separators
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
    border: "#E4E4E7",          // Subtle light zinc border
    text: {
      primary: "#222222",       // Dark slate primary text
      secondary: "#2C2C2C",     // Slate 700 secondary text
      muted: "#383838",         // Slate 500 muted text
    },
  },
};
```

### 2. Status & Form Validation Tokens (Official Harmonized Accent Palette)

When designing forms, badges, status pills, password strength, or indicators, strictly apply the official DAWH status tokens:

| Status Role | Light Theme (`#F8FAFC`) | Dark / Black Theme (`#2C2C2C`) |
| :--- | :--- | :--- |
| **✅ Correct / Valid / Success / Active** | **`#2EC4B6`**<br>`text-[#2EC4B6] font-bold`<br>`bg-[#2EC4B6]/10 border-[#2EC4B6]/30`<br>Bar / Badge fill: `bg-[#2EC4B6]` | **`#2EC4B6`**<br>`text-[#2EC4B6] font-semibold`<br>`bg-[#2EC4B6]/15 border-[#2EC4B6]/30`<br>Bar / Badge fill: `bg-[#2EC4B6]` |
| **❌ Incorrect / Invalid / Error / Danger** | **`#E74C3C`**<br>`text-[#E74C3C] font-bold`<br>`bg-[#E74C3C]/10 border-[#E74C3C]/30`<br>Bar / Badge fill: `bg-[#E74C3C]` | **`#E71D36`**<br>`text-[#E71D36] font-semibold`<br>`bg-[#E71D36]/15 border-[#E71D36]/30`<br>Bar / Badge fill: `bg-[#E71D36]` |
| **⚠️ Warning / Fair / Pending / Attention** | **`#FF9F1C`**<br>`text-[#FF9F1C] font-bold`<br>`bg-[#FF9F1C]/10 border-[#FF9F1C]/30`<br>Bar / Badge fill: `bg-[#FF9F1C]` | **`#FF9F1C`**<br>`text-[#FF9F1C] font-semibold`<br>`bg-[#FF9F1C]/15 border-[#FF9F1C]/30`<br>Bar / Badge fill: `bg-[#FF9F1C]` |
| **ℹ️ Info / Active / Primary Brand** | **`#0D99FF`**<br>`text-[#0D99FF] font-bold`<br>`bg-[#0D99FF]/10 border-[#0D99FF]/30`<br>Bar / Badge fill: `bg-[#0D99FF]` | **`#0D99FF`**<br>`text-[#0D99FF] font-semibold`<br>`bg-[#0D99FF]/15 border-[#0D99FF]/30`<br>Bar / Badge fill: `bg-[#0D99FF]` |

### 3. 3-Tier White Color Hierarchy (Dark Theme Rules)

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

### 5. Strict Language Purity & No Redundant Bilingual Parentheses (ห้ามใส่วงเล็บภาษาซ้ำซ้อน)
When rendering UI labels, titles, buttons, headers, or messages in either Thai (`isThai`) or English:
- **Never include redundant bilingual translations in parentheses** (e.g. NEVER write `รายงานตรวจรับสินค้า (GRN)`, `ยอดตามบิล (Expected)`, `ยอดรับจริง (Received)`, `ส่วนต่าง (Variance)`, `ใบเสร็จ (A4)`, `ตารางเปรียบเทียบ (Side-by-Side Table)`).
- Render cleanly in the active language only:
  - Thai: `รายงานตรวจรับสินค้า`, `ยอดตามใบกำกับภาษี`, `ยอดที่สแกนรับจริง`, `ส่วนต่างสุทธิ`, `ใบเสร็จทางการ`
  - English: `Goods Receipt Report`, `Expected Units`, `Received Units`, `Net Variance`, `Official Receipt`
- **0% Emoji Rule**: Never use emojis in UI headings, buttons, notifications, or cards.

---

## 🚀 Quality Checklist Before Finalizing UI
- [ ] No generic AI aesthetics (No arbitrary purple-on-white gradients).
- [ ] Typography follows `Outfit` for display and `Geist` for content.
- [ ] All colors adhere strictly to `customTheme` and the 3-Tier White Hierarchy.
- [ ] Collapsible menus feature the Left Vertical Tree Guide Line.
- [ ] Strict Language Purity: No redundant English/Thai translations inside parentheses (e.g. NO `ข้อความ (Text)`).
- [ ] 0% Emojis throughout UI components.
- [ ] Transitions use cubic-bezier timing (`duration-300` / `duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`).
- [ ] Fully responsive on Mobile, Tablet, and Desktop with Safe Area insets.
