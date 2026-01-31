# Frontend Redesign Design Document: "Enterprise Data-Dense" System

## 1. Overview
This document outlines the comprehensive redesign of the `Koordinator` frontend. The goal is to transition from the current transitional state to a **"Data-Dense & Enterprise"** aesthetic (border-heavy, grid-based, high information density) while maintaining 100% feature parity.

**Core Philosophy:**
- **Density:** Maximize screen real estate. Small fonts, tight spacing, compact controls.
- **Clarity:** Use borders (1px) and alignment to define structure, not shadows or heavy backgrounds.
- **Speed:** Instant feedback, no decorative animations, native-app feel.

## 2. Visual Design System

### 2.1 Color Palette & Semantics
We will strictly use CSS variables mapped to Tailwind colors.

*   **Neutral (Slate/Gray)**: The backbone of the interface.
    *   `--background`: `0 0% 100%` (White) / `222 47% 11%` (Dark)
    *   **`--border`**: `214 32% 91%` (Slate-200) / `217 33% 17%` (Slate-800) - **CRITICAL: Used everywhere.**
    *   `--input`: Same as border.
    *   `--ring`: `221.2 83.2% 53.3%` (Focus state).

*   **Primary Action**:
    *   `--primary`: `221.2 83.2% 53.3%` (Deep Blue)
    *   `--primary-foreground`: `210 40% 98%`

*   **Surfaces**:
    *   `--card`: `0 0% 100%`
    *   `--popover`: `0 0% 100%`
    *   `--muted`: `210 40% 96.1%` (Light gray for interactive hover states).

### 2.2 Typography
*   **Font Family**: `Inter`, system-ui, sans-serif.
*   **Scale**:
    *   `text-xs` (12px): Metadata, timestamps, table headers.
    *   `text-sm` (13px/14px): **Default body text**, inputs, buttons.
    *   `text-base` (16px): Section headers only.
    *   `text-lg`: Page titles.
*   **Weights**:
    *   `Regular (400)`: Body text.
    *   `Medium (500)`: Labels, navigation items.
    *   `Semibold (600)`: Headings, emphasized data.

### 2.3 Metrics & Spacing
*   **Grid Base**: 4px.
*   **Border Radius**:
    *   `rounded-md` (6px): Default for cards, inputs, large buttons.
    *   `rounded-sm` (4px): Small buttons, badges, internal elements.
    *   `rounded-none`: For joined groups (toolbar buttons).
*   **Shadows**: Removed for most elements. `shadow-sm` only for popovers/dropdowns.

## 3. Layout Architecture: "The Command Center"

### 3.1 App Shell (`AppShell.tsx`)
A fixed-viewport layout (100vh) with three distinct panes.

```
+---------------------------------------------------------------+
| [1] RAIL | [2] SIDEBAR (Resizable) | [3] WORKSPACE (Flex)     |
|          |                         |                          |
|  Icons   |  Header (Search/Filter) |  Header (Context/Tools)  |
|          |  ---------------------- |  ----------------------  |
|  [Chat]  |  List Item 1            |                          |
|  [Mail]  |  List Item 2            |  Main Content Area       |
|  [Task]  |  List Item 3            |  (Scrollable)            |
|          |                         |                          |
+---------------------------------------------------------------+
```

1.  **Primary Rail (Left)**: Darker contrast (`bg-slate-900` text-white in dark mode, or `bg-slate-50` in light). width: `64px`.
2.  **Secondary Sidebar (Middle)**: Context list. `bg-background`, `border-r`. width: `280px` (resizable).
3.  **Workspace (Right)**: The active view. `bg-background`.

### 3.2 Navigation Components
*   **`SidebarItem`**: Compact row, `h-8` or `h-9`. Hover: `bg-muted`. Active: `bg-accent text-accent-foreground` + left border indicator.
*   **`Header`**: Height `h-14` (56px). Bottom border `border-b`. Flexbox alignment for titles and actions.

## 4. Component Refactoring Plan

### 4.1 Primitive Components
These must be updated first to propagate the style.

*   **`Button`**:
    *   Remove large paddings.
    *   Variants: `default` (solid), `outline` (border-input), `ghost` (transparent), `link`.
    *   Size: `sm` (h-8) as the new default for UI, `default` (h-9) for forms.
*   **`Input` / `Select`**:
    *   Height: `h-9`.
    *   Border: `border-input` (Slate-200).
    *   Focus: `ring-2 ring-ring ring-offset-2`.
*   **`Card`**:
    *   Remove `shadow`. Add `border`.
    *   Header/Content/Footer sub-components.

### 4.2 Complex Features (Targeted Fixes)
*   **Chat**:
    *   Message bubbles: Reduce radius. Align to grid.
    *   Input area: distinct bordered box, not floating.
*   **Admin**:
    *   Tabs: "Underline" style or "Segmented Control" (pill) style, enclosed in a bordered container.
    *   Tables: Compact rows (`py-2`).

## 5. Technical Implementation Steps

1.  **Setup**:
    *   Update `src/index.css` with new CSS variables.
    *   Update `tailwind.config.js` to map these variables.
2.  **Shell**:
    *   Refactor `AppShell`, `PrimarySidebar`, `SecondarySidebar` to the new layout.
3.  **Primitives**:
    *   Refactor `src/design-system/components/*` one by one.
4.  **Feature Audit**:
    *   Walk through `src/features/*` and replace hardcoded `bg-white`, `p-8`, `shadow-lg` with standard tokens.
5.  **Responsiveness**:
    *   Ensure sidebars collapse into drawers on mobile.

## 6. Accessibility & Best Practices
*   **Focus**: Ensure visible focus rings on all interactive elements.
*   **Contrast**: Verify text colors against backgrounds (WCAG AA).
*   **Semantic HTML**: Use `<nav>`, `<main>`, `<aside>`, `<header>`.
