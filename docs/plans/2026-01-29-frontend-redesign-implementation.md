# Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement the "Enterprise Data-Dense" design system and redesign the application shell to use a 3-pane layout, establishing the foundation for the full app redesign.

**Architecture:** Use CSS Variables mapped to Tailwind v4 theme configuration to drive a strict token system. Replace the existing layout with a fixed-viewport, 3-pane "Command Center" layout.

**Tech Stack:** React 19, Tailwind CSS v4, CSS Variables, TypeScript.

---

### Task 1: Design Tokens & Theme Setup

**Goal:** Establish the CSS variable foundation for the new design system.

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`

**Step 1: Update CSS Variables in index.css**

Replace the existing theme definition with the new Enterprise tokens.

**Code to Write (`frontend/src/index.css`):**
```css
@import "tailwindcss";

@theme {
  /* Color Palette Maps */
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);

  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);

  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);

  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);

  /* Border Radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  /* Animations */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;

  @keyframes accordion-down {
    from { height: 0 }
    to { height: var(--radix-accordion-content-height) }
  }
  @keyframes accordion-up {
    from { height: var(--radix-accordion-content-height) }
    to { height: 0 }
  }
}

/* Base Theme Variables */
:root {
  --background: 0 0% 100%;       /* White */
  --foreground: 222 47% 11%;     /* Dark Slate */

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --primary: 221.2 83.2% 53.3%;  /* Brand Blue */
  --primary-foreground: 210 40% 98%;

  --secondary: 210 40% 96.1%;    /* Light Gray */
  --secondary-foreground: 222 47% 11%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215 16% 47%;

  --accent: 210 40% 96.1%;
  --accent-foreground: 222 47% 11%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214 32% 91%;         /* Slate-200 - CRITICAL */
  --input: 214 32% 91%;
  --ring: 221.2 83.2% 53.3%;

  --radius: 0.5rem;
}

.dark {
  --background: 222 47% 11%;     /* Dark Slate Base */
  --foreground: 210 40% 98%;

  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;

  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 98%;

  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222 47.1% 11.2%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 217.2 32.6% 17.5%;   /* Slate-800 */
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}
```

**Step 2: Update Tailwind Config**

Ensure `tailwind.config.js` is minimal and relies on the CSS variables.

**Code to Write (`frontend/tailwind.config.js`):**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Extended config if needed beyond CSS variables
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

**Step 3: Commit**
```bash
git add frontend/src/index.css frontend/tailwind.config.js
git commit -m "feat(design): implement enterprise design tokens and theme"
```

---

### Task 2: Core Primitive Components (Button)

**Goal:** Update `Button` to match the "flat/compact" aesthetic.

**Files:**
- Modify: `frontend/src/design-system/components/Button.tsx`

**Step 1: Update Button Variants**

Remove large paddings and shadows. Enforce strict borders for outlines.

**Code to Write (`frontend/src/design-system/components/Button.tsx`):**
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs", // Compact size
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
// ... rest of component stays same
```

**Step 2: Commit**
```bash
git add frontend/src/design-system/components/Button.tsx
git commit -m "refactor(ui): update button component to enterprise style"
```

---

### Task 3: App Shell & Layout Structure

**Goal:** Implement the "3-Pane Command Center" layout.

**Files:**
- Modify: `frontend/src/design-system/layout/AppShell.tsx`
- Modify: `frontend/src/design-system/layout/PrimarySidebar.tsx`
- Modify: `frontend/src/design-system/layout/SecondarySidebar.tsx`

**Step 1: Refactor AppShell**

Create the fixed 3-pane grid.

**Code to Write (`frontend/src/design-system/layout/AppShell.tsx`):**
```typescript
import { Outlet } from "react-router-dom";
import { PrimarySidebar } from "./PrimarySidebar";
import { SecondarySidebar } from "./SecondarySidebar";

export const AppShell = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Pane 1: Primary Navigation (Rail) */}
      <PrimarySidebar />

      {/* Pane 2: Context Navigation (List) */}
      <SecondarySidebar />

      {/* Pane 3: Main Workspace (Stage) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background relative z-0">
        <Outlet />
      </main>
    </div>
  );
};
```

**Step 2: Update PrimarySidebar (Rail)**

Make it a slim, dark/contrast rail.

**Code to Write (`frontend/src/design-system/layout/PrimarySidebar.tsx`):**
```typescript
// Imports...

export const PrimarySidebar = () => {
  // Navigation items logic...

  return (
    <nav className="w-[64px] flex flex-col items-center py-4 bg-slate-50 dark:bg-slate-900 border-r border-border h-full z-20 flex-shrink-0">
       {/* Logo / Brand Icon */}
       <div className="mb-6">
         {/* ... */}
       </div>

       {/* Nav Items */}
       <div className="flex flex-col gap-2 w-full px-2">
          {/* Use Tooltip for labels since text won't fit */}
          {/* Map navigation items */}
       </div>

       {/* Footer / User Profile */}
       <div className="mt-auto">
          {/* ... */}
       </div>
    </nav>
  );
};
```

**Step 3: Update SecondarySidebar (Resizable List)**

**Code to Write (`frontend/src/design-system/layout/SecondarySidebar.tsx`):**
```typescript
import { useState } from "react";
// Imports...

export const SecondarySidebar = () => {
  // Logic to determine content based on active route...

  return (
    <aside className="w-[280px] flex flex-col h-full bg-background border-r border-border z-10 flex-shrink-0 transition-all duration-300">
      <div className="h-14 border-b border-border flex items-center px-4 flex-shrink-0">
         <h2 className="text-sm font-semibold tracking-tight">Context Title</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
         {/* List Items */}
      </div>
    </aside>
  );
};
```

**Step 4: Commit**
```bash
git add frontend/src/design-system/layout/
git commit -m "feat(layout): implement 3-pane command center layout"
```

---

### Task 4: Input & Form Components

**Goal:** Update `Input` and form elements to match the "flat" style.

**Files:**
- Modify: `frontend/src/design-system/components/Input.tsx`

**Step 1: Update Input Styles**

**Code to Write (`frontend/src/design-system/components/Input.tsx`):**
```typescript
import * as React from "react"
import { cn } from "../../utils/cn"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**Step 2: Commit**
```bash
git add frontend/src/design-system/components/Input.tsx
git commit -m "refactor(ui): update input component style"
```
