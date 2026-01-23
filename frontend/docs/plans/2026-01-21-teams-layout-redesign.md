# Teams-Like Layout Redesign Plan

## Objective
Refactor the application layout to match the professional, 3-pane "Teams" style structure.
Reference Architecture: **App Rail** -> **Context List** -> **Workspace** -> **Details Panel**.

## 1. Structural Redesign (CSS Grid)

We will implement a nested layout strategy using `react-router-dom` outlets.

### Level 1: `MainLayout.tsx` (App Shell)
*   **Grid**: `68px 1fr` (Fixed Nav Rail | Content Area)
*   **Component**: `<Sidebar />` (The thin dark rail)
*   **Child**: `<Outlet />` (Renders ChatLayout, AdminPage, etc.)

### Level 2: `ChatLayout.tsx` (New Component)
*   **Grid**: `300px 1fr` (Channel List | Conversation)
*   **Component**: `<ChannelSidebar />`
*   **Child**: `<Outlet />` (Renders ChatPage or EmptyState)
*   **Mobile**: Drawer behavior for the list.

### Level 3: `ChatPage.tsx` (Conversation)
*   **Flex**: Column (Header | MessageList | Input)
*   **Right Panel**: `<ParticipantsList />` (Collapsible, 280px)

## 2. Visual Style Guide (Reference Match)

### Colors
*   **App Rail**: `bg-[#2D2F3F]` (Dark Slate/Blue)
*   **Active Tab**: `bg-[#4F52B2]` (Indigo Accent) with White Text
*   **List Pane**: `bg-[#F5F5F7]` (Light Gray)
*   **Content Area**: `bg-white` or very light gray `#FAFAFA`
*   **Headers**: White background, `border-b border-slate-200`, `h-14`

### Components
1.  **Sidebar (App Rail)**:
    *   Width: `w-[68px]` (Collapsed)
    *   Icons: `text-slate-400`, `hover:text-white`
    *   Active: Left border indicator or filled rounded square.

2.  **Channel List**:
    *   Header: "Chat" / "Teams" title with Search.
    *   Items: Hover effect `hover:bg-white` with shadow.

3.  **Message Cards**:
    *   Style: White cards `bg-white rounded-lg shadow-sm border border-slate-100`.
    *   Avatars: Square-ish rounded `rounded-xl`.

## 3. Implementation Steps

1.  **Create `ChatLayout.tsx`**: Move `ChannelSidebar` out of `ChatPage`.
2.  **Update Routes**: Nest `ChatPage` under `ChatLayout`.
3.  **Refactor `MainLayout`**: Switch to the thin rail design.
4.  **Refactor `ChatPage`**: Remove sidebar logic, focus on content.
5.  **Apply Styles**: Implement the color palette and shadow depth.
