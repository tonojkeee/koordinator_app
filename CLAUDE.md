# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI)
- **Install Dependencies**: `cd backend && pip install -r requirements.txt`
- **Run Development Server**: `cd backend && uvicorn app.main:app --reload --port 5100`
- **Run Tests (Full)**: `cd backend && python -m pytest tests/ -v`
- **Run Single Test**: `cd backend && python -m pytest tests/<path_to_test>.py -v`
- **Lint/Format**: `cd backend && black app/ tests/`
- **Database Migrations**: `cd backend && alembic upgrade head`

### Frontend (React + Vite + Electron)
- **Install Dependencies**: `cd frontend && npm install`
- **Run Development Server**: `cd frontend && npm run dev`
- **Build (Web)**: `cd frontend && npm run build`
- **Build (Desktop)**: `cd frontend && npm run electron:build`
- **Lint**: `cd frontend && npm run lint`
- **Type Check**: `cd frontend && npx tsc --noEmit`
- **Run Desktop App (Dev)**: `cd frontend && npm run electron:dev`

## Architecture & Code Structure

### High-Level Architecture
The project is a **Modular Monolith** designed for secure internal communication.
- **Backend**: Python 3.13+, FastAPI, SQLAlchemy 2.0 (Async), Alembic.
- **Frontend**: TypeScript, React 19, Tailwind CSS v4, Zustand (State), TanStack Query v5 (Server State).
- **Desktop**: Electron wrapper for the React application.

### Key Directories
- `backend/app/core/`: Core functionality (database setup, security, WebSocket manager).
- `backend/app/modules/`: Business modules (auth, chat, email, tasks, board, archive, admin, zsspd).
- `frontend/src/features/`: Feature-based frontend modules corresponding to backend modules.
- `frontend/src/design-system/`: Shared UI components and styling.
- `electron/`: Electron main process code.
- `docs/`: Detailed technical documentation and conventions.

### Coding Patterns
- **Async First**: Use `async/await` for database operations and external API calls.
- **Feature-Based**: Organize code by feature (e.g., `features/chat/`) rather than technical role where possible.
- **Type Safety**: Maintain strict TypeScript types in the frontend and Pydantic schemas in the backend.
- **State Management**: Use Zustand for client-side state and TanStack Query for server-side state synchronization.
