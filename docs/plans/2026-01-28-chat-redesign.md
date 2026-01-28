# Chat Redesign Implementation Plan: Modern Bubbles & Sidebar

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Redesign the Chat interface with a modern, professional aesthetic ("Messenger/Slack" style), implementing cleaner message bubbles and a refined, less cluttered channel sidebar.

**Architecture:**
- **Sidebar**: Simplify `ChannelSidebar` by reducing visual noise (lines, excessive separators), improving typography hierarchy, and making grouping collapsible/cleaner.
- **Message List**: Refactor the message rendering loop in `ChatPage.tsx` into a reusable `MessageList` component.
- **Bubbles**: Update message styling to be softer, less "2010s bubble", and more consistent with the new design system (Comfortable density).
- **Styling**: Use existing Tailwind tokens but apply them for a more refined look (subtle shadows, specific border radii for groups).

**Tech Stack:** React 19, Tailwind CSS v4, Lucide Icons.

---

### Task 1: Refactor Message Rendering (Cleanup)

**Files:**
- Create: `frontend/src/features/chat/components/MessageList.tsx`
- Create: `frontend/src/features/chat/components/MessageBubble.tsx`
- Modify: `frontend/src/features/chat/ChatPage.tsx`

**Step 1: Create MessageBubble Component**
Extract the bubble rendering logic from `ChatPage.tsx` into `MessageBubble.tsx`.
Props: `message`, `isSelf`, `isLastInGroup`, `showAvatar`, `onReply`, `onReact`, `onEdit`, `onDelete`.

**Step 2: Create MessageList Component**
Create a component that takes `messages` array, groups them by date/sender, and renders `MessageBubble`s.
Move the "grouping" logic (isLastInGroup, showAvatar) here.

**Step 3: Integrate into ChatPage**
Replace the massive mapping loop in `ChatPage.tsx` with `<MessageList />`.

**Step 4: Commit**
```bash
git add frontend/src/features/chat/components/MessageList.tsx frontend/src/features/chat/components/MessageBubble.tsx frontend/src/features/chat/ChatPage.tsx
git commit -m "refactor(chat): extract MessageList and MessageBubble components"
```

### Task 2: Redesign Message Bubbles

**Files:**
- Modify: `frontend/src/features/chat/components/MessageBubble.tsx`

**Step 1: Modernize Styling**
- **Shape**: Reduce border-radius for a sharper, more professional look (e.g., `rounded-2xl` -> `rounded-lg`).
- **Colors**:
    - Sent: Use the new `brand-primary` (`bg-blue-600` or similar) but maybe slightly desaturated or softer. Text white.
    - Received: Use `bg-slate-100` (or `bg-surface-2`) with `text-slate-900`.
- **Spacing**: Reduce padding inside bubbles (`p-3` -> `px-4 py-2`).
- **Metadata**: Move timestamp to the bottom right of the bubble (inside) or next to it, smaller and lighter (`text-xs text-slate-400`).

**Step 2: Commit**
```bash
git add frontend/src/features/chat/components/MessageBubble.tsx
git commit -m "design(chat): modernize message bubble styling"
```

### Task 3: Redesign Channel Sidebar

**Files:**
- Modify: `frontend/src/features/chat/ChannelSidebar.tsx`
- Modify: `frontend/src/features/chat/components/ChannelItem.tsx` (if exists, or extract it)

**Step 1: Cleanup Sidebar Header**
Remove heavy borders. Make the search bar cleaner (integrated into background or simpler border).
Move "Create" button to a more subtle icon action.

**Step 2: Simplify Channel Groups**
Use `details/summary` or custom collapsible headers for "Public Spaces", "Private Spaces", etc.
Style headers: Uppercase, small, tracking-wide, text-slate-500 (VS Code style).

**Step 3: Refine Channel Item**
- Remove "last message" snippet from the list to reduce density (optional, or make it truncate better).
- Focus on Avatar + Name.
- Unread badge: Simple blue dot or number on the right.
- Active state: Subtle background tint (`bg-blue-50`) with a vertical bar marker (reuse `SidebarItem` logic or similar).

**Step 4: Commit**
```bash
git add frontend/src/features/chat/ChannelSidebar.tsx
git commit -m "design(chat): redesign channel sidebar for professional look"
```

### Task 4: Polish & Integration

**Files:**
- Modify: `frontend/src/features/chat/ChatPage.tsx` (Header area)

**Step 1: Update Chat Header**
Make the header in `ChatPage` match the new aesthetic.
- Title: Larger, bold.
- Subtitle: Member count/Online status.
- Actions: Clean icon buttons on the right (Search, Call, Info).

**Step 2: Commit**
```bash
git add frontend/src/features/chat/ChatPage.tsx
git commit -m "design(chat): polish chat header and final integration"
```
