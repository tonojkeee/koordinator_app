# Teams UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the application UI to mimic Microsoft Teams, featuring a collapsible dark sidebar, structured channel list, card-based dashboard widgets, and a clean chat interface.

**Architecture:**
- **Layout:** `MainLayout` refactored to support a fixed sidebar with "Teams" style navigation tabs (Activity, Chat, Teams, Calendar, etc.) and a secondary "Context Sidebar" for sub-navigation (e.g., Channels within a Team).
- **Styling:** Tailwind CSS v4 with custom color palette matching Teams (Indigo/Slate themes).
- **State:** Zustand stores for layout state (collapsed sidebars, active tabs).

**Tech Stack:** React 19, Tailwind CSS v4, Lucide React Icons, Headless UI.

---

### Task 1: Design System & Theme Configuration

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

**Step 1: Update Tailwind Config**

Add Teams-specific colors and spacing to `tailwind.config.js`.

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        teams: {
          bg: '#F5F5F5', // Light gray background
          sidebar: '#2D2F3F', // Dark purple-ish sidebar
          sidebarHover: '#3D3E53',
          accent: '#6264A7', // Teams blurple
          header: '#FFFFFF',
        }
      }
    }
  }
}
```

**Step 2: Add Global Styles**

Update `index.css` to set base font and background.

```css
@theme {
  --font-outfit: "Outfit", sans-serif;
  --color-teams-bg: #F5F5F5;
  --color-teams-sidebar: #2D2F3F;
}

body {
  @apply bg-teams-bg text-slate-900 font-outfit;
}
```

**Step 3: Commit**

```bash
git add frontend/tailwind.config.js frontend/src/index.css
git commit -m "chore: add Teams design tokens to tailwind config"
```

---

### Task 2: Refactor Main Layout (App Shell)

**Files:**
- Modify: `frontend/src/components/layout/MainLayout.tsx`
- Create: `frontend/src/components/layout/SidebarNav.tsx`

**Step 1: Create SidebarNav Component**

Extract the navigation items into a reusable component that matches the "App Bar" style (icons on the far left).

```tsx
// frontend/src/components/layout/SidebarNav.tsx
import { MessageCircle, Users, Calendar, CheckSquare, FileText, MoreHorizontal } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { icon: MessageCircle, label: 'Chat', to: '/chat' },
  { icon: Users, label: 'Teams', to: '/teams' },
  { icon: Calendar, label: 'Calendar', to: '/calendar' },
  { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
  { icon: FileText, label: 'Files', to: '/files' },
];

export const SidebarNav = () => {
  return (
    <nav className="w-[68px] bg-teams-sidebar flex flex-col items-center py-4 space-y-4 text-slate-400">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-2 rounded w-full hover:text-white transition-colors ${
              isActive ? 'text-teams-accent border-l-4 border-teams-accent bg-white/5' : ''
            }`
          }
        >
          <item.icon size={24} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
      <div className="mt-auto">
        <button className="p-2 hover:text-white">
          <MoreHorizontal size={24} />
        </button>
      </div>
    </nav>
  );
};
```

**Step 2: Update MainLayout**

Replace the existing sidebar structure with the new `SidebarNav` and ensure the main content area handles the "Context Sidebar" (e.g., list of chats) correctly.

```tsx
// frontend/src/components/layout/MainLayout.tsx
import { SidebarNav } from './SidebarNav';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-teams-bg">
      {/* App Bar (Far Left) */}
      <SidebarNav />

      {/* Main Content Area (Includes Context Sidebar + Page Content) */}
      <div className="flex-1 flex min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
```

**Step 3: Commit**

```bash
git add frontend/src/components/layout/SidebarNav.tsx frontend/src/components/layout/MainLayout.tsx
git commit -m "feat: implement Teams-style sidebar navigation layout"
```

---

### Task 3: Implement Context Sidebar (Channel List)

**Files:**
- Modify: `frontend/src/features/chat/ChatLayout.tsx`
- Modify: `frontend/src/features/chat/ChannelSidebar.tsx`

**Step 1: Refactor ChatLayout**

Ensure `ChatLayout` renders the "Context Sidebar" (List of channels/chats) next to the "App Bar".

```tsx
// frontend/src/features/chat/ChatLayout.tsx
export const ChatLayout = () => {
  return (
    <div className="flex w-full h-full">
      {/* Context Sidebar (List of Chats) */}
      <aside className="w-80 bg-[#F0F0F0] border-r border-slate-200 flex flex-col">
        <div className="p-4 flex items-center justify-between">
           <h2 className="font-bold text-lg">Chat</h2>
           {/* Filter/New Chat Buttons */}
        </div>
        <ChannelSidebar /> {/* Existing component, needs styling tweaks */}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 bg-white rounded-tl-lg shadow-sm m-2 ml-0 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};
```

**Step 2: Style ChannelSidebar**

Update `ChannelSidebar.tsx` to match the "clean list" aesthetic (white background, hover effects, bold active state).

**Step 3: Commit**

```bash
git add frontend/src/features/chat/ChatLayout.tsx frontend/src/features/chat/ChannelSidebar.tsx
git commit -m "feat: add context sidebar for chat channels"
```

---

### Task 4: Teams Dashboard (Dashboard Page)

**Files:**
- Create: `frontend/src/features/teams/TeamsDashboard.tsx`
- Create: `frontend/src/components/ui/Card.tsx` (Reusable Widget)

**Step 1: Create Card Component**

```tsx
// frontend/src/components/ui/Card.tsx
export const Card = ({ title, children, actions }: any) => (
  <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {actions}
    </div>
    {children}
  </div>
);
```

**Step 2: Create Dashboard Grid**

Implement the grid layout seen in the mockup (Posts, Files, Tasks widgets).

```tsx
// frontend/src/features/teams/TeamsDashboard.tsx
import { Card } from '../../components/ui/Card';

export const TeamsDashboard = () => {
  return (
    <div className="p-6 grid grid-cols-12 gap-6 h-full overflow-y-auto">
      {/* Main Feed */}
      <div className="col-span-8 space-y-6">
        <Card title="Posts">
          {/* Feed Content */}
        </Card>
      </div>

      {/* Right Sidebar Widgets */}
      <div className="col-span-4 space-y-6">
        <Card title="Sprint Review Meeting">
           {/* Meeting Details */}
        </Card>
        <Card title="Prepare for the meeting!">
           {/* Checklist */}
        </Card>
        <Card title="Shared Files">
           {/* File List */}
        </Card>
      </div>
    </div>
  );
};
```

**Step 3: Commit**

```bash
git add frontend/src/features/teams/TeamsDashboard.tsx frontend/src/components/ui/Card.tsx
git commit -m "feat: implement Teams dashboard with widget grid"
```

