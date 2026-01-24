# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (Python/FastAPI)
- **Setup**: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
- **Run Server**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 5100` (in `backend/` with venv)
- **Run Tests**:
  - All tests: `python -m pytest tests/ -v`
  - Single file: `python -m pytest tests/test_module.py -v`
  - Specific test: `python -m pytest tests/test_module.py::test_function_name -v`
  - With coverage: `python -m pytest --cov=app tests/`
- **Lint/Format**: `black app/ tests/`
- **Database Migrations**:
  - Apply: `alembic upgrade head`
  - Create: `alembic revision --autogenerate -m "description"`

### Frontend (TypeScript/React)
- **Setup**: `cd frontend && npm install`
- **Run Dev**: `npm run dev` (starts on port 5173)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Type Check**: `npx tsc --noEmit`
- **Desktop App**: `npm run electron:dev` (dev) or `npm run electron:build` (build)

## Architecture & Structure

**Core Architecture**: Modular monolith. Backend uses FastAPI (async) + SQLAlchemy 2.0 + SQLite/MySQL. Frontend uses React 19 + TypeScript + Vite + Zustand + TanStack Query.

### Backend Structure (`backend/`)
- **App Core**: `app/core/` contains shared utilities (database, security, config, websocket manager).
- **Modules**: `app/modules/` implements the "Modular Monolith" pattern. Each directory (auth, chat, email, etc.) contains:
  - `models.py`: SQLAlchemy async models (using `Mapped` syntax).
  - `schemas.py`: Pydantic models for request/response.
  - `service.py`: Business logic and database interactions.
  - `router.py`: FastAPI route definitions.
- **Async**: Uses `async/await` throughout, including DB operations (`AsyncSession`).

### Frontend Structure (`frontend/src/`)
- **Features**: `features/` mirrors backend modules (auth, chat, email, etc.). Each contains components, API calls, and types specific to that feature.
- **State**:
  - Global UI state: **Zustand** stores (`store/`).
  - Server state: **TanStack Query** (useQuery/useMutation) for caching and data fetching.
- **Styling**: **Tailwind CSS v4**. Use `cn()` utility for class merging.
- **Communication**: WebSocket hooks in `hooks/` for real-time updates (chat, notifications).

### Key Patterns
- **Database**: SQLAlchemy 2.0 style with `Mapped[type]`. Always use `async` sessions.
- **API**: Backend returns Pydantic models. Frontend uses axios + TanStack Query hooks.
- **WebSockets**: Used for real-time chat and notifications.
- **Security**: JWT auth, Pydantic validation, bcrypt password hashing.

## Code Style & Conventions

- **Python**:
  - Snake_case for functions/variables, PascalCase for classes.
  - Type hints are mandatory (`def fn(x: int) -> str:`).
  - Use `dict[str, Any]` (Python 3.9+) instead of `Dict`.
  - Sort imports: stdlib -> third-party -> local (absolute imports preferred).
- **TypeScript**:
  - CamelCase for functions/vars, PascalCase for components/interfaces.
  - Prefer `interface` over `type` for objects.
  - No `any` (use `unknown` if needed).
  - Functional components with hooks only.
