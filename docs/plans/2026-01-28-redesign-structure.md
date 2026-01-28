# Koordinator Redesign Implementation Plan: Hybrid Layout & Structure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Refactor the application structure to a "Hybrid" navigation layout (Primary Icon Sidebar + Secondary Context Sidebar) with "Comfortable" information density, aiming for a professional corporate look while maintaining 100% functionality.

**Architecture:**
- **Shell**: A new `AppShell` component will replace the current main layout.
- **Navigation**:
    - **Primary Rail (Left)**: Icons for top-level modules (Chat, Email, Tasks, etc.).
    - **Secondary Panel (Left-Middle)**: Contextual navigation (Channel list, Mail folders) that changes based on the active module.
    - **Main Area (Center/Right)**: The actual content.
- **State**: A global UI store (`useUIStore`) to manage sidebar states (expanded/collapsed) and active secondary views.
- **Styling**: Refined Tailwind configuration for "Comfortable" density (14px base, moderate padding).

**Tech Stack:** React 19, Tailwind CSS v4, Zustand, React Router DOM.

---

### Task 1: Design Tokens & Configuration Update

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css` (or main css file)

**Step 1: Define comfortable density tokens**
Update `tailwind.config.js` to ensure we have appropriate spacing/sizing utilities if standard Tailwind isn't enough.
Ensure `font-family` is set to system fonts (Inter/Segoe UI) as requested.
Verify color palette matches "Professional Corporate" (Neutral grays, strong accent color).

**Step 2: Commit**
```bash
git add frontend/tailwind.config.js frontend/src/index.css
git commit -m "chore(design): update design tokens for comfortable density"
```

### Task 2: UI State Management

**Files:**
- Create: `frontend/src/stores/useUIStore.ts`

**Step 1: Create the store**
Implement a Zustand store to track:
- `activeModule` (string)
- `isSecondarySidebarOpen` (boolean)
- `toggleSecondarySidebar` (function)

**Step 2: Commit**
```bash
git add frontend/src/stores/useUIStore.ts
git commit -m "feat(state): add useUIStore for layout management"
```

### Task 3: Primary Sidebar (App Rail)

**Files:**
- Create: `frontend/src/design-system/layout/PrimarySidebar.tsx`
- Create: `frontend/src/design-system/layout/SidebarItem.tsx`

**Step 1: Implement PrimarySidebar**
A fixed-width (approx 64px-72px) column on the far left.
Contains:
- Top: Logo/Brand Icon.
- Center: Navigation Items (Chat, Email, Tasks, etc.).
- Bottom: User Profile/Settings.

**Step 2: Implement SidebarItem**
A reusable component for the icons with tooltip support. Active state styling (accent color border or background).

**Step 3: Commit**
```bash
git add frontend/src/design-system/layout/PrimarySidebar.tsx frontend/src/design-system/layout/SidebarItem.tsx
git commit -m "feat(layout): implement primary sidebar rail"
```

### Task 4: App Shell Layout

**Files:**
- Create: `frontend/src/design-system/layout/AppShell.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Implement AppShell**
A grid or flex container that orchestrates:
`[PrimarySidebar] [SecondarySidebar (Optional)] [MainContent]`
It should accept `children` (MainContent) and a `secondaryNav` prop.

**Step 2: Refactor App.tsx**
Wrap the routed content in `AppShell`.
*Note: We might need to adjust routes so that each route defines its own "Secondary Nav" content.*

**Step 3: Commit**
```bash
git add frontend/src/design-system/layout/AppShell.tsx frontend/src/App.tsx
git commit -m "feat(layout): implement AppShell and integrate into App.tsx"
```

### Task 5: Secondary Sidebar (Context Panel)

**Files:**
- Create: `frontend/src/design-system/layout/SecondarySidebar.tsx`

**Step 1: Implement SecondarySidebar**
A resizable or fixed-width (240px-300px) panel next to the primary rail.
Background: Slightly lighter/different shade than Primary, distinct from Main.
Header: Title of the current module (e.g., "Inbox", "Channels").
Content: Scrollable list area.

**Step 2: Commit**
```bash
git add frontend/src/design-system/layout/SecondarySidebar.tsx
git commit -m "feat(layout): implement secondary sidebar container"
```

### Task 6: Migration - Chat Module (Example)

**Files:**
- Modify: `frontend/src/features/chat/ChatLayout.tsx` (or equivalent)

**Step 1: Adapt Chat to New Layout**
Move the "Channel List" into the `SecondarySidebar` slot of the `AppShell`.
Keep the "Chat Window" in the `MainContent` area.

**Step 2: Commit**
```bash
git add frontend/src/features/chat/ChatLayout.tsx
git commit -m "refactor(chat): migrate chat module to hybrid layout"
```

### Task 7: Cleanup

**Files:**
- Remove: `frontend/src/components/OldLayout.tsx` (if exists)

**Step 1: Remove unused layout code**

**Step 2: Commit**
```bash
git commit -m "chore(cleanup): remove legacy layout components"
```
