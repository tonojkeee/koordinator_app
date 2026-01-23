# Team Chat Application

Modular monolith with FastAPI backend and React frontend, supporting real-time chat, email, task management, and document sharing.

## Quick Start

**Backend**: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 5100`
**Frontend**: `cd frontend && npm run dev`
**Migrations**: `cd backend && alembic upgrade head`

## Build & Test Commands

### Backend (Python/FastAPI)

```bash
# Development
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 5100

# Testing
# Run all tests
python -m pytest tests/ -v

# Run single test file
python -m pytest tests/test_module.py -v

# Run specific test
python -m pytest tests/test_module.py::test_function_name -v

# Tests with coverage
python -m pytest --cov=app tests/

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Code formatting
black app/ tests/
```

### Frontend (TypeScript/React)

```bash
# Development
cd frontend
npm install
npm run dev

# Production build
npm run build
npm run preview

# Code quality
npm run lint
npx tsc --noEmit

# Desktop (optional)
npm run electron:dev
npm run electron:build
```

## Architecture Decisions

- **Backend**: FastAPI with async/await throughout, SQLAlchemy 2.0 async models
- **Frontend**: React 19 with TypeScript, Zustand for state, TanStack Query for server state
- **Styling**: Tailwind CSS v4 with design system components
- **Database**: SQLite with Alembic migrations (PostgreSQL supported)
- **Real-time**: WebSocket connections for chat and notifications

## Code Style Guidelines

### Python/FastAPI Conventions

**Imports**:
- Order: stdlib → third-party → local (blank lines between groups)
- Use absolute imports: `from app.modules.auth.models import User`
- Import specific classes/functions: `from typing import Optional`

**Naming**:
- Classes: PascalCase (`UserService`, `UserBase`)
- Functions/variables: snake_case (`get_current_user`, `user_id`)
- Constants: UPPER_SNAKE_CASE (`SECRET_KEY`, `DEBUG`)
- Private: `_internal_method`, `__private_field`

**Type Hints**:
- Always use type hints for functions
- Use `Optional[T]` for nullable values
- Use `Mapped[T]` for SQLAlchemy models (modern syntax)
- Use `dict[str, Any]` for generic dicts (Python 3.9+)

**Async Patterns**:
- Always use `async/await` for DB operations
- Use `AsyncSession` from `sqlalchemy.ext.asyncio`
- Use `Depends()` for dependency injection
- Proper lifespan management in FastAPI apps

**Error Handling**:
- Use FastAPI's `HTTPException` with `status.HTTP_*` constants
- Log errors before raising: `logger.error(f"Error: {e}", exc_info=True)`
- Never expose sensitive data in error messages

**Database**:
- Use SQLAlchemy 2.0 async models with `Mapped` syntax
- Define relationships using `relationship()`
- Add indexes on frequently queried fields
- Use `datetime.now(timezone.utc)` for timestamps

### TypeScript/React Conventions

**Imports**:
- React imports first: `import React from 'react'`
- Third-party packages next: `import { useQuery } from '@tanstack/react-query'`
- Relative imports last: `import { Avatar } from '../components'`
- Sort alphabetically within groups

**Naming**:
- Components: PascalCase (`UserAvatar`, `ChatList`)
- Functions/variables: camelCase (`fetchUsers`, `userName`)
- Types/Interfaces: PascalCase (`UserProps`, `ApiResponse`)
- Constants: UPPER_SNAKE_CASE only for truly global constants

**Type Definitions**:
- Define explicit interfaces for props
- Use `React.FC<Props>` for functional components
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, primitives, and utility types

**React Patterns**:
- Use functional components with hooks
- Prefer `useState` for simple state
- Use custom hooks for reusable logic
- Use `useMemo`/`useCallback` for expensive computations
- Key lists properly with stable identifiers

**State Management**:
- Use Zustand for global state
- Use TanStack Query for server state (caching, refetching)
- Keep component state local when possible
- Avoid prop drilling (use Context or Zustand)

**Styling**:
- Use Tailwind CSS v4 utility classes
- Prefer `className` over `style` prop
- Use design-system components when available
- Responsive-first: `md:w-1/2`, `lg:flex-row`
- Use `cn()` utility for conditional classes

**Error Handling**:
- Handle async errors in try/catch blocks
- Display user-friendly error messages
- Log errors to console in development
- Show toast notifications for user feedback

## Project Structure

**Backend**: `app/modules/{module_name}/` with models.py, schemas.py, service.py, router.py, handlers.py
**Frontend**: `src/features/{feature_name}/` with components, types, API clients, hooks

## Testing

**Backend**: pytest with pytest-asyncio, mark test functions with `@pytest.mark.asyncio`
**Frontend**: React Testing Library, test user interactions not implementation

## Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt/argon2
- Input validation with Pydantic
- CSRF protection on state-changing endpoints
- File upload validation and sanitization
- Never commit secrets to repository

## Detailed Guidelines

- [Python/FastAPI Conventions](docs/python-conventions.md)
- [TypeScript/React Conventions](docs/typescript-conventions.md)
- [Testing Guidelines](docs/testing.md)
- [Security Requirements](docs/security.md)
- [Project Structure](docs/project-structure.md)
- [Common Patterns](docs/common-patterns.md)
