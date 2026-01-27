# Plan: Fixing Chat Permission Tests

## Context
The `test_create_public_channel` test fails with `403 Forbidden`.
The backend logic (`app/modules/chat/router.py`) enforces that only **admins** or users with `chat_allow_create_channel=True` config can create channels.
Our test helper `get_auth_headers` creates a default user with `role="user"` and defaults config settings (which likely default to restricting channel creation).

## Goals
1.  **Fix Permissions**: Ensure the test user has permission to create channels.
2.  **Strategy**:
    *   **Option A**: Make the test user an "admin".
    *   **Option B**: Update the system config in the test database to allow users to create channels.
    *   **Chosen Approach**: Make the test user an **admin** for channel management tests, as this is the most reliable way to bypass permission checks without relying on default config values.

## 1. Update Test Helper (`tests/modules/chat/test_chat_channels.py`)
Modify `get_auth_headers` to accept a `role` argument (defaulting to "user").
Update `test_create_public_channel` to request an "admin" user.

## 2. Execution Strategy
*   Modify `tests/modules/chat/test_chat_channels.py`.
*   Run tests.
