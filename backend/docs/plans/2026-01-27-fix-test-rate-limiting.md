# Plan: Resolving Backend Test Rate Limiting

## Context
The backend tests for the chat module (`tests/modules/chat/test_chat_channels.py`) are failing with `429 Too Many Requests`. This is because the `get_auth_headers` helper function is called multiple times in rapid succession, triggering the login rate limiter (`rate_limit_auth`).

## Goals
1.  **Disable Rate Limiting in Tests**: Configure the application to bypass or increase limits during testing.
2.  **Verify**: Ensure tests pass reliably without 429 errors.

## 1. Disable Rate Limiting via Environment Variable
*   The `app.core.rate_limit` module likely checks for configuration.
*   We can mock the rate limiter or, simpler, override the dependency.
*   However, `fastapi-limiter` usually relies on Redis. In tests, if Redis is mocked or missing, it might fall back to memory or behave unexpectedly.
*   **Strategy**: Override the `rate_limit_auth` dependency in `conftest.py` to do nothing.

## 2. Implementation Steps (`backend/tests/conftest.py`)
*   Import `rate_limit_auth` from `app.core.rate_limit`.
*   Add an override to `app.dependency_overrides` in the `client` fixture (or a global autouse fixture).
*   The override should be an async function that returns `None` (or whatever the dependency expects).

## 3. Revised `conftest.py`
We will update `conftest.py` to include this override.

## 4. Execution Strategy
*   Update `conftest.py`.
*   Run tests.
