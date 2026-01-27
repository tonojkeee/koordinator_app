# Plan: PostgreSQL Support Implementation

## Context
The project currently supports SQLite and MySQL. To improve reliability and enable advanced testing strategies (using real databases in Docker), we need to add first-class support for PostgreSQL. This plan covers the backend driver integration and an Admin UI to monitor the database status.

## Goals
1.  **Backend**: Add `asyncpg` support and update configuration handling.
2.  **API**: Expose database connection status and pool statistics to admins.
3.  **Frontend**: Create a read-only "Database Status" card in the Admin Dashboard.

## 1. Backend Implementation

### 1.1 Dependencies
*   Add `asyncpg>=0.29.0` to `backend/requirements.txt`.

### 1.2 Configuration (`app/core/config.py`)
*   Update `Settings` class:
    *   Add `is_postgresql` property.
    *   Ensure `database_url` parsing handles `postgresql+asyncpg://`.

### 1.3 Database Engine (`app/core/database.py`)
*   Verify `create_engine_with_pool` handles the PostgreSQL dialect correctly.
*   Ensure connection arguments (like `json_serializer`) are compatible with `asyncpg` if needed (usually handled by SQLAlchemy).

### 1.4 Admin API (`app/modules/admin/router.py`)
*   Add endpoint: `GET /admin/system/database-status`
*   **Security**: `Depends(get_current_admin_user)`
*   **Logic**:
    *   Check `settings.database_url` dialect.
    *   Execute `SELECT version()` to get server version.
    *   Inspect `engine.pool` for stats (size, checked out, overflow).
*   **Response**:
    ```json
    {
        "type": "postgresql",
        "dialect": "postgresql+asyncpg",
        "database_name": "koordinator_db",
        "server_version": "PostgreSQL 15.4 ...",
        "pool_status": { "size": 10, "checked_out": 2, "overflow": 0 },
        "config_source": "environment"
    }
    ```

## 2. Frontend Implementation

### 2.1 API Client (`features/admin/api.ts`)
*   Add `getDatabaseStatus()` returning `Promise<DatabaseStatus>`.

### 2.2 UI Component (`features/admin/components/DatabaseStatusCard.tsx`)
*   Create a dashboard card component.
*   **Visuals**:
    *   **Status Icon**: Green (connected) / Red (error).
    *   **Main Info**: Database Type (PostgreSQL/MySQL/SQLite).
    *   **Details**: Version string.
    *   **Metrics**: Pool usage bar (Active / Total).
    *   **Badge**: "Configured via ENV".

### 2.3 Dashboard Integration (`features/admin/AdminDashboard.tsx`)
*   Fetch data using `useQuery` (key: `['admin', 'db-status']`).
*   Render the card in the "System Overview" grid.

## 3. Verification Plan
*   **Local Test**: Spin up a PostgreSQL container, update `.env` to point to it, and verify the app connects and migrations run.
*   **UI Test**: Check the Admin Dashboard to see "PostgreSQL" and correct version/pool stats.
