# Critical Issues Analysis

Based on the architectural audit of the codebase, the following critical issues and risks have been identified:

## 1. Architectural Integrity
### 🚨 Embedded SMTP Server (High Severity)
- **Issue:** The SMTP server is initialized and run within the FastAPI application's lifespan event (`backend/app/main.py`).
- **Impact:** 
  - Prevents horizontal scaling. If you run multiple Uvicorn workers (e.g., for production), only the first worker can bind to port 2525. Others will fail with `Address already in use`.
  - Increases application startup time and complexity.
  - A crash in the SMTP thread could destabilize the main API process.
- **Recommendation:** Extract the SMTP server into a separate process/service managed by a supervisor (e.g., Docker, Systemd).

## 2. Data Consistency
### ⚠️ Manual Cascading Deletes (Medium Severity)
- **Issue:** `UserService.delete_user` (`backend/app/modules/auth/service.py`) manually deletes related records from Board, Chat, and Email modules.
- **Impact:** 
  - High maintenance burden. Every time a new module links to `User`, developers must remember to update this method.
  - Risk of "orphaned data" (zombie records) if the manual deletion logic misses a relationship or fails midway.
- **Recommendation:** Rely on Database Foreign Keys with `ON DELETE CASCADE` for data integrity. Use Domain Events for non-DB cleanup (e.g., file deletion).

## 3. Configuration & Security
### ⚠️ Secret Management (Medium Severity)
- **Issue:** While there are checks for weak keys, the fallback mechanisms and default values in `config.py` can encourage insecure deployments if environment variables are missing.
- **Recommendation:** Enforce strict failure in production mode if secrets are missing, rather than logging warnings.

## 4. Performance
### ⚠️ Blocking Operations
- **Issue:** The SMTP server runs in a `threading.Thread`. While Python threads are okay for I/O, heavy processing in the email handler could impact the GIL and slightly affect the async API performance under load.
- **Recommendation:** Run SMTP as a standalone `asyncio` service or independent process.

---

# Action Plan

## Phase 1: Fix Critical Architecture (SMTP)
1.  Create a dedicated entry point script for the SMTP server (`backend/app/services/smtp_runner.py`).
2.  Remove SMTP startup logic from `backend/app/main.py`.
3.  Update `docker-compose.yml` or run scripts to launch SMTP as a separate container/service.

## Phase 2: Improve Data Integrity
1.  Review SQLAlchemy models. Ensure `relationship(..., cascade="all, delete-orphan")` and DB-level `ForeignKey(..., ondelete="CASCADE")` are correctly set.
2.  Refactor `UserService.delete_user` to rely on these mechanisms.
3.  Implement an Event Bus listener for `USER_DELETED` to handle file system cleanup (avatars, document files) asynchronously.

## Phase 3: Hardening
1.  Refine `config.py` to be stricter in production mode.
2.  Add a comprehensive health check that verifies the SMTP service availability (since it's now separate).
