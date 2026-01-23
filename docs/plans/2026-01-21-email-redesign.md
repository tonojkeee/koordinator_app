# Email Service Redesign Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the email service to match the Outlook/Teams three-column layout while maintaining the project's design system.

**Architecture:**
- **Three-column layout**:
  1. **Folder Sidebar (240px)**: Navigation for system and custom folders.
  2. **Message List (360px)**: Search, Filter, and a scrollable list of email previews.
  3. **Message Detail (Flexible)**: Full email view with actions (Reply, Forward, Delete).
- **Responsive**: Col 1 hides on mobile; Col 2/3 toggle based on selection.

**Tech Stack**: React 19, Tailwind CSS v4, Lucide Icons.

---

### Task 1: Refactor EmailPage Layout Structure

**Files:**
- Modify: `frontend/src/features/email/EmailPage.tsx`

**Step 1: Implement the 3-column skeleton**

Update the main return statement to use a flex layout with three distinct sections.

```tsx
return (
  <div className="flex h-full w-full bg-white overflow-hidden">
    {/* Column 1: Folder Sidebar */}
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col">
       {/* Folder content */}
    </aside>

    {/* Column 2: Message List */}
    <section className="w-[400px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white">
       {/* List content */}
    </section>

    {/* Column 3: Message Detail */}
    <main className="flex-1 flex flex-col min-w-0 bg-white">
       {/* Detail content */}
    </main>
  </div>
);
```

### Task 2: Implement Folder Sidebar (Column 1)

**Files:**
- Modify: `frontend/src/features/email/EmailPage.tsx`

**Step 1: Style the sidebar according to mockup**
- Narrower, cleaner list items.
- "New Message" button at the top.
- Simplified account info.

### Task 3: Implement Message List (Column 2)

**Files:**
- Modify: `frontend/src/features/email/EmailPage.tsx`
- Modify: `frontend/src/features/email/components/EmailList.tsx`

**Step 1: Add Search and Tabs**
- Add search input at the top.
- Add "Focused" and "Other" tabs styling (even if just UI for now).
- Update `EmailList` items to match the snippet style (Sender bold, Subject, Date, 1-line Preview).

### Task 4: Implement Message Detail (Column 3)

**Files:**
- Modify: `frontend/src/features/email/EmailPage.tsx`
- Modify: `frontend/src/features/email/components/EmailDetails.tsx`

**Step 1: Clean up the detail view**
- Large subject line.
- Sender avatar and details.
- Clean body area.
- Action bar at the top (Reply, Forward, Delete).
