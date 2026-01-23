# Frontend Test Setup Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize a testing infrastructure for the Frontend (React + Vite) and write smoke tests for critical features (Auth, Board) to prevent future regressions.

**Architecture:**
- **Test Runner:** Vitest (fast, compatible with Vite)
- **Environment:** jsdom (browser simulation)
- **Utilities:** React Testing Library (component testing), user-event (interaction)
- **Mocking:** MSW (Mock Service Worker) for API mocking

**Tech Stack:** Vitest, React Testing Library, MSW

---

### Task 1: Install Dependencies & Configure Vitest

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`

**Step 1: Install Packages**
Install `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.

**Step 2: Configure Vitest**
Create `vitest.config.ts` (merging with vite config or standalone).
- Set `environment: 'jsdom'`
- Set `setupFiles: ['./src/test/setup.ts']`
- Define aliases (if needed)

**Step 3: Setup File**
Create `frontend/src/test/setup.ts`:
- Import `@testing-library/jest-dom`
- Clean up after each test

---

### Task 2: Create Test Utilities (Render w/ Providers)

**Files:**
- Create: `frontend/src/test/utils.tsx`

**Step 1: Custom Render**
Create a `renderWithProviders` helper that wraps components in:
- `QueryClientProvider` (TanStack Query)
- `MemoryRouter` (React Router)
- `AuthProvider` (if needed, or mock the store)

---

### Task 3: Write Smoke Tests for Board Feature

**Files:**
- Create: `frontend/src/features/board/components/DocumentList.test.tsx` (or similar)

**Step 1: Mock API**
Mock the `useDocumentsOwned` hook or the API call using Vitest mocks or MSW.

**Step 2: Write Test**
- Render `BoardPage` (or specific component).
- Verify it renders the document list.
- Verify "Upload" button presence.

---

### Task 4: Run Tests & CI Check

**Files:**
- Modify: `frontend/package.json` (add `test` script)

**Step 1: Add Script**
Add `"test": "vitest"` to `scripts`.

**Step 2: Run**
Execute `npm test` and verify pass.
